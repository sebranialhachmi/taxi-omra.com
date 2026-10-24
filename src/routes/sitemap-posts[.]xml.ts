import { createFileRoute } from "@tanstack/react-router";
import { isIndexedBlog } from "@/lib/index-policy";
import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/site-info";
import { isIndexable } from "@/lib/content-quality";

const BASE_URL = SITE.url;
const LOCALES = ["ar", "en"] as const;

export const Route = createFileRoute("/sitemap-posts.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
        const { data: posts } = await sb.from("blog_posts").select("slug,updated_at,content_ar,content_en,seo_released").eq("published", true);

        const urls: string[] = [];
        for (const p of posts ?? []) {
          if (!isIndexedBlog(p.slug, p.seo_released)) continue;
          for (const lang of LOCALES) {
            const body = lang === "ar" ? (p as any).content_ar : (p as any).content_en;
            if (!isIndexable(body)) continue; // thin posts stay out of the sitemap
            urls.push(`  <url>\n    <loc>${BASE_URL}/${lang}/blog/${p.slug}</loc>\n    <lastmod>${p.updated_at?.slice(0, 10)}</lastmod>\n  </url>`);
          }
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
