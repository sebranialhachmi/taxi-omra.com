// One-off data migrations for databases that were already seeded. Each runs once
// (recorded in data_migrations); a fresh database gets the cleaned seed and these find nothing to do.
import * as riyadh from "./riyadh.mjs";
import * as unserved from "./unserved.mjs";
import { priorityFor } from "./release-rules.mjs";

const parseJson = (v) => { try { return JSON.parse(v); } catch { return v; } };

async function cleanTable(conn, table, log, { mentions, cleanRow, overridesFor = () => ({}), deleteIf }) {
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  let edited = 0;
  let removed = 0;
  for (const r of rows) {
    if (deleteIf?.(r)) {
      await conn.query(`DELETE FROM \`${table}\` WHERE id = ?`, [r.id]);
      removed++;
      continue;
    }
    const row = { ...r };
    for (const c of ["keywords", "tags"]) if (typeof row[c] === "string") row[c] = parseJson(row[c]);
    const changes = cleanRow(row, overridesFor(r));
    if (!changes) continue;
    const cols = Object.keys(changes);
    const vals = cols.map((c) => (Array.isArray(changes[c]) ? JSON.stringify(changes[c]) : changes[c]));
    await conn.query(`UPDATE \`${table}\` SET ${cols.map((c) => `\`${c}\` = ?`).join(",")} WHERE id = ?`, [...vals, r.id]);
    edited++;
  }
  void mentions;
  log(`${table}: ${removed} removed, ${edited} cleaned`);
}

const faqOverride = (r) =>
  Object.entries(unserved.FAQ_OVERRIDES).find(([k]) => (r.question_ar ?? "").startsWith(k))?.[1] ?? {};

async function removeUnservedCities(conn, log) {
  const m = { mentions: unserved.mentionsUnserved, cleanRow: (row, ov) => unserved.cleanRow(row, ov) };
  await cleanTable(conn, "pages", log, { ...m, overridesFor: (r) => unserved.OVERRIDES[r.slug] ?? {}, deleteIf: (r) => unserved.isUnservedSlug(r.slug) });
  await cleanTable(conn, "posts", log, { ...m, overridesFor: (r) => unserved.OVERRIDES[r.slug] ?? {} });
  await cleanTable(conn, "faqs", log, {
    ...m,
    overridesFor: faqOverride,
    deleteIf: (r) => unserved.mentionsUnserved(r.question_ar) || unserved.mentionsUnserved(r.question_en),
  });
  await conn.query("DELETE FROM `prices` WHERE `category` = 'dammam' OR `code` LIKE '%dmm%'");
}

const MIGRATIONS = [
  {
    name: "2026-10-24-remove-riyadh",
    async run(conn, log) {
      const m = { mentions: riyadh.mentionsRiyadh, cleanRow: (row, ov) => riyadh.cleanRow(row, ov) };
      await cleanTable(conn, "pages", log, { ...m, overridesFor: (r) => riyadh.OVERRIDES[r.slug] ?? {}, deleteIf: (r) => riyadh.isRiyadhSlug(r.slug) });
      await cleanTable(conn, "posts", log, m);
      await cleanTable(conn, "faqs", log, { ...m, deleteIf: (r) => riyadh.mentionsRiyadh(r.question_ar) || riyadh.mentionsRiyadh(r.question_en) });
      await conn.query("DELETE FROM `prices` WHERE `category` = 'riyadh' OR `code` LIKE '%ruh%' OR `code` LIKE '%riyadh%'");
    },
  },
  {
    // The business does not serve the Eastern Province, Qassim, Hail, the south or the north-west.
    name: "2026-10-24-remove-unserved-cities",
    run: removeUnservedCities,
  },
  {
    // ...nor Yanbu or King Abdullah Economic City (the cleaner now knows these terms too).
    name: "2026-10-25-remove-yanbu-kaec",
    run: removeUnservedCities,
  },
  {
    // Start the gradual release: everything is hidden from Google again, items get a release
    // order, and the first run shows the six most important ones; after that the scheduler adds
    // a few every few days (see src/server/release.server.ts).
    name: "2026-10-24-initial-release-plan",
    async run(conn, log) {
      for (const table of ["pages", "posts"]) {
        const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
        for (const r of rows) {
          await conn.query(`UPDATE \`${table}\` SET \`release_priority\` = ?, \`seo_released\` = 0, \`released_at\` = NULL WHERE id = ?`, [priorityFor({ ...r, seo_released: Boolean(r.seo_released) }, table), r.id]);
        }
        log(`${table}: release order set for ${rows.length}`);
      }
      for (const [k, v] of [["auto_release_first_batch", "6"], ["auto_release_last_at", ""]]) {
        await conn.query("INSERT INTO `settings` (`k`,`v`) VALUES (?,?) ON DUPLICATE KEY UPDATE `v` = VALUES(`v`)", [k, JSON.stringify(v)]);
      }
    },
  },
];

export async function runDataMigrations(conn, log = () => {}) {
  await conn.query(
    "CREATE TABLE IF NOT EXISTS `data_migrations` (`name` VARCHAR(190) PRIMARY KEY, `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  );
  const [done] = await conn.query("SELECT `name` FROM `data_migrations`");
  const seen = new Set(done.map((r) => r.name));
  for (const m of MIGRATIONS) {
    if (seen.has(m.name)) continue;
    log(`migration ${m.name}`);
    await m.run(conn, log);
    await conn.query("INSERT INTO `data_migrations` (`name`) VALUES (?)", [m.name]);
  }
}
