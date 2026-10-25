// One-off data migrations for databases that were already seeded. Each runs once
// (recorded in data_migrations); a fresh database gets the cleaned seed and these find nothing to do.
import * as riyadh from "./riyadh.mjs";
import * as unserved from "./unserved.mjs";
import { priorityFor } from "./release-rules.mjs";
import { cleanPrices, validPrices, cleanMetaPrices, META_PRICE_FIELDS } from "./prices-clean.mjs";

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
    // An earlier version of the cleaners had a regex that could swallow everything between two
    // headings and emptied most of the text of ~15 pages. Rows whose text is now much shorter
    // than the (fixed) seed get it back from the seed.
    name: "2026-10-25-restore-damaged-content",
    async run(conn, log, ctx) {
      const plain = (h) => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
      for (const [table, cols] of [["pages", ["body_ar", "body_en"]], ["posts", ["content_ar", "content_en"]]]) {
        let seed;
        try { seed = await ctx.readSeed(table); } catch { log(`${table}: no seed available, skipped`); continue; }
        const bySlug = new Map(seed.map((r) => [r.slug, r]));
        const [rows] = await conn.query(`SELECT id, slug, ${cols.join(", ")} FROM \`${table}\``);
        let restored = 0;
        for (const r of rows) {
          const s = bySlug.get(r.slug);
          if (!s) continue;
          const set = {};
          for (const c of cols) if (plain(s[c]) > 0 && plain(r[c]) < plain(s[c]) * 0.85) set[c] = s[c];
          const keys = Object.keys(set);
          if (!keys.length) continue;
          await conn.query(`UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(",")} WHERE id = ?`, [...keys.map((k) => set[k]), r.id]);
          restored++;
        }
        log(`${table}: ${restored} rows restored from the seed`);
      }
    },
  },
  {
    // Long-form text quoted fares that contradict the live prices table (e.g. Makkah-Madinah sedan 750
    // while the table says 400). Price columns / blocks with unknown prices are removed; the live
    // table and the fares guide are the single source of fares.
    name: "2026-10-25-clean-conflicting-prices",
    async run(conn, log) {
      const [prices] = await conn.query("SELECT economy_price, suv_price, vip_price FROM `prices`");
      const valid = validPrices(prices);
      for (const [table, cols] of [["pages", ["body_ar", "body_en"]], ["posts", ["content_ar", "content_en"]]]) {
        const [rows] = await conn.query(`SELECT id, ${cols.join(", ")} FROM \`${table}\``);
        let changed = 0;
        for (const r of rows) {
          const set = {};
          for (const c of cols) { const out = cleanPrices(r[c], valid); if (out !== r[c]) set[c] = out; }
          const keys = Object.keys(set);
          if (!keys.length) continue;
          await conn.query(`UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(",")} WHERE id = ?`, [...keys.map((k) => set[k]), r.id]);
          changed++;
        }
        log(`${table}: ${changed} rows had conflicting fares removed`);
      }
    },
  },
  {
    // Titles / descriptions / subtitles no longer quote fares (see cleanMetaPrices).
    name: "2026-10-25-clean-meta-prices",
    async run(conn, log) {
      for (const table of ["pages", "posts"]) {
        const [cols] = await conn.query("SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [table]);
        const have = new Set(cols.map((r) => r.c));
        const fields = META_PRICE_FIELDS.filter((f) => have.has(f));
        const [rows] = await conn.query(`SELECT id, ${fields.map((f) => `\`${f}\``).join(", ")} FROM \`${table}\``);
        let changed = 0;
        for (const r of rows) {
          const set = {};
          for (const f of fields) { const out = cleanMetaPrices(f, r[f]); if (out !== r[f]) set[f] = out; }
          const keys = Object.keys(set);
          if (!keys.length) continue;
          await conn.query(`UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(",")} WHERE id = ?`, [...keys.map((k) => set[k]), r.id]);
          changed++;
        }
        log(`${table}: fares removed from the titles/descriptions of ${changed} rows`);
      }
    },
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

export async function runDataMigrations(conn, log = () => {}, ctx = {}) {
  await conn.query(
    "CREATE TABLE IF NOT EXISTS `data_migrations` (`name` VARCHAR(190) PRIMARY KEY, `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  );
  const [done] = await conn.query("SELECT `name` FROM `data_migrations`");
  const seen = new Set(done.map((r) => r.name));
  for (const m of MIGRATIONS) {
    if (seen.has(m.name)) continue;
    log(`migration ${m.name}`);
    await m.run(conn, log, ctx);
    await conn.query("INSERT INTO `data_migrations` (`name`) VALUES (?)", [m.name]);
  }
}
