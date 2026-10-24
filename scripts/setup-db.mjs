#!/usr/bin/env node
// Creates the tables, loads the starter content and creates the admin account.
//   DATABASE_URL=mysql://user:pass@host:3306/dbname \
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long password' node scripts/setup-db.mjs
// Safe to re-run: tables are created only if missing, content is seeded only into
// empty tables, and the admin password is reset only when ADMIN_PASSWORD is given.
import { readFile } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { TABLES, createSql } from "../db/tables.mjs";

const conn = await (process.env.DATABASE_URL
  ? mysql.createConnection({ uri: process.env.DATABASE_URL, charset: "utf8mb4", timezone: "Z" })
  : mysql.createConnection({
      host: process.env.DB_HOST ?? "localhost", port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
      charset: "utf8mb4", timezone: "Z",
    }));

for (const sql of createSql()) await conn.query(sql);
console.log("tables ready");

const SEEDS = {
  pages: "pages", posts: "posts", blog_categories: "blog_categories", faqs: "faqs",
  hero_slides: "hero_slides", homepage_sections: "homepage_sections", fleet: "fleet", prices: "prices",
};
const TYPES = (t) => TABLES[t].cols;

function encode(type, v) {
  if (v === undefined || v === null || v === "") return type === "b" ? 0 : null;
  if (type === "b") return v ? 1 : 0;
  if (type === "j") return typeof v === "string" ? v : JSON.stringify(v);
  if (type === "d") { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
  return v;
}

for (const [table, file] of Object.entries(SEEDS)) {
  const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
  if (n > 0) { console.log(`${table}: already has ${n} rows, skipped`); continue; }
  const rows = JSON.parse(await readFile(new URL(`../content/seed/${file}.json`, import.meta.url), "utf8"));
  const cols = Object.keys(TYPES(table));
  const sql = `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(",")}) VALUES ?`;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50).map((r) => cols.map((c) => encode(TYPES(table)[c], r[c])));
    await conn.query(sql, [batch]);
  }
  console.log(`${table}: seeded ${rows.length}`);
}

const DEFAULT_SETTINGS = {
  contact_phone: "+966551796487",
  whatsapp_number: "966551796487",
  whatsapp_default_message: "مرحباً، أرغب في حجز تاكسي",
  google_site_verification: "",
  bing_site_verification: "",
  head_meta_custom: "",
  head_scripts_custom: "",
};
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
  await conn.query("INSERT IGNORE INTO `settings` (`k`,`v`) VALUES (?,?)", [k, JSON.stringify(v)]);
}

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  if (ADMIN_PASSWORD.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  const salt = randomBytes(16).toString("hex");
  const hash = `scrypt$${salt}$${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`;
  await conn.query(
    "INSERT INTO `admin_users` (`email`,`password_hash`) VALUES (?,?) ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`)",
    [ADMIN_EMAIL.toLowerCase(), hash],
  );
  console.log(`admin account ready: ${ADMIN_EMAIL.toLowerCase()}`);
} else {
  console.log("no ADMIN_EMAIL/ADMIN_PASSWORD given: admin account not changed");
}
await conn.end();
