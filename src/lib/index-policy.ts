// Which database-driven pages Google may index. Everything else is served
// with "noindex, follow" and kept out of sitemaps, so Google judges the site
// on a small set of strong pages instead of hundreds of templated ones.

export const INDEXED_CMS_SLUGS = new Set<string>([
  // Airports
  "airport-king-abdulaziz-international",
  "airport-prince-mohammad-bin-abdulaziz",
  "airport-taif-international",
  "airport-king-khalid-international",
  // Services
  "umrah-taxi",
  "airport-transfer-service",
  "vip-transfer",
  "family-transport",
  "group-transport",
  "hotel-transfer",
  // Routes not covered by the dedicated route pages
  "jeddah-to-madinah",
  "madinah-to-jeddah",
  "makkah-to-jeddah",
  "jeddah-to-makkah",
  "makkah-to-madinah",
  "madinah-to-makkah",
  "makkah-to-taif",
  "taif-to-makkah",
  "jeddah-to-taif",
  "king-abdulaziz-international-to-madinah",
  "king-abdulaziz-international-to-haram-makkah",
  "prince-mohammad-bin-abdulaziz-to-masjid-nabawi",
  "taif-international-to-makkah",
]);

export const INDEXED_BLOG_SLUGS = new Set<string>([
  "jeddah-airport-taxi-fare",
  "taxi-jeddah-makkah-prices",
  "taxi-fares-saudi-guide",
  "distance-jeddah-airport-makkah",
  "distance-makkah-madinah",
  "jeddah-airport-to-haram",
  "jeddah-airport-to-madinah-transfer",
  "makkah-to-madinah-transfer",
  "madinah-to-makkah-transfer",
  "madinah-airport-to-haram-transfer",
  "taif-to-makkah-transfer",
  "monthly-driver-with-car",
  "vip-airport-services",
  "umrah-step-by-step",
  "bus-vs-taxi-madinah-makkah",
]);

export const isIndexedCms = (slug: string, released = false) => INDEXED_CMS_SLUGS.has(slug) || released;
export const isIndexedBlog = (slug: string, released = false) => INDEXED_BLOG_SLUGS.has(slug) || released;
