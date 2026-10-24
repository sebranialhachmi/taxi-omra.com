// One-off data migrations for databases that were already seeded. Each runs once
// (recorded in data_migrations); a fresh database gets the cleaned seed and these find nothing to do.
import { cleanRow, isRiyadhSlug, mentionsRiyadh, OVERRIDES } from "./riyadh.mjs";

const parseJson = (v) => { try { return JSON.parse(v); } catch { return v; } };

async function cleanTable(conn, table, keyCol, log, { deleteIf } = {}) {
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
    const changes = cleanRow(row, OVERRIDES[r[keyCol]] ?? {});
    if (!changes) continue;
    const cols = Object.keys(changes);
    const vals = cols.map((c) => (Array.isArray(changes[c]) ? JSON.stringify(changes[c]) : changes[c]));
    await conn.query(`UPDATE \`${table}\` SET ${cols.map((c) => `\`${c}\` = ?`).join(",")} WHERE id = ?`, [...vals, r.id]);
    edited++;
  }
  log(`${table}: ${removed} removed, ${edited} cleaned`);
}

const MIGRATIONS = [
  {
    name: "2026-10-24-remove-riyadh",
    async run(conn, log) {
      await cleanTable(conn, "pages", "slug", log, { deleteIf: (r) => isRiyadhSlug(r.slug) });
      await cleanTable(conn, "posts", "slug", log);
      await cleanTable(conn, "faqs", "id", log, {
        deleteIf: (r) => mentionsRiyadh(r.question_ar) || mentionsRiyadh(r.question_en),
      });
      await conn.query("DELETE FROM `prices` WHERE `category` = 'riyadh' OR `code` LIKE '%ruh%' OR `code` LIKE '%riyadh%'");
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
