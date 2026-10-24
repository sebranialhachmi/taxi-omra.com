import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/site-info";
import { isIndexable } from "@/lib/content-quality";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";
import { isIndexedCms, isIndexedBlog } from "@/lib/index-policy";

const BASE_URL = SITE.url; // canonical origin from configuration (VITE_SITE_URL)
const LOCALES = ["ar", "en"] as const;
type Locale = (typeof LOCALES)[number];

interface SitemapEntry {
  path: string; // locale-less path, e.g. "/about" or "/" or "/blog/foo"
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/services", changefreq: "weekly", priority: "0.9" },
          { path: "/airport-transfers", changefreq: "weekly", priority: "0.9" },
          { path: "/fleet", changefreq: "weekly", priority: "0.8" },
          { path: "/cities", changefreq: "weekly", priority: "0.8" },
          { path: "/airports", changefreq: "weekly", priority: "0.8" },
          { path: "/routes", changefreq: "weekly", priority: "0.8" },
          { path: "/guide/taxi-fares", changefreq: "monthly", priority: "0.8" },
          { path: "/booking", changefreq: "monthly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/refund", changefreq: "yearly", priority: "0.3" },
          { path: "/cancellation", changefreq: "yearly", priority: "0.3" },
        ];
        
        // Define core static routes that have physical files in src/routes/_public.{-$locale}.*.tsx
        const staticPublicRoutes = [
          "taxi-jeddah",
          "jeddah-airport-taxi",
          "taxi-makkah",
          "taxi-madinah",
          "taxi-taif",
          "taxi-riyadh",
          "taxi-dammam",
          "jeddah-to-makkah-taxi",
          "makkah-to-madinah-taxi",
          "madinah-to-makkah-taxi",
          "makkah-to-taif-taxi",
          "taif-to-makkah-taxi",
        ];

        for (const route of staticPublicRoutes) {
          entries.push({ path: `/${route}`, changefreq: "weekly", priority: "0.9" });
        }
        try {
          const [{ data: pages }, { data: posts }, { data: cats }] = await Promise.all([
            sb.from("cms_pages").select("slug,page_type,updated_at,seo_released").eq("published", true),
            sb.from("blog_posts").select("slug,updated_at,content_ar,content_en,seo_released").eq("published", true),
            sb.from("vehicle_categories").select("code,created_at").eq("is_active", true),
          ]);
          const typeToPrefix: Record<string, string> = {
            service: "/services",
            city: "/cities",
            airport: "/airports",
            route_page: "/routes",
          };
          for (const p of pages ?? []) {
            if (!isIndexedCms(p.slug, p.seo_released)) continue;
            const prefix = typeToPrefix[(p as any).page_type] ?? "/p";
            entries.push({
              path: `${prefix}/${p.slug}`,
              lastmod: p.updated_at?.slice(0, 10),
              changefreq: "monthly",
              priority: "0.7",
            });
          }
          for (const p of posts ?? []) {
            // Skip thin posts entirely: if neither language has enough content,
            // the URL should not be advertised to search engines.
            if (!isIndexedBlog(p.slug, p.seo_released)) continue;
            if (!isIndexable((p as any).content_ar) && !isIndexable((p as any).content_en)) continue;
            entries.push({ path: `/blog/${p.slug}`, lastmod: p.updated_at?.slice(0, 10), changefreq: "monthly", priority: "0.6" });
          }
          for (const c of cats ?? [])
            entries.push({ path: `/fleet/${(c as any).code}`, changefreq: "monthly", priority: "0.7" });
        } catch {
          /* Data API unreachable — fall back to the static entries. */
        }

        const localizedPath = (path: string, locale: Locale) =>
          path === "/" ? `/${locale}` : `/${locale}${path}`;

        const buildUrl = (entry: SitemapEntry, locale: Locale) => {
          const loc = `${BASE_URL}${localizedPath(entry.path, locale)}`;
          const alternates = LOCALES.map(
            (l) =>
              `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}${localizedPath(entry.path, l)}" />`,
          );
          alternates.push(
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${localizedPath(entry.path, "ar")}" />`,
          );
          return [
            `  <url>`,
            `    <loc>${loc}</loc>`,
            entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
            entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
            entry.priority ? `    <priority>${entry.priority}</priority>` : null,
            ...alternates,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n");
        };

        const urls: string[] = [];
        for (const entry of entries) {
          // Consolidated duplicates 301 elsewhere — never advertise them.
          if (isConsolidatedDuplicate(entry.path)) continue;
          for (const locale of LOCALES) {
            urls.push(buildUrl(entry, locale));
          }
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
