import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { CookieConsent } from "@/components/CookieConsent";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SITE } from "@/lib/site-info";
import {
  isLocale,
  LOCALES,
  DEFAULT_LOCALE,
  withLocale,
  type Locale,
} from "@/lib/i18n";
import { resolveRedirect } from "@/lib/seo-tools.functions";
import { CANONICAL_REDIRECTS } from "@/lib/canonical-redirects";
import { getCmsPage } from "@/lib/public.functions";

// Legacy / crawled URLs that never existed as pages → permanent redirect to the
// closest live page, so Search Console stops reporting them as 404s.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/jeddah-airport-to-makkah-taxi": "/jeddah-to-makkah-taxi",
  "/makkah-to-jeddah-taxi": "/jeddah-to-makkah-taxi",
  "/jeddah-to-madinah-taxi": "/routes/jeddah-to-madinah",
  "/madinah-to-jeddah-taxi": "/routes/madinah-to-jeddah",
  "/services/makkah-to-madinah": "/makkah-to-madinah-taxi",
  "/services/jeddah-to-makkah": "/jeddah-to-makkah-taxi",
};

export const Route = createFileRoute("/_public/{-$locale}")({
  beforeLoad: async ({ params, location }) => {
    // Static files (images, fonts, uploaded assets) must never go through the
    // locale/legacy redirect stack — prefixing them with /ar broke every image.
    if (/\.[a-z0-9]{2,5}$/i.test(location.pathname) || /^\/(__l5e|assets|fleet)\//.test(location.pathname)) {
      return;
    }

    const localeLess = location.pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";

    // Template-placeholder URLs (e.g. a SearchAction urlTemplate crawled with
    // literal "{search_term_string}") must die here with a 404 — redirecting
    // them only produced a 301 → 404 chain that Search Console flags as a
    // redirect error.
    if (/[{]}|search_term_string/i.test(location.pathname)) {
      throw notFound();
    }

    // 0) Static legacy + canonical-consolidation redirects (locale preserved).
    const cleanPath = localeLess.replace(/\/+$/, "") || "/";
    const legacy = LEGACY_REDIRECTS[cleanPath] ?? CANONICAL_REDIRECTS[cleanPath];
    if (legacy) {
      const loc = isLocale(params.locale) ? (params.locale as Locale) : DEFAULT_LOCALE;
      throw redirect({ href: withLocale(loc, legacy), replace: true, statusCode: 301 });
    }

    // 1) Redirect manager: check DB-managed 301/302 redirects (locale-agnostic path).
    try {

      const rd = await resolveRedirect({ data: { path: localeLess } });
      if (rd?.destination_path) {
        throw redirect({ href: rd.destination_path, replace: true });
      }
    } catch (e) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
      // ignore lookup errors; continue with locale resolution
    }

    // 2) First segment is not a locale (e.g. /umrah-taxi, /makkah-to-jeddah).
    //    These are legacy unprefixed URLs: map them to their live section in a
    //    single 301 instead of dropping the path and bouncing through "/".
    if (params.locale !== undefined && !isLocale(params.locale)) {
      const slug = location.pathname.replace(/^\//, "").replace(/\/+$/, "");
      const single = slug && !slug.includes("/");
      let guess = single
        ? `/${slug.includes("-to-") ? "routes" : "services"}/${slug}`
        : location.pathname.replace(/\/+$/, "");
      // Unprefixed /p/<slug>: resolve the typed section URL now so the
      // visitor reaches the final page in one hop instead of /ar/p/... → typed.
      const pm = guess.match(/^\/p\/([^/]+)$/);
      if (pm) {
        try {
          const page: any = await getCmsPage({ data: { slug: pm[1] } });
          const pre = ({ city: "/cities", airport: "/airports", service: "/services", route_page: "/routes" } as Record<string, string>)[page?.page_type];
          if (pre) guess = `${pre}/${pm[1]}`;
        } catch { /* fall back to /p/ */ }
      }
      // Resolve through the consolidation maps now so the visitor lands on the
      // final page in ONE hop (no 301 → 301 chains).
      const target =
        LEGACY_REDIRECTS[guess] ?? CANONICAL_REDIRECTS[guess] ?? guess;
      throw redirect({
        href: withLocale(DEFAULT_LOCALE, target),
        replace: true,
        statusCode: 301,
      });
    }



    // 3) Missing prefix → always redirect to Arabic. Do not infer from
    //    browser language, Accept-Language, cookies, localStorage, or cache.
    if (!params.locale) {
      let path = location.pathname;
      const pm = path.replace(/\/+$/, "").match(/^\/p\/([^/]+)$/);
      if (pm) {
        try {
          const page: any = await getCmsPage({ data: { slug: pm[1] } });
          const pre = ({ city: "/cities", airport: "/airports", service: "/services", route_page: "/routes" } as Record<string, string>)[page?.page_type];
          if (pre) path = CANONICAL_REDIRECTS[`${pre}/${pm[1]}`] ?? `${pre}/${pm[1]}`;
        } catch { /* keep /p/ path */ }
      }
      const target = withLocale(DEFAULT_LOCALE, path);
      // Use `href` (not `to`) so literal braces/odd characters in the path are
      // not parsed as route params — that produced a self-redirect loop.
      throw redirect({ href: target, replace: true, statusCode: 301 });
    }

  },
  loader: ({ location }) => {
    return { pathname: location.pathname };
  },
  staleTime: 60000,
  gcTime: 300000,
  head: ({ params, loaderData }) => {
    const locale = (params.locale ?? DEFAULT_LOCALE) as Locale;
    const pathname = loaderData?.pathname ?? `/${locale}`;
    const abs = (p: string) => `${SITE.url}${p.startsWith("/") ? p : `/${p}`}`;
    const canonical = abs(pathname);
    const alternates = LOCALES.map((l) => ({
      rel: "alternate",
      hrefLang: l,
      href: abs(withLocale(l, pathname)),
    }));
    return {
      meta: [
        { property: "og:locale", content: locale === "ar" ? "ar_SA" : "en_US" },
        { property: "og:url", content: canonical },
      ],
      links: [
        { rel: "canonical", href: canonical },
        ...alternates,
        { rel: "alternate", hrefLang: "x-default", href: abs(`/${DEFAULT_LOCALE}`) },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TaxiService",
            name: SITE.brand[locale],
            telephone: SITE.phone,
            email: SITE.email,
            inLanguage: locale,
            address: {
              "@type": "PostalAddress",
              addressLocality: SITE.city,
              addressCountry: SITE.country,
            },
            geo: { "@type": "GeoCoordinates", latitude: SITE.latitude, longitude: SITE.longitude },
            areaServed: SITE.city,
            openingHours: "Mo-Su 00:00-23:59",
          }),
        },
      ],
    };
  },
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AnnouncementBar />
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppFab />
      <CookieConsent />
    </div>
  );
}
