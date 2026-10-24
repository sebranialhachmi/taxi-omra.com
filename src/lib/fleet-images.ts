// Fleet image helpers — resolve a category's featured image, gallery, and
// bilingual ALT text. Prefers the images stored on the category in the DB
// (featured_image_url / gallery), then falls back to a legacy per-code map
// for any category that hasn't been assigned images yet.
import sedanImg from "@/assets/fleet-sedan.jpg";
import suvImg from "@/assets/fleet-suv.jpg";
import vanImg from "@/assets/fleet-van.jpg";

const LEGACY_BY_CODE: Record<string, string> = {
  economy: sedanImg,
  standard: sedanImg,
  sedan: sedanImg,
  business: sedanImg,
  premium: sedanImg,
  suv: suvImg,
  family_suv: suvImg,
  vip: suvImg,
  van: vanImg,
  luxury_van: vanImg,
};

export const FALLBACK_FLEET_IMAGES = [sedanImg, suvImg, vanImg];

/** Featured (hero / listing) image for a vehicle category row. */
export function categoryImage(row: any, index = 0): string {
  if (row?.featured_image_url) return row.featured_image_url as string;
  const code = String(row?.code ?? "").toLowerCase();
  return LEGACY_BY_CODE[code] || FALLBACK_FLEET_IMAGES[index % FALLBACK_FLEET_IMAGES.length];
}

/** Full gallery for a vehicle category, guaranteed to contain at least one image. */
export function categoryGallery(row: any, index = 0): string[] {
  const raw = row?.gallery;
  const arr = Array.isArray(raw)
    ? (raw as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  if (arr.length > 0) return arr;
  return [categoryImage(row, index)];
}

/** Bilingual alt text — combines EN + AR names in one attribute for a11y & SEO. */
export function categoryAlt(row: any, locale: "ar" | "en" = "ar"): string {
  const trs = (row?.vehicle_category_translations ?? []) as Array<{ locale: string; name?: string }>;
  const en = trs.find((t) => t.locale === "en")?.name ?? row?.code ?? "";
  const ar = trs.find((t) => t.locale === "ar")?.name ?? "";
  const seg =
    locale === "ar"
      ? `${ar} — نقل من مطار جدة إلى مكة`
      : `${en} — Jeddah Airport to Makkah transfer`;
  // Include the alternate language as well so screen readers & crawlers get both.
  const alt = locale === "ar" ? `${seg} | ${en}` : `${seg} | ${ar}`;
  return alt.replace(/^\s*—\s*/, "").trim();
}
