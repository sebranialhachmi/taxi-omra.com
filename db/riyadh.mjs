// Removes Riyadh from the content: the business does not operate there.
// Shared by the one-off seed rewrite and by the data migration that cleans
// databases that were already seeded.
const WORD = /riyadh|الرياض|RUH\b|king khalid|الملك خالد/i;

export const mentionsRiyadh = (s) => typeof s === "string" && WORD.test(s);

/** True for pages that are entirely about Riyadh (slug-based). */
export const isRiyadhSlug = (slug) => /riyadh|king-khalid/.test(slug ?? "");

// "A, Riyadh and B" style lists: drop only the Riyadh item and keep the sentence.
// Only patterns that cannot leave a dangling word are used; anything else removes the whole block.
const LIST_RULES = [
  [/\s*[،,]\s*(?:و|أو)?\s*الرياض(?=\s*[،,.؛:)<]|\s*$)/g, ""],
  [/\s+(?:و|أو)الرياض(?=[\s،,.؛:)<]|$)/g, ""],
  [/\s*,\s*Riyadh(?=\s*[,.;:)<]|\s+(?:and|or)\s|\s*$)/gi, ""],
  [/\s+(?:and|or)\s+Riyadh(?=[\s,.;:)<]|$)/gi, ""],
];

// Text that is left ungrammatical by removing one item (a dangling preposition or conjunction).
const DANGLING = [
  /\b(?:in|to|from|across|around|of|and|or|the|for)\s*(?:[,.;:)]|<|$)/i,
  /\b(?:in|to|from|across|around)\s+(?:or|and)\b/i,
  /(?:^|[\s>])(?:في|إلى|من|داخل|عبر|بين|و|أو)\s*(?:[،.؛:)]|<|$)/,
  /(?:في|إلى|من|داخل)\s+(?:أو|و)\s/,
];
const dangling = (s) => DANGLING.some((re) => re.test(s.replace(/<[^>]+>/g, " ").trim().replace(/\s+/g, " ")));

function cleanLists(s) {
  let out = s;
  for (let i = 0; i < 2; i++) for (const [re, to] of LIST_RULES) out = out.replace(re, to);
  return out;
}

const BLOCK = /<(p|li|tr|h[2-6]|dt|dd)\b[^>]*>[\s\S]*?<\/\1>/gi;

/** Cleans an HTML fragment: list items first, then drops any block that still mentions Riyadh. */
export function cleanHtml(html, report) {
  if (!mentionsRiyadh(html)) return html;
  let out = html.replace(BLOCK, (block) => {
    if (!mentionsRiyadh(block)) return block;
    const fixed = cleanLists(block);
    if (!mentionsRiyadh(fixed) && !dangling(fixed)) {
      report?.edited.push([block, fixed]);
      return fixed;
    }
    report?.removed.push(block);
    return "";
  });
  if (mentionsRiyadh(out)) {
    // Text outside block tags (flat strings): list rules, then sentence drop.
    const fixed = cleanLists(out);
    out = mentionsRiyadh(fixed) ? dropSentences(fixed, report) : fixed;
  }
  return out;
}

function dropSentences(text, report) {
  const parts = text.split(/(?<=[.!?؟])\s+/);
  const kept = parts.filter((p) => {
    if (!mentionsRiyadh(p)) return true;
    report?.removed.push(p);
    return false;
  });
  return kept.join(" ");
}

/** Cleans a plain-text field (title, meta description, subtitle). */
export function cleanText(s, report) {
  if (!mentionsRiyadh(s)) return s;
  const fixed = cleanLists(s);
  if (!mentionsRiyadh(fixed) && !dangling(fixed)) {
    report?.edited.push([s, fixed]);
    return fixed;
  }
  return null; // caller decides (manual review)
}

const HTML_COLS = new Set(["body_ar", "body_en", "content_ar", "content_en", "answer_ar", "answer_en"]);
const ARRAY_COLS = new Set(["keywords", "tags"]);

/**
 * Cleans one content row. Returns the changed fields, or null when nothing changed.
 * `overrides` holds hand-written replacements for plain fields the rules cannot fix.
 */
export function cleanRow(row, overrides = {}, report) {
  const changes = {};
  for (const [col, value] of Object.entries(row)) {
    if (col in overrides) {
      if (overrides[col] !== value) changes[col] = overrides[col];
      continue;
    }
    if (Array.isArray(value)) {
      if (!ARRAY_COLS.has(col)) continue;
      const kept = value.filter((v) => !mentionsRiyadh(String(v)));
      if (kept.length !== value.length) changes[col] = kept;
      continue;
    }
    if (typeof value !== "string" || !mentionsRiyadh(value)) continue;
    if (HTML_COLS.has(col)) {
      changes[col] = cleanHtml(value, report);
    } else {
      const fixed = cleanText(value, report);
      if (fixed === null) report?.manual.push([col, value.slice(0, 120)]);
      else changes[col] = fixed;
    }
  }
  return Object.keys(changes).length ? changes : null;
}

/** Hand-written replacements for fields the rules cannot fix (by slug). */
export const OVERRIDES = {
  "city-buraidah": {
    subtitle_ar: "سيارة خاصة بسائق في بريدة ومنطقة القصيم: استقبال من مطار القصيم، ومشاوير داخل المدينة، ورحلات إلى المدينة المنورة ومكة المكرمة.",
    subtitle_en: "A private car with driver in Buraidah and Qassim: airport pickups, errands around town, and long drives to Madinah and Makkah.",
    meta_description: "Private driver in Buraidah for Qassim Airport pickups, city errands and long trips to Madinah or Makkah. Fixed fare per car, pay on arrival, 24/7.",
    og_description: "Qassim Airport pickups, trips around Buraidah and long drives to the Holy Cities, with a fixed fare per car confirmed on WhatsApp.",
  },
  "city-khobar": {
    subtitle_ar: "تنقّل في الخبر بسيارة خاصة وسائق: من مطار الملك فهد وإليه، وبين الفنادق والمكاتب والكورنيش، بسعر ثابت يُؤكَّد على واتساب.",
    subtitle_en: "Get around Khobar with a private car and driver: King Fahd Airport runs, hotels, offices and the Corniche, priced on WhatsApp.",
    meta_description: "Private car with driver in Al Khobar for airport transfers to and from DMM, business meetings and family outings. Fixed fare per car.",
  },
  "city-qassim": {
    subtitle_ar: "سائق خاص في بريدة وعنيزة والرس، ومشاوير مطار القصيم والرحلات إلى المدينة المنورة، بسعر ثابت لكل سيارة.",
    subtitle_en: "A private driver in Buraidah, Unaizah and Ar Rass, plus Qassim airport runs and trips to Madinah, at a fixed fare per car.",
  },
  "city-hail": {
    subtitle_ar: "سيارة خاصة بسائق في حائل: مشاوير المطار، والتنقل داخل المدينة، والرحلات الطويلة إلى القصيم والمدينة.",
    subtitle_en: "Private car with driver in Hail for airport runs, getting around town and long trips to Qassim or Madinah.",
    meta_description: "Private car with driver in Hail for airport runs, trips to Qassim and family outings. Fixed fare per car confirmed on WhatsApp, pay on arrival, 24/7.",
  },
  "city-hofuf": {
    meta_description: "Private driver in Hofuf and Al Ahsa for city trips, Al Ahsa and Dammam airport pickups, and rides to Makkah. Fixed fare per car, book on WhatsApp.",
  },
};
