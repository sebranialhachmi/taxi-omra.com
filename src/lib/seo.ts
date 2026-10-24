// Central SEO helpers: JSON-LD builders + breadcrumb helpers used across public routes.
import { SITE } from "./site-info";
import { isIndexedCms } from "./index-policy";
import { absoluteUrl, usableImage } from "./images";

type Loc = { en: string; ar?: string; url: string };

export function localBusinessJsonLd(locale?: "ar" | "en") {
  return {
    "@context": "https://schema.org",
    // TaxiService alone is a Service type (no address/geo); pairing it with LocalBusiness is valid.
    "@type": ["LocalBusiness", "TaxiService"],
    "@id": `${SITE.url}/#taxi`,
    vatID: SITE.vatNumber,
    name: locale === "ar" ? SITE.brand.ar : SITE.brand.en,
    alternateName: locale === "ar" ? SITE.brand.en : SITE.brand.ar,
    ...(locale ? { inLanguage: locale } : {}),
    telephone: SITE.phone,
    email: SITE.email,
    url: SITE.url,
    image: `${SITE.url}${SITE.ogImage}`,
    priceRange: "$$",
    currenciesAccepted: SITE.currency,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.en,
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.latitude, longitude: SITE.longitude },
    areaServed: [
      { "@type": "City", name: "Jeddah" },
      { "@type": "City", name: "Makkah" },
      { "@type": "City", name: "Madinah" },
      { "@type": "City", name: "Taif" },
    ],
    openingHoursSpecification: [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens: "00:00", closes: "23:59",
    }],
    sameAs: Object.values(SITE.socials).filter(Boolean),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    vatID: SITE.vatNumber,
    name: SITE.brand.en,
    alternateName: SITE.brand.ar,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE.phone,
        contactType: "reservations",
        areaServed: SITE.country,
        availableLanguage: ["en", "ar"],
      },
      {
        "@type": "ContactPoint",
        telephone: `+${SITE.whatsapp}`,
        contactType: "customer service",
        contactOption: "TollFree",
        areaServed: SITE.country,
        availableLanguage: ["en", "ar"],
      },
    ],
    sameAs: Object.values(SITE.socials).filter(Boolean),
  };
}

/**
 * WebApplication schema for the booking app itself.
 * `ratingValue`/`reviewCount` are only emitted when there is at least one
 * real review — Google rejects aggregateRating with a zero review count.
 */
export function webApplicationJsonLd(opts?: {
  description?: string;
  ratingValue?: number;
  reviewCount?: number;
}) {
  const node: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE.url}/#webapp`,
    name: `${SITE.brand.ar} | ${SITE.brand.en}`,
    alternateName: SITE.brand.en,
    url: SITE.url,
    applicationCategory: "TravelApplication",
    operatingSystem: "Web (All)",
    browserRequirements: "Requires JavaScript. Works in any modern browser.",
    inLanguage: ["ar", "en"],
    image: `${SITE.url}${SITE.ogImage}`,
    screenshot: `${SITE.url}${SITE.ogImage}`,
    description:
      opts?.description ??
      "خدمة تاكسي العمرة والتوصيل من مطار جدة إلى مكة المكرمة وجميع مدن المملكة، مع حجوزات سهلة، أسعار ثابتة، وسيارات حديثة تعمل على مدار 24 ساعة.",
    publisher: { "@id": `${SITE.url}/#organization` },
    author: {
      "@type": "Organization",
      name: SITE.brand.en,
      url: SITE.url,
      logo: `${SITE.url}${SITE.logo}`,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: SITE.currency,
      availability: "https://schema.org/InStock",
      description: "Free booking request — fares are quoted per trip.",
      url: SITE.url,
    },
    sameAs: Object.values(SITE.socials).filter(Boolean),
  };
  if (opts?.reviewCount && opts.reviewCount > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(opts.ratingValue ?? 5),
      bestRating: "5",
      worstRating: "1",
      reviewCount: String(opts.reviewCount),
    };
  }
  return node;
}

