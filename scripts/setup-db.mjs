#!/usr/bin/env node
// Manual setup / admin password reset:
//   DATABASE_URL=mysql://user:pass@host:3306/dbname \
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long password' node scripts/setup-db.mjs
// The server runs the same setup by itself on start, so this is only needed to
// reset a forgotten admin password (it always resets when ADMIN_PASSWORD is given).
import mysql from "mysql2/promise";
import { setupDatabase } from "../db/setup.mjs";

const conn = await (process.env.DATABASE_URL
  ? mysql.createConnection({ uri: process.env.DATABASE_URL, charset: "utf8mb4", timezone: "Z" })
  : mysql.createConnection({
      host: process.env.DB_HOST ?? "localhost", port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
      charset: "utf8mb4", timezone: "Z",
    }));

await setupDatabase(conn, {
  seedDir: new URL("../content/seed/", import.meta.url),
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  resetAdmin: true,
  log: console.log,
});
console.log("done");
await conn.end();
