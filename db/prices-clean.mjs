// Fares written inside long-form text must match the live `prices` table. Text blocks and tables
// that quote a price missing from that table are removed instead of contradicting it.
const UNIT = /^\s*(?:كم|km|كيلو|دقيقة|دقائق|min|ساعة|ساعات|hour|hr|ركاب|راكب|passengers?|pax|حقائب|حقيبة|bags?|seats?|مقاعد|%|٪)/i;
const CURRENCY = /ريال|SAR|\bSR\b/i;
const NUM = /\d[\d,]*(?:\.\d+)?/g;

const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

/** Price-like numbers in a piece of text (numbers followed by a unit such as km or passengers are ignored). */
export function priceNumbers(html, { requireCurrency }) {
  const t = text(html);
  if (requireCurrency && !CURRENCY.test(t)) return [];
  const out = [];
  for (const m of t.matchAll(NUM)) {
    const n = Number(m[0].replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 50 || n > 20000) continue;
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 12);
    if (UNIT.test(after)) continue;
    const near = t.slice(Math.max(0, m.index - 14), m.index + m[0].length + 14);
    // outside tables a number only counts when it sits next to a currency word
    if (requireCurrency === "near" && !CURRENCY.test(near)) continue;
    out.push(n);
  }
  return out;
}

const TABLE = /<table\b[\s\S]*?<\/table>/gi;
const BLOCK = /<(p|li|dd|dt)\b[^>]*>[\s\S]*?<\/\1>/gi;
const ROW = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;
const CELL = /<t([hd])\b[^>]*>[\s\S]*?<\/t\1>/gi;
const PRICE_HEADER = /سعر|أسعار|الأسعار|ريال|تكلفة|\bSAR\b|\bfare|\bprice|\brate\b|\bcost/i;

/**
 * A table that quotes a price missing from the live table loses its price columns (distances,
 * durations and capacities stay); rows that still quote an unknown price are dropped, and a table
 * that ends up with one column or no data rows is removed.
 */
function cleanTable(table, valid, report) {
  const bad = (h) => priceNumbers(h, { requireCurrency: true }).filter((n) => !valid.has(n));
  if (!bad(table).length) return table;
  const rows = table.match(ROW) ?? [];
  const header = rows[0]?.match(CELL) ?? [];
  const drop = new Set(header.map((c, i) => (PRICE_HEADER.test(text(c)) ? i : -1)).filter((i) => i >= 0));
  let out = table;
  if (drop.size && header.length - drop.size >= 2) {
    out = out.replace(ROW, (row) => {
      const cells = row.match(CELL) ?? [];
      if (cells.length !== header.length) return row;
      return `${row.match(/^<tr\b[^>]*>/i)[0]}${cells.filter((_, i) => !drop.has(i)).join("")}</tr>`;
    });
    report?.removed.push(`price columns: ${[...drop].join(",")} of ${text(rows[0]).slice(0, 70)}`);
  } else if (drop.size) {
    report?.removed.push(`table: ${text(table).slice(0, 80)}`);
    return "";
  }
  // rows that still quote an unknown price
  out = out.replace(ROW, (row, offset) => {
    if (offset < 0) return row;
    return bad(row).length && !/<th\b/i.test(row) ? "" : row;
  });
  const left = out.match(ROW) ?? [];
  if (left.length < 2 || bad(out).length) {
    report?.removed.push(`table: ${text(table).slice(0, 80)}`);
    return "";
  }
  return out;
}

export function cleanPrices(html, valid, report) {
  if (typeof html !== "string" || !html) return html;
  let out = html.replace(TABLE, (table) => cleanTable(table, valid, report));
  out = out.replace(BLOCK, (block) => {
    const bad = priceNumbers(block, { requireCurrency: "near" }).filter((n) => !valid.has(n));
    if (!bad.length) return block;
    report?.removed.push(`block: ${text(block).slice(0, 90)} [${[...new Set(bad)].join(",")}]`);
    return "";
  });
  for (let i = 0; i < 3; i++) out = out.replace(/<h([2-6])\b[^>]*>(?:(?!<\/h\1>)[\s\S])*<\/h\1>\s*(?=<h[1-6]\b|$)/gi, "");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function validPrices(rows) {
  const valid = new Set();
  for (const r of rows) for (const k of ["economy_price", "suv_price", "vip_price"]) if (/^\d+$/.test(String(r[k] ?? ""))) valid.add(Number(r[k]));
  return valid;
}

// Titles, descriptions and subtitles must not quote fares: the live prices table is the only
// source, and stale numbers in search snippets contradict it. A clause (split at . ، , ; |) that
// quotes a currency amount is dropped; short descriptions get a neutral fare sentence back.
const AMOUNT = /(?:\b(?:SAR|SR)\s*\d|\d\s*(?:SAR|SR)\b|\d\s*(?:ريال|﷼)|(?:ريال|﷼)\s*\d)/i;
export const META_PRICE_FIELDS = ["meta_title", "meta_description", "og_title", "og_description", "twitter_title", "twitter_description", "subtitle_ar", "subtitle_en", "excerpt_ar", "excerpt_en", "title_ar", "title_en"];
export function cleanMetaPrices(field, text) {
  if (typeof text !== "string" || !AMOUNT.test(text)) return text;
  let out;
  if (/title/.test(field)) {
    out = text
      .replace(/\s*\|\s*(?:Round Trip )?[Ff]rom SAR\s*\d+\s*$/, "")
      .replace(/\s+from SAR\s*\d+(?: per Car)?/i, "")
      .replace(/\s*\|\s*$/, "");
  } else {
    const parts = text.split(/([.،,;|]\s*)/);
    const kept = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (!AMOUNT.test(parts[i])) kept.push(parts[i], parts[i + 1] ?? "");
    }
    out = kept.join("").replace(/[\s،,;|]+$/, "").trim();
    if (out && !/[.!؟?]$/.test(out)) out += ".";
    if (field.endsWith("description") && out.length < 120 && out.length > 0) {
      const add = " Fixed fare per car, pay on arrival, book on WhatsApp 24/7.";
      if (out.length + add.length <= 160) out += add;
    }
  }
  return out || text;
}