export function breadcrumbJsonLd(trail: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.url),
    })),
  };
}

export function articleJsonLd(p: {
  title: string; description?: string; image?: string;
  datePublished?: string; dateModified?: string; author?: string; url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    image: p.image,
    datePublished: p.datePublished,
    dateModified: p.dateModified ?? p.datePublished,
    author: { "@type": "Person", name: p.author ?? SITE.brand.en },
    publisher: {
      "@type": "Organization",
      name: SITE.brand.en,
      logo: { "@type": "ImageObject", url: `${SITE.url}${SITE.logo}` },
    },
    mainEntityOfPage: p.url,
  };
}

export function faqPageJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function serviceJsonLd(s: { name: string; description?: string; areaServed?: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    provider: { "@type": "TaxiService", name: SITE.brand.en, telephone: SITE.phone },
    areaServed: s.areaServed ?? SITE.city,
    url: s.url,
  };
}

export function vehicleJsonLd(v: { name: string; description?: string; image?: string; brand?: string; seatingCapacity?: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: v.name,
    description: v.description,
    image: v.image,
    brand: v.brand ? { "@type": "Brand", name: v.brand } : undefined,
    vehicleSeatingCapacity: v.seatingCapacity,
  };
}

// Build a full <head> block from a CMS page's SEO fields.
export function buildCmsHead(p: {
  slug: string;
  title_en: string; title_ar: string;
  meta_title?: string | null; meta_description?: string | null;
  subtitle_en?: string | null; subtitle_ar?: string | null;
  og_title?: string | null; og_description?: string | null;
  og_image_url?: string | null; twitter_card?: string | null;
  robots?: string | null; canonical_url?: string | null;
  keywords?: string[] | null; schema_type?: string | null;
  custom_schema?: unknown;
  seo_released?: boolean;
}, locale: "ar" | "en" = "en") {
  // The stored meta/og fields are English. Arabic pages build their title and
  // description from the Arabic fields so they match the Arabic page body.
  const ar = locale === "ar" && !!p.title_ar;
  const title = ar ? `${p.title_ar} | تاكسي العمرة` : p.meta_title || p.title_en;
  const desc = ar ? p.subtitle_ar || p.title_ar : p.meta_description || p.subtitle_en || "";
  if (ar) { p = { ...p, og_title: null, og_description: null }; }
  // Canonical + og:url are emitted by the public layout (URL-aware). Only add
  // page-specific meta here to avoid duplicate canonical/og:url tags.
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: desc },
    { name: "robots", content: isIndexedCms(p.slug, p.seo_released) ? p.robots || "index,follow" : "noindex, follow" },
    { property: "og:title", content: p.og_title || title },
    { property: "og:description", content: p.og_description || desc },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: p.twitter_card || "summary_large_image" },
    { name: "twitter:title", content: p.og_title || title },
    { name: "twitter:description", content: p.og_description || desc },
  ];
  if (p.keywords?.length) meta.push({ name: "keywords", content: p.keywords.join(", ") });
  const ogImage = usableImage(p.og_image_url) ?? usableImage((p as any).featured_image_url);
  if (ogImage) meta.push({ property: "og:image", content: absoluteUrl(ogImage) }, { name: "twitter:image", content: absoluteUrl(ogImage) });
  const scripts: any[] = [];
  if (p.schema_type) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(
        p.schema_type === "Service"
          ? serviceJsonLd({ name: title, description: desc, url: `/${p.slug}` })
          : p.schema_type === "FAQPage"
          ? { "@context": "https://schema.org", "@type": "FAQPage", name: title }
          : localBusinessJsonLd(),
      ),
    });
  }
  if (p.custom_schema && typeof p.custom_schema === "object") {
    scripts.push({ type: "application/ld+json", children: JSON.stringify(p.custom_schema) });
  }
  return { meta, links: [] as Array<Record<string, string>>, scripts };
}

export const _loc = (l: Loc) => l;
