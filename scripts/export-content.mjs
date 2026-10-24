#!/usr/bin/env node
// Dumps the public content tables of the old Supabase project to content/raw/*.json
// using the publishable (anon) key, so only rows that RLS exposes publicly are exported.
// Usage: SUPABASE_URL=... SUPABASE_KEY=... node scripts/export-content.mjs
import { mkdir, writeFile } from "node:fs/promises";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
if (!URL_ || !KEY) throw new Error("SUPABASE_URL and SUPABASE_KEY are required");

const TABLES = [
  "cms_pages", "blog_posts", "blog_categories", "faqs", "testimonials",
  "vehicle_categories", "vehicle_category_translations", "routes", "pricing_rules",
  "settings", "hero_slides", "homepage_sections", "partners", "promotions",
  "menus", "menu_items",
];
const PAGE = 500;

await mkdir("content/raw", { recursive: true });
for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${URL_}/rest/v1/${table}?select=*`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + PAGE - 1}` },
    });
    if (!res.ok) {
      console.log(`${table}: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
      break;
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  await writeFile(`content/raw/${table}.json`, JSON.stringify(rows));
  console.log(`${table}: ${rows.length} rows`);
}
