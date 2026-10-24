// Creates missing tables, seeds empty ones from content/seed/*.json and makes sure
// an admin account exists. Idempotent. Used by scripts/setup-db.mjs and, on the
// first database use after every start, by the server itself (src/server/db.server.ts),
// so deploying only needs the environment variables.
import { readFile } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
import { TABLES, createSql } from "./tables.mjs";

const SEEDS = ["pages", "posts", "blog_categories", "faqs", "hero_slides", "homepage_sections", "fleet", "prices"];
const SEED_TABLE = { fleet: "fleet" };

const DEFAULT_SETTINGS = {
  contact_phone: "+966551796487",
  whatsapp_number: "966551796487",
  whatsapp_default_message: "مرحباً، أرغب في حجز تاكسي",
  google_site_verification: "",
  bing_site_verification: "",
  head_meta_custom: "",
  head_scripts_custom: "",
};

function encode(type, v) {
  if (v === undefined || v === null || v === "") return type === "b" ? 0 : null;
  if (type === "b") return v ? 1 : 0;
  if (type === "j") return typeof v === "string" ? v : JSON.stringify(v);
  if (type === "d") { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
  return v;
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

/**
 * @param conn  a mysql2/promise connection or pool
 * @param opts  { loadSeed(name) -> rows, or seedDir: URL dir with the json files, adminEmail, adminPassword, resetAdmin, log }
 */
export async function setupDatabase(conn, opts = {}) {
  const log = opts.log ?? (() => {});
  for (const sql of createSql()) await conn.query(sql);

  for (const file of SEEDS) {
    const table = SEED_TABLE[file] ?? file;
    const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
    if (n > 0) continue;
    let rows;
    try {
      rows = opts.loadSeed
        ? await opts.loadSeed(file)
        : JSON.parse(await readFile(new URL(`${file}.json`, opts.seedDir), "utf8"));
    } catch (e) {
      log(`${table}: could not load seed (${e?.message ?? e}), skipped`);
      continue;
    }
    if (!Array.isArray(rows)) {
      log(`${table}: seed is not a list, skipped`);
      continue;
    }
    const cols = Object.keys(TABLES[table].cols);
    const sql = `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(",")}) VALUES ?`;
    for (let i = 0; i < rows.length; i += 50) {
      await conn.query(sql, [rows.slice(i, i + 50).map((r) => cols.map((c) => encode(TABLES[table].cols[c], r[c])))]);
    }
    log(`${table}: seeded ${rows.length}`);
  }

  // Content imported from the old site pointed at /blog-images/*.webp, files that
  // were never shipped (404). Clearing them lets pages use a bundled photo.
  await conn.query("UPDATE `posts` SET `cover_url` = NULL WHERE `cover_url` LIKE '/blog-images/%'");
  await conn.query("UPDATE `pages` SET `hero_image_url` = NULL WHERE `hero_image_url` LIKE '/blog-images/%'");

  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    await conn.query("INSERT IGNORE INTO `settings` (`k`,`v`) VALUES (?,?)", [k, JSON.stringify(v)]);
  }

  const { adminEmail, adminPassword } = opts;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    const email = adminEmail.toLowerCase();
    const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM `admin_users` WHERE `email` = ?", [email]);
    if (n === 0 || opts.resetAdmin) {
      await conn.query(
        "INSERT INTO `admin_users` (`email`,`password_hash`) VALUES (?,?) ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`)",
        [email, hashPassword(adminPassword)],
      );
      log(`admin account ${n === 0 ? "created" : "password reset"}: ${email}`);
    }
  }
}
