#!/usr/bin/env node
// Automated SEO compliance checker for the homepage + robots.txt + sitemap.xml.
// Usage: node scripts/seo-check.mjs [baseUrl]
// Default baseUrl: http://localhost:8080
import { load } from "cheerio";

const BASE = (process.argv[2] || process.env.SEO_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? "  —  " + detail : ""}`);
};

async function fetchText(url) {
  const r = await fetch(url, { redirect: "follow" });
  return { status: r.status, text: await r.text(), headers: Object.fromEntries(r.headers) };
}

async function checkPage(path, expectedLocale) {
  console.log(`\n=== ${path} (${expectedLocale}) ===`);
  const { status, text } = await fetchText(BASE + path);
  record(`HTTP 200 ${path}`, status === 200, `status=${status}`);
  const $ = load(text);

  const h1s = $("h1");
  record(`Exactly one <h1> on ${path}`, h1s.length === 1, `count=${h1s.length}`);

  const canonical = $('link[rel="canonical"]').attr("href");
  record(`Canonical present on ${path}`, !!canonical, canonical || "missing");

  const required = [
    ['meta[property="og:title"]', "og:title"],
    ['meta[property="og:description"]', "og:description"],
    ['meta[property="og:type"]', "og:type"],
    ['meta[property="og:url"]', "og:url"],
    ['meta[property="og:image"]', "og:image"],
    ['meta[property="og:site_name"]', "og:site_name"],
    ['meta[property="og:locale"]', "og:locale"],
    ['meta[name="twitter:card"]', "twitter:card"],
    ['meta[name="twitter:title"]', "twitter:title"],
    ['meta[name="twitter:description"]', "twitter:description"],
    ['meta[name="twitter:image"]', "twitter:image"],
    ['meta[name="description"]', "meta description"],
  ];
  for (const [sel, name] of required) {
    const v = $(sel).attr("content");
    record(`${name} present on ${path}`, !!v, v ? v.slice(0, 80) : "missing");
  }

  const ogLocale = $('meta[property="og:locale"]').attr("content");
  const expected = expectedLocale === "en" ? "en_US" : "ar_SA";
  record(`og:locale=${expected} on ${path}`, ogLocale === expected, `got=${ogLocale}`);

  // hreflang alternates
  const hreflangs = {};
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    hreflangs[$(el).attr("hreflang")] = $(el).attr("href");
  });
  for (const lang of ["ar", "en", "x-default"]) {
    record(`hreflang=${lang} on ${path}`, !!hreflangs[lang], hreflangs[lang] || "missing");
  }

  // JSON-LD
  const jsonLd = $('script[type="application/ld+json"]');
  record(`JSON-LD present on ${path}`, jsonLd.length > 0, `count=${jsonLd.length}`);
  let hasWebsite = false;
  jsonLd.each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) if (d["@type"] === "WebSite" || d["@type"] === "Organization") hasWebsite = true;
    } catch { /* ignore */ }
  });
  record(`JSON-LD includes WebSite/Organization on ${path}`, hasWebsite);
}

async function checkRobots() {
  console.log("\n=== /robots.txt ===");
  const { status, text, headers } = await fetchText(BASE + "/robots.txt");
  record("robots.txt HTTP 200", status === 200, `status=${status}`);
  record("robots.txt has User-agent", /user-agent:/i.test(text));
  record("robots.txt has Sitemap directive", /sitemap:\s*https?:/i.test(text));
  record("robots.txt content-type text/plain",
    (headers["content-type"] || "").includes("text/plain") || (headers["content-type"] || "").includes("text"));
}

async function checkSitemap() {
  console.log("\n=== /sitemap.xml ===");
  const { status, text, headers } = await fetchText(BASE + "/sitemap.xml");
  record("sitemap.xml HTTP 200", status === 200, `status=${status}`);
  record("sitemap.xml is XML",
    (headers["content-type"] || "").includes("xml") && text.startsWith("<?xml"));
  record("sitemap contains /ar URLs", /<loc>[^<]*\/ar(?:\/|<)/.test(text));
  record("sitemap contains /en URLs", /<loc>[^<]*\/en(?:\/|<)/.test(text));
  record("sitemap contains xhtml:link hreflang alternates", /xhtml:link[^>]*hreflang=/.test(text));
  record("sitemap contains hreflang=x-default", /hreflang="x-default"/.test(text));
}

(async () => {
  console.log(`SEO Compliance Check against ${BASE}\n`);
  await checkPage("/", "ar");
  await checkPage("/ar", "ar");
  await checkPage("/en", "en");
  await checkRobots();
  await checkSitemap();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log("Failed checks:");
    for (const f of failed) console.log(`  ❌ ${f.name}  ${f.detail}`);
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(2); });
