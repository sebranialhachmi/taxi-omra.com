// Single source of truth for the MySQL/MariaDB schema. Used by the app
// (src/server/db.ts) and by scripts/setup-db.mjs, so they can never drift.
//
// Column types:  s = VARCHAR(255)   u = VARCHAR(700)   t = TEXT   m = MEDIUMTEXT
//                i = INT   f = DOUBLE   b = BOOLEAN   j = JSON stored as TEXT   d = DATETIME
// Every table also gets an auto-increment `id`; tables with `stamps` get created_at/updated_at.

export const TABLES = {
  pages: {
    stamps: true,
    unique: ["slug"],
    cols: {
      slug: "s", page_type: "s", title_ar: "u", title_en: "u", subtitle_ar: "t", subtitle_en: "t",
      body_ar: "m", body_en: "m", hero_image_url: "u", og_image_url: "u", featured_image_url: "u",
      twitter_image_url: "u", meta_title: "u", meta_description: "t", published: "b", sort_order: "i",
      canonical_url: "u", keywords: "j", og_title: "u", og_description: "t", twitter_card: "s",
      twitter_title: "u", twitter_description: "t", robots: "s", schema_type: "s", custom_schema: "j",
      gallery: "j", status: "s", seo_released: "b", release_priority: "i", released_at: "d",
    },
  },
  posts: {
    stamps: true,
    unique: ["slug"],
    cols: {
      slug: "s", title_ar: "u", title_en: "u", excerpt_ar: "t", excerpt_en: "t", content_ar: "m",
      content_en: "m", cover_url: "u", meta_title: "u", meta_description: "t", tags: "j", published: "b",
      published_at: "d", category: "s", reading_time_min: "i", featured: "b", status: "s", og_image_url: "u",
      canonical_url: "u", keywords: "j", meta_title_ar: "u", meta_description_ar: "t",
      primary_keyword_en: "s", primary_keyword_ar: "s", cover_alt_en: "u", cover_alt_ar: "u",
      cover_caption: "u", content_format: "s", seo_released: "b", scheduled_at: "d", release_priority: "i", released_at: "d",
    },
  },
  blog_categories: {
    unique: ["slug"],
    cols: { slug: "s", name_ar: "s", name_en: "s", description_ar: "t", description_en: "t", sort_order: "i" },
  },
  faqs: {
    cols: { question_ar: "t", question_en: "t", answer_ar: "m", answer_en: "m", category: "s", published: "b", sort_order: "i" },
  },
  hero_slides: {
    cols: {
      title_ar: "u", title_en: "u", subtitle_ar: "t", subtitle_en: "t", image_url: "u", cta_label_ar: "s",
      cta_label_en: "s", cta_href: "u", active: "b", sort_order: "i",
    },
  },
  homepage_sections: {
    unique: ["section_key"],
    cols: {
      section_key: "s", title_ar: "u", title_en: "u", subtitle_ar: "t", subtitle_en: "t", enabled: "b",
      sort_order: "i", config: "j",
    },
  },
  fleet: {
    unique: ["code"],
    cols: {
      code: "s", name_ar: "s", name_en: "s", description_ar: "t", description_en: "t", seats: "i",
      base_fare: "f", price_per_km: "f", price_per_min: "f", is_active: "b", sort_order: "i",
      meta_title: "u", meta_description: "t", og_image_url: "u", featured_image_url: "u", gallery: "j",
    },
  },
  prices: {
    unique: ["code"],
    cols: {
      code: "s", from_ar: "s", from_en: "s", to_ar: "s", to_en: "s", economy_price: "s", suv_price: "s",
      vip_price: "s", category: "s", sort_order: "i",
    },
  },
  testimonials: {
    cols: {
      name: "s", role_ar: "s", role_en: "s", quote_ar: "t", quote_en: "t", rating: "i", published: "b", sort_order: "i",
    },
  },
  redirects: {
    unique: ["source_path"],
    cols: { source_path: "u", destination_path: "u", status_code: "i", is_active: "b" },
  },
  settings: { noId: true, key: "k", cols: { k: "s", v: "m" } },
  messages: {
    cols: {
      name: "s", email: "s", phone: "s", subject: "u", message: "m", page_url: "u", source: "s", is_read: "b",
    },
    stamps: true,
  },
  admin_users: { stamps: true, unique: ["email"], cols: { email: "s", password_hash: "s" } },
  sessions: { noId: true, key: "token_hash", cols: { token_hash: "s", user_id: "i", expires_at: "d" } },
};

const SQL = { s: "VARCHAR(255)", u: "VARCHAR(700)", t: "TEXT", m: "MEDIUMTEXT", i: "INT", f: "DOUBLE", b: "TINYINT(1)", j: "MEDIUMTEXT", d: "DATETIME" };

/** SQL for one column (used when an existing table is missing a newer column). */
export function columnSql(type) {
  return SQL[type] + (type === "b" ? " NOT NULL DEFAULT 0" : "");
}

export function createSql() {
  const out = [];
  for (const [name, def] of Object.entries(TABLES)) {
    const lines = [];
    if (!def.noId) lines.push("`id` INT AUTO_INCREMENT PRIMARY KEY");
    for (const [col, type] of Object.entries(def.cols)) {
      const pk = def.key === col ? " PRIMARY KEY" : "";
      const notNull = type === "b" ? " NOT NULL DEFAULT 0" : "";
      lines.push(`\`${col}\` ${SQL[type]}${notNull}${pk}`);
    }
    if (def.stamps) {
      lines.push("`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
      lines.push("`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }
    for (const u of def.unique ?? []) lines.push(`UNIQUE KEY \`uq_${name}_${u}\` (\`${u}\`)`);
    out.push(`CREATE TABLE IF NOT EXISTS \`${name}\` (\n  ${lines.join(",\n  ")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }
  return out;
}
