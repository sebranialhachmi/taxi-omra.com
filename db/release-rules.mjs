// Rules for the automatic SEO release: which items are ready to be shown to Google,
// and in which order they are released. Pure functions, shared by the server and the migration.

const strip = (html) => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const words = (html) => { const t = strip(html); return t ? t.split(" ").length : 0; };
const count = (html, re) => (String(html ?? "").match(re) ?? []).length;

export const THRESHOLDS = {
  posts: { words_ar: 500, words_en: 400 },
  pages: { words_ar: 300, words_en: 250 },
};

/** Readiness of one page ("pages") or article ("posts"). Returns { ready, problems }. */
export function checkReadiness(row, kind) {
  const problems = [];
  const t = THRESHOLDS[kind];
  const slug = String(row.slug ?? "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 75) problems.push("الرابط غير صالح");
  for (const lang of ["ar", "en"]) {
    const L = lang === "ar" ? "عربي" : "إنجليزي";
    const title = String((kind === "posts" ? (lang === "ar" ? row.meta_title_ar : row.meta_title) : row.meta_title) || row[`title_${lang}`] || "");
    const desc = String((kind === "posts" ? (lang === "ar" ? row.meta_description_ar : row.meta_description) : row.meta_description)
      || (kind === "posts" ? row[`excerpt_${lang}`] : row[`subtitle_${lang}`]) || "");
    const body = kind === "posts" ? row[`content_${lang}`] : row[`body_${lang}`];
    if (title.length < 25 || title.length > 70) problems.push(`عنوان جوجل (${L}) ${title.length} حرفًا`);
    if (desc.length < 100 || desc.length > 170) problems.push(`وصف جوجل (${L}) ${desc.length} حرفًا`);
    const w = words(body);
    if (w < t[`words_${lang}`]) problems.push(`المحتوى (${L}) ${w} كلمة (الحد ${t[`words_${lang}`]})`);
    if (count(body, /<h1\b/gi)) problems.push(`عنوان H1 داخل المحتوى (${L})`);
    const imgs = String(body ?? "").match(/<img\b[^>]*>/gi) ?? [];
    if (imgs.some((i) => !/\balt\s*=\s*"[^"]{3,}"/i.test(i))) problems.push(`صورة بلا وصف alt (${L})`);
  }
  return { ready: problems.length === 0, problems };
}

/**
 * Release order: smaller = earlier. 900 and above means "never release automatically"
 * (templated pages that stay manual). Core Jeddah / airport content comes first because
 * it supports the three pages that matter most (home, Jeddah taxi, Jeddah airport taxi).
 */
export function priorityFor(row, kind) {
  const s = String(row.slug ?? "");
  if (kind === "posts") {
    if (s === "jeddah-airport-taxi-fare") return 100;
    if (s === "jeddah-airport-to-haram") return 105;
    if (/fare|price|cost/.test(s)) return 150;
    if (/jeddah-airport/.test(s)) return 160;
    if (/jeddah/.test(s)) return 200;
    if (/makkah|madinah|taif|umrah|haram/.test(s)) return 300;
    return 400;
  }
  const type = row.page_type;
  if (type === "service") return s === "airport-transfer-service" ? 101 : s === "umrah-taxi" ? 102 : /vip|family|group|hotel/.test(s) ? 250 : 350;
  if (type === "airport") return /king-abdulaziz|jeddah/.test(s) ? 130 : 320;
  if (type === "city") return /jeddah/.test(s) ? 140 : /makkah/.test(s) ? 260 : /madinah/.test(s) ? 280 : /taif/.test(s) ? 300 : 900;
  if (type === "route_page") return row.seo_released ? (/jeddah/.test(s) ? 180 : 330) : 900;
  return 900;
}
