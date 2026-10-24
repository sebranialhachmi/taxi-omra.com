// Removes the cities the business does not serve (Eastern Province, Qassim, Hail, the
// south and the north-west). Same approach as riyadh.mjs: list items are dropped when that
// is grammatical, any other block that mentions a removed city is removed whole.
const AR_TERMS = [
  "الدمام", "الخبر", "الجبيل", "الهفوف", "الأحساء", "الاحساء", "القصيم", "بريدة", "عنيزة", "الرس", "حائل",
  "أبها", "ابها", "خميس مشيط", "جازان", "جيزان", "نجران", "العلا", "تبوك", "الظهران", "المنطقة الشرقية",
  "عسير", "نيوم", "مطار الملك فهد", "الملك فهد الدولي",
];
const EN_TERMS = [
  "Dammam", "Khobar", "Jubail", "Hofuf", "Al[- ]?Ahsa", "Ahsa", "Qassim", "Buraidah", "Unaizah", "Ar Rass",
  "Hail", "Abha", "Khamis Mushait", "Jazan", "Jizan", "Najran", "Al[- ]?Ula", "Tabuk", "Dhahran",
  "Eastern Province", "Aseer", "Asir", "NEOM", "King Fahd (?:International )?Airport", "King Fahd International", "DMM",
];
const NEWS = "(?!\\s+(?:الجيد|السار|السعيد|المفرح|السيئ|المهم|الأهم|الأخير|الصحيح|اليقين))";
const AR_ALT = AR_TERMS.map((t) => (t === "الخبر" ? `الخبر${NEWS}` : t)).join("|");
// Left boundary: not inside another word (e.g. "احتسابها" must not match "ابها"); one prefix letter is allowed ("بالدمام", "ببريدة").
const AR = `(?<![\\u0600-\\u06FF])[وبلفك]?(?:${AR_ALT})(?![\\u0600-\\u06FF])`;
const AR_NOPREFIX = `(?:${AR_ALT})(?![\\u0600-\\u06FF])`;
const EN = `\\b(?:${EN_TERMS.join("|")})\\b`;
const WORD = new RegExp(`${AR}|${EN}`, "i");

export const mentionsUnserved = (s) => typeof s === "string" && WORD.test(s);

const SLUG = /dammam|khobar|jubail|hofuf|ahsa|qassim|buraidah|hail|abha|jazan|najran|alula|tabuk|khamis|king-fahd|neom|unaizah|aseer/;
/** True for pages that are entirely about a removed city. */
export const isUnservedSlug = (slug) => SLUG.test(slug ?? "");

// After the removed item only punctuation, the end, or another list item may follow;
// anything else (e.g. "والدمام نحو 400 كم") means the item carries its own clause.
const AFTER_AR = "(?=\\s*[،,.؛:)<]|\\s*$|\\s+(?:و|أو)[\\u0600-\\u06FF]|\\s+أو\\s)";
const AFTER_EN = "(?=\\s*[,.;:)<]|\\s*$|\\s+(?:and|or)\\s)";
const LIST_RULES = [
  [new RegExp(`\\s*[،,]\\s*(?:و|أو)?\\s*${AR}${AFTER_AR}`, "g"), ""],
  [new RegExp(`\\s+(?:و|أو)${AR_NOPREFIX}${AFTER_AR}`, "g"), ""],
  [new RegExp(`,\\s*([A-Z][A-Za-z' -]{2,30}?)\\s+and\\s+${EN}${AFTER_EN}`, "g"), " and $1"],
  [new RegExp(`\\s*,\\s*${EN}${AFTER_EN}`, "gi"), ""],
  [new RegExp(`\\s+(?:and|or)\\s+${EN}${AFTER_EN}`, "gi"), ""],
];

const DANGLING = [
  /\b(?:in|to|from|across|around|of|and|or|the|for|including|such as)\s*(?:[,.;:)]|<|$)/i,
  /\b(?:in|to|from|across|around)\s+(?:or|and)\b/i,
  /(?:^|[\s>])(?:في|إلى|من|داخل|عبر|بين|و|أو|مثل|منها)\s*(?:[،.؛:)]|<|$)/,
  /(?:في|إلى|من|داخل)\s+(?:أو|و)\s/,
  /(?:،\s*){2,}|(?:,\s*){2,}/,
];
const plain = (s) => s.replace(/<[^>]+>/g, " ").trim().replace(/\s+/g, " ");
const dangling = (s) => DANGLING.some((re) => re.test(plain(s)));

function cleanLists(s) {
  let out = s;
  for (let i = 0; i < 3; i++) for (const [re, to] of LIST_RULES) out = out.replace(re, to);
  return out;
}

const CELL = /<t([hd])\b[^>]*>[\s\S]*?<\/t\1>/gi;
const ROW = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;

