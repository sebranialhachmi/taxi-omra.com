import { Link, useLocation } from "@tanstack/react-router";
import { useI18n, withLocale } from "@/lib/i18n";

const LINKS = [
  { to: "/jeddah-airport-taxi", ar: "تاكسي مطار جدة", en: "Jeddah airport taxi" },
  { to: "/taxi-jeddah", ar: "تاكسي جدة", en: "Taxi in Jeddah" },
  { to: "/taxi-makkah", ar: "تاكسي مكة المكرمة", en: "Taxi in Makkah" },
  { to: "/taxi-madinah", ar: "تاكسي المدينة المنورة", en: "Taxi in Madinah" },
  { to: "/taxi-taif", ar: "تاكسي الطائف", en: "Taxi in Taif" },
  { to: "/guide/taxi-fares", ar: "أسعار التاكسي", en: "Taxi fares" },
  { to: "/fleet", ar: "السيارات والفئات", en: "Our cars" },
  { to: "/contact", ar: "احجز عبر واتساب", en: "Book on WhatsApp" },
];

/** Site-wide internal links to the main service pages (not on home, articles or admin). */
export function ServiceLinks() {
  const { locale } = useI18n();
  const { pathname } = useLocation();
  const path = pathname.replace(/^\/(ar|en)(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  if (path === "/" || path.startsWith("/blog") || path.startsWith("/admin")) return null;
  const ar = locale === "ar";
  return (
    <nav className="border-t bg-muted/30 py-8" aria-label={ar ? "خدماتنا" : "Our services"}>
      <div className="container mx-auto px-4">
        <p className="mb-3 font-semibold">{ar ? "خدمات تاكسي العمرة" : "Umrah Taxi services"}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LINKS.filter((l) => l.to !== path).map((l) => (
            <li key={l.to}>
              <Link to={withLocale(locale, l.to) as any} className="text-primary underline-offset-4 hover:underline">
                {ar ? l.ar : l.en}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
