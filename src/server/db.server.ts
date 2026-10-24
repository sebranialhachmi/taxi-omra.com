// MySQL/MariaDB access for the whole app. Table and column names are validated
// against db/tables.mjs, so only whitelisted identifiers ever reach a query.
import mysql from "mysql2/promise";
import { TABLES, type ColType } from "../../db/tables.mjs";

let pool: mysql.Pool | undefined;

function getPool(): mysql.Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  const base = {
    charset: "utf8mb4",
    timezone: "Z",
    connectionLimit: 8,
    waitForConnections: true,
    enableKeepAlive: true,
    connectTimeout: 10_000,
  };
  pool = url
    ? mysql.createPool({ uri: url, ...base })
    : mysql.createPool({
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ...base,
      });
  return pool;
}

// Rows are loosely typed on purpose: the routes were written against Supabase "any" rows.
export type Row = any;
type Where = Record<string, string | number | boolean | null>;

function def(table: string) {
  const d = TABLES[table];
  if (!d) throw new Error(`Unknown table ${table}`);
  return d;
}

function colType(table: string, col: string): ColType | "id" | "stamp" {
  if (col === "id") return "id";
  if (col === "created_at" || col === "updated_at") return "stamp";
  const t = def(table).cols[col];
  if (!t) throw new Error(`Unknown column ${table}.${col}`);
  return t;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));

function decode(table: string, row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const t = colType(table, k);
    if (t === "b") out[k] = Boolean(Number(v));
    else if (t === "j") {
      try { out[k] = v == null || v === "" ? null : JSON.parse(String(v)); } catch { out[k] = null; }
    } else if (t === "d" || t === "stamp") out[k] = iso(v);
    else out[k] = v;
  }
  return out;
}

function encode(table: string, col: string, v: unknown): unknown {
  const t = colType(table, col);
  if (v === undefined) return undefined;
  if (v === null || v === "") return t === "b" ? 0 : t === "i" || t === "f" || t === "d" || t === "j" ? null : v;
  if (t === "b") return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
  if (t === "j") return typeof v === "string" ? v : JSON.stringify(v);
  if (t === "d") { const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? null : d; }
  if (t === "i" || t === "f") { const n = Number(v); return Number.isFinite(n) ? n : null; }
  return v;
}

export interface SelectOpts {
  where?: Where;
  /** [column, "asc" | "desc"] pairs */
  orderBy?: Array<[string, "asc" | "desc"]>;
  limit?: number;
  offset?: number;
  columns?: string[];
}

export async function select(table: string, opts: SelectOpts = {}): Promise<Row[]> {
  const d = def(table);
  const cols = opts.columns?.map((c) => { colType(table, c); return `\`${c}\``; }).join(",") ?? "*";
  const params: unknown[] = [];
  const conds = Object.entries(opts.where ?? {}).map(([c, v]) => {
    colType(table, c);
    if (v === null) return `\`${c}\` IS NULL`;
    params.push(encode(table, c, v));
    return `\`${c}\` = ?`;
  });
  const order = (opts.orderBy ?? []).map(([c, dir]) => { colType(table, c); return `\`${c}\` ${dir === "desc" ? "DESC" : "ASC"}`; });
  let sql = `SELECT ${cols} FROM \`${table}\``;
  if (conds.length) sql += ` WHERE ${conds.join(" AND ")}`;
  if (order.length) sql += ` ORDER BY ${order.join(",")}`;
  if (opts.limit) sql += ` LIMIT ${Math.floor(opts.limit)}${opts.offset ? ` OFFSET ${Math.floor(opts.offset)}` : ""}`;
  void d;
  const [rows] = await getPool().query(sql, params);
  return (rows as Row[]).map((r) => decode(table, r));
}

export async function one(table: string, where: Where): Promise<Row | null> {
  return (await select(table, { where, limit: 1 }))[0] ?? null;
}

function writable(table: string, data: Row): [string[], unknown[]] {
  const cols: string[] = [];
  const vals: unknown[] = [];
  for (const [c, v] of Object.entries(data)) {
    if (c === "id" || c === "created_at" || c === "updated_at" || !(c in def(table).cols)) continue;
    const e = encode(table, c, v);
    if (e === undefined) continue;
    cols.push(c);
    vals.push(e);
  }
  return [cols, vals];
}

export async function insert(table: string, data: Row): Promise<number> {
  const [cols, vals] = writable(table, data);
  const sql = `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(",")}) VALUES (${cols.map(() => "?").join(",")})`;
  const [res] = await getPool().query(sql, vals);
  return (res as mysql.ResultSetHeader).insertId;
}

export async function update(table: string, id: number, data: Row): Promise<void> {
  const [cols, vals] = writable(table, data);
  if (!cols.length) return;
  await getPool().query(`UPDATE \`${table}\` SET ${cols.map((c) => `\`${c}\` = ?`).join(",")} WHERE id = ?`, [...vals, id]);
}

export async function remove(table: string, id: number): Promise<void> {
  def(table);
  await getPool().query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
}

export async function count(table: string, where: Where = {}): Promise<number> {
  def(table);
  const params: unknown[] = [];
  const conds = Object.entries(where).map(([c, v]) => { colType(table, c); params.push(encode(table, c, v)); return `\`${c}\` = ?`; });
  const [rows] = await getPool().query(`SELECT COUNT(*) AS n FROM \`${table}\`${conds.length ? ` WHERE ${conds.join(" AND ")}` : ""}`, params);
  return Number((rows as Row[])[0].n);
}

// ---- settings: key/value rows, value stored as JSON text ----
export async function getSettings(keys?: string[]): Promise<Record<string, any>> {
  const rows = await select("settings");
  const out: Record<string, any> = {};
  for (const r of rows) {
    if (keys && !keys.includes(r.k)) continue;
    try { out[r.k] = JSON.parse(r.v); } catch { out[r.k] = r.v; }
  }
  return out;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await getPool().query(
    "INSERT INTO `settings` (`k`,`v`) VALUES (?,?) ON DUPLICATE KEY UPDATE `v` = VALUES(`v`)",
    [key, JSON.stringify(value)],
  );
}

export async function exec(sql: string, params: unknown[] = []): Promise<void> {
  await getPool().query(sql, params);
}
