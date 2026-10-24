/**
 * Canonical consolidation map (SEO step 2).
 *
 * The site grew several URLs that target the exact same query intent
 * (e.g. /cities/city-jeddah, /cities/jeddah and /taxi-jeddah). Those duplicates
 * compete with each other in Google (keyword cannibalisation) and split link
 * equity. Every key below is a duplicate URL that now 301s to the single
 * canonical page listed as its value, and is excluded from every sitemap.
 *
 * Paths are locale-less; the redirect keeps the visitor's locale prefix.
 */
export const CANONICAL_REDIRECTS: Record<string, string> = {
  // ---- Generic /p/ copies of typed CMS pages ----
  "/p/khalid-al-mutairi": "/about", // misfiled testimonial, thin page
  "/p/luxury-transfer": "/services/luxury-transfer",

  // ---- Cities: one page per city, the /taxi-<city> landing page wins ----
  "/cities/city-jeddah": "/taxi-jeddah",
  "/cities/jeddah": "/taxi-jeddah",
  "/cities/city-makkah": "/taxi-makkah",
  "/cities/makkah": "/taxi-makkah",
  "/cities/city-madinah": "/taxi-madinah",
  "/cities/madinah": "/taxi-madinah",
  "/cities/city-taif": "/taxi-taif",
  "/cities/taif": "/taxi-taif",

  // ---- Airports: one page per airport ----
  "/airports/king-abdulaziz-jed": "/jeddah-airport-taxi",
  "/airports/airport-king-abdulaziz-international": "/jeddah-airport-taxi",
  "/airports/prince-mohammad-med": "/airports/airport-prince-mohammad-bin-abdulaziz",
  "/airports/airport-taif-tif": "/airports/airport-taif-international",
  "/airports/airport-transfer": "/airport-transfers",

  // ---- Routes: one page per direction ----
  "/routes/jeddah-makkah": "/jeddah-to-makkah-taxi",
  "/routes/jeddah-to-makkah": "/jeddah-to-makkah-taxi",
  "/routes/makkah-madinah": "/makkah-to-madinah-taxi",
  "/routes/makkah-to-madinah": "/makkah-to-madinah-taxi",
  "/routes/madinah-to-makkah": "/madinah-to-makkah-taxi",
  "/routes/makkah-to-taif": "/makkah-to-taif-taxi",
  "/routes/taif-to-makkah": "/taif-to-makkah-taxi",

  // ---- Services: one page per service intent ----
  "/services/airport-transfer-service": "/airport-transfers",
  "/services/hotel-transfer-service": "/services/hotel-transfer",
  "/services/corporate": "/services/corporate-transport",
  "/services/business-vip": "/services/business-transfer",
  "/services/intercity": "/services/intercity-transfer",
  "/services/umrah-transport": "/services/umrah-taxi",
  "/services/hourly-chauffeur": "/services/hourly-chauffeur-service",
};

/** True when the locale-less path is a consolidated duplicate (never index it). */
export function isConsolidatedDuplicate(path: string): boolean {
  const clean = path.replace(/\/+$/, "") || "/";
  return clean in CANONICAL_REDIRECTS;
}
