import { createFileRoute } from "@tanstack/react-router";
import { select } from "@/server/db.server";
import { SITE } from "@/lib/site-info";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";
import { isIndexedCms } from "@/lib/index-policy";

const BASE_URL = SITE.url;
const LOCALES = ["ar", "en"] as const;

export const Route = createFileRoute("/sitemap-pages.xml")({
  server: {
    handlers: {
      GET: async () => {
        const pages = await select("pages", { where: { published: true }, columns: ["slug", "page_type", "updated_at", "seo_released"] });
        
        const typeToPrefix: Record<string, string> = {
          service: "/services",
          city: "/cities",
          airport: "/airports",
          route_page: "/routes",
        };

        const staticPaths = [
          "/taxi-jeddah",
          "/jeddah-airport-taxi",
          "/taxi-makkah",
          "/taxi-madinah",
          "/taxi-taif",
          "/taxi-dammam",
          "/jeddah-to-makkah-taxi",
          "/makkah-to-madinah-taxi",
          "/guide/taxi-fares",
          "/about",
          "/fleet",
          "/contact",
          "/faq",
        ];

        const urls: string[] = [];
        
        // Add static localized pages
        for (const path of staticPaths) {
          for (const lang of LOCALES) {
            const loc = `${BASE_URL}/${lang}${path}`;
            const alternates = LOCALES.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${path}" />`).join("\n");
            urls.push(`  <url>\n    <loc>${loc}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/ar${path}" />\n  </url>`);
          }
        }

        for (const p of pages ?? []) {
          if (!isIndexedCms(p.slug, p.seo_released)) continue;
          const prefix = typeToPrefix[p.page_type as string] ?? "/p";
          if (isConsolidatedDuplicate(`${prefix}/${p.slug}`)) continue;
          for (const lang of LOCALES) {
            urls.push(`  <url>\n    <loc>${BASE_URL}/${lang}${prefix}/${p.slug}</loc>\n    <lastmod>${p.updated_at?.slice(0, 10)}</lastmod>\n  </url>`);
          }
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
      },
    },
  },
});