/** Removes table columns whose header cell mentions a removed city (keeps the rest of the table aligned). */
function dropTableColumns(html, report) {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
    const rows = table.match(ROW);
    if (!rows || !mentionsUnserved(rows[0])) return table;
    const header = rows[0].match(CELL) ?? [];
    const drop = new Set(header.map((c, i) => (mentionsUnserved(c) ? i : -1)).filter((i) => i >= 0));
    if (!drop.size) return table;
    report?.edited.push([rows[0], "(column removed)"]);
    return table.replace(ROW, (row) => {
      const cells = row.match(CELL) ?? [];
      if (cells.length !== header.length) return row;
      const open = row.match(/^<tr\b[^>]*>/i)[0];
      return `${open}${cells.filter((_, i) => !drop.has(i)).join("")}</tr>`;
    });
  });
}

const BLOCK = /<(p|li|tr|h[2-6]|dt|dd)\b[^>]*>[\s\S]*?<\/\1>/gi;

function tidy(html) {
  let out = html;
  // empty lists / tables left behind
  out = out.replace(/<(ul|ol)\b[^>]*>\s*<\/\1>/gi, "");
  out = out.replace(/<t(body|head)\b[^>]*>\s*<\/t\1>/gi, "").replace(/<table\b[^>]*>\s*<\/table>/gi, "");
  // a heading with nothing under it (next thing is another heading or the end)
  for (let i = 0; i < 3; i++) out = out.replace(/<h([2-6])\b[^>]*>[\s\S]*?<\/h\1>\s*(?=<h[1-6]\b|$)/gi, "");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** Exact phrases rewritten by hand so the sentence keeps its served-city content. */
export const PHRASES = [
  ["مسارات مثل الطائف إلى جدة، إلى الدمام، أو الدمام إلى مكة لا نضع", "مسارات مثل الطائف إلى جدة لا نضع"],
  ["، والدمام نحو 400 كم.", "."],
  ["أما الطائف إلى جدة، إلى الدمام، أو الدمام إلى مكة فتُسعَّر", "أما الطائف إلى جدة فتُسعَّر"],
];

export function cleanHtml(html, report) {
  for (const [from, to] of PHRASES) html = html.split(from).join(to);
  if (!mentionsUnserved(html)) return html;
  let touched = true;
  let out = dropTableColumns(html, report).replace(BLOCK, (block) => {
    if (!mentionsUnserved(block)) return block;
    touched = true;
    const fixed = cleanLists(block);
    if (!mentionsUnserved(fixed) && !dangling(fixed)) {
      report?.edited.push([block, fixed]);
      return fixed;
    }
    report?.removed.push(block);
    return "";
  });
  if (mentionsUnserved(out)) {
    const fixed = cleanLists(out);
    out = mentionsUnserved(fixed) ? dropSentences(fixed, report) : fixed;
  }
  return touched ? tidy(out) : out;
}

function dropSentences(text, report) {
  return text
    .split(/(?<=[.!?؟])\s+/)
    .filter((p) => {
      if (!mentionsUnserved(p)) return true;
      report?.removed.push(p);
      return false;
    })
    .join(" ");
}

export function cleanText(s, report) {
  if (!mentionsUnserved(s)) return s;
  const fixed = cleanLists(s);
  if (!mentionsUnserved(fixed) && !dangling(fixed)) {
    report?.edited.push([s, fixed]);
    return fixed;
  }
  return null;
}

const HTML_COLS = new Set(["body_ar", "body_en", "content_ar", "content_en", "answer_ar", "answer_en"]);
const ARRAY_COLS = new Set(["keywords", "tags"]);

export function cleanRow(row, overrides = {}, report) {
  const changes = {};
  for (const [col, value] of Object.entries(row)) {
    if (col in overrides) {
      if (overrides[col] !== value) changes[col] = overrides[col];
      continue;
    }
    if (Array.isArray(value)) {
      if (!ARRAY_COLS.has(col)) continue;
      const kept = value.filter((v) => !mentionsUnserved(String(v)));
      if (kept.length !== value.length) changes[col] = kept;
      continue;
    }
    if (typeof value !== "string" || !mentionsUnserved(value)) continue;
    if (HTML_COLS.has(col)) changes[col] = cleanHtml(value, report);
    else {
      const fixed = cleanText(value, report);
      if (fixed === null) report?.manual.push([col, value.slice(0, 140)]);
      else changes[col] = fixed;
    }
  }
  return Object.keys(changes).length ? changes : null;
}

/** Hand-written replacements, keyed by slug (pages/posts) — filled in after reviewing the report. */
export const OVERRIDES = {};
/** Hand-written FAQ answers, keyed by the start of the Arabic question. */
export const FAQ_OVERRIDES = {
  "في أي مدن يمكنني طلب الخدمة": {
    answer_ar: "نخدم مكة المكرمة والمدينة المنورة وجدة والطائف، مع المشاوير بينها. وإن كانت وجهتك غير مذكورة فاسأل على واتساب.",
    answer_en: "We serve Makkah, Madinah, Jeddah and Taif, plus trips between them. If your destination isn't listed, ask on WhatsApp.",
  },
};
