// Single source of truth for business identity.
//
// All values are configuration-driven — override any of them via Vite env
// variables (VITE_SITE_*) at build/deploy time. Changing the public domain,
// phone number, or brand name for launch is a matter of setting one env var
// per field: no code edits required.
//
// Because these values are consumed by both client bundles and SSR/server
// functions, we use `import.meta.env.VITE_*` (available in both) with sane
// fallbacks so the app keeps working even without a .env override.

const env = (import.meta as any).env ?? {};

const pick = (key: string, fallback: string): string => {
  const v = env[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
};
const pickNum = (key: string, fallback: number): number => {
  const v = env[key];
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

// --- Fallback defaults (used only when VITE_SITE_* is not provided). ---
const DEFAULTS = {
  brandEn: "Umrah Taxi Saudi",
  brandAr: "تاكسي العمرة",
  legalEn: "Omra Taxi",
  legalAr: "تاكسي العمرة",
  taglineEn: "Comfortable Airport Transfers from Jeddah Airport to Makkah.",
  taglineAr: "رحلتك تبدأ براحة... من مطار جدة إلى مكة بأمان واحترافية.",
  url: "https://taxi-omra.com",
  phone: "+966551796487",
  whatsapp: "966551796487",
  email: "admin@taxi-omra.com",
  addressEn: "Thabit bin Amr Al-Najjari St, Al Shoqiyah, Makkah 24232, Saudi Arabia",
  addressAr: "شارع ثابت بن عمرو النجاري، الشوقية، مكة المكرمة 24232",
  vatNumber: "311452085700003",
  city: "Makkah",
  region: "Makkah Province",
  country: "SA",
  latitude: 21.3891,
  longitude: 39.8579,
  hoursEn: "24/7",
  hoursAr: "٢٤ ساعة / ٧ أيام",
  currency: "SAR",
  timezone: "Asia/Riyadh",
  ogImage: "/og-cover.jpg",
  logo: "/logo.png",
};

const SITE_URL = pick("VITE_SITE_URL", DEFAULTS.url).replace(/\/+$/, "");

export const SITE = {
  brand: {
    en: pick("VITE_SITE_BRAND_EN", DEFAULTS.brandEn),
    ar: pick("VITE_SITE_BRAND_AR", DEFAULTS.brandAr),
  },
  legalName: {
    en: pick("VITE_SITE_LEGAL_EN", DEFAULTS.legalEn),
    ar: pick("VITE_SITE_LEGAL_AR", DEFAULTS.legalAr),
  },
  tagline: {
    en: pick("VITE_SITE_TAGLINE_EN", DEFAULTS.taglineEn),
    ar: pick("VITE_SITE_TAGLINE_AR", DEFAULTS.taglineAr),
  },
  url: SITE_URL,
  domain: SITE_URL.replace(/^https?:\/\//, ""),
  phone: pick("VITE_SITE_PHONE", DEFAULTS.phone),
  whatsapp: pick("VITE_SITE_WHATSAPP", DEFAULTS.whatsapp), // digits only
  email: pick("VITE_SITE_EMAIL", DEFAULTS.email),
  address: {
    en: pick("VITE_SITE_ADDRESS_EN", DEFAULTS.addressEn),
    ar: pick("VITE_SITE_ADDRESS_AR", DEFAULTS.addressAr),
  },
  city: pick("VITE_SITE_CITY", DEFAULTS.city),
  vatNumber: pick("VITE_SITE_VAT_NUMBER", DEFAULTS.vatNumber),
  region: pick("VITE_SITE_REGION", DEFAULTS.region),
  country: pick("VITE_SITE_COUNTRY", DEFAULTS.country),
  latitude: pickNum("VITE_SITE_LAT", DEFAULTS.latitude),
  longitude: pickNum("VITE_SITE_LNG", DEFAULTS.longitude),
  hours: {
    en: pick("VITE_SITE_HOURS_EN", DEFAULTS.hoursEn),
    ar: pick("VITE_SITE_HOURS_AR", DEFAULTS.hoursAr),
  },
  currency: pick("VITE_SITE_CURRENCY", DEFAULTS.currency),
  timezone: pick("VITE_SITE_TIMEZONE", DEFAULTS.timezone),
  ogImage: pick("VITE_SITE_OG_IMAGE", DEFAULTS.ogImage),
  logo: pick("VITE_SITE_LOGO", DEFAULTS.logo),
  socials: {
    twitter: pick("VITE_SITE_TWITTER", ""),
    instagram: pick("VITE_SITE_INSTAGRAM", ""),
    facebook: pick("VITE_SITE_FACEBOOK", ""),
    tiktok: pick("VITE_SITE_TIKTOK", ""),
    youtube: pick("VITE_SITE_YOUTUBE", ""),
    linkedin: pick("VITE_SITE_LINKEDIN", ""),
  },
};

/** Build an absolute URL onto the configured site origin. Accepts absolute or relative input. */
export const absoluteUrl = (path: string = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
};

/** Compose a page title suffixed with the brand (English by default). */
export const brandTitle = (title: string, locale: "en" | "ar" = "en") =>
  `${title} — ${locale === "ar" ? SITE.brand.ar : SITE.brand.en}`;

export const waLink = (text?: string) =>
  `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export const telLink = () => `tel:${SITE.phone}`;
export const mailLink = (subject?: string) =>
  `mailto:${SITE.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
