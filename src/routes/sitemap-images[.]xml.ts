// Image sitemap — includes hero/OG/featured images from CMS pages, blog posts, vehicles.
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/site-info";
import { isIndexedCms, isIndexedBlog } from "@/lib/index-policy";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";

export const Route = createFileRoute("/sitemap-images.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const entries: { loc: string; images: { url: string; caption?: string }[] }[] = [];
        try {
          const [{ data: pages }, { data: posts }] = await Promise.all([
            sb.from("cms_pages")
              .select("slug,page_type,title_en,og_image_url,featured_image_url,gallery,seo_released")
              .eq("published", true),
            sb.from("blog_posts")
              .select("slug,title_en,og_image_url,seo_released")
              .eq("published", true),
          ]);
          const prefixOf = (t: string) =>
            t === "service" ? "services" :
            t === "city" ? "cities" :
            t === "airport" ? "airports" :
            t === "route_page" ? "routes" : "p";
          const seen = new Set<string>();
          const pushImg = (arr: { url: string; caption?: string }[], url: string, caption?: string) => {
            const k = url;
            if (!k || seen.has(k)) return;
            seen.add(k);
            arr.push({ url, caption });
          };
          for (const p of pages ?? []) {
            if (!isIndexedCms(p.slug, p.seo_released) || isConsolidatedDuplicate(`/${prefixOf(p.page_type)}/${p.slug}`)) continue;
            const images: { url: string; caption?: string }[] = [];
            seen.clear();
            if ((p as any).featured_image_url) pushImg(images, (p as any).featured_image_url, p.title_en);
            if ((p as any).og_image_url) pushImg(images, (p as any).og_image_url, p.title_en);
            const gallery = (p as any).gallery;
            if (Array.isArray(gallery)) {
              for (const g of gallery.slice(0, 20)) {
                if (typeof g === "string") pushImg(images, g);
                else if (g && typeof g === "object" && "url" in g) pushImg(images, String((g as any).url), (g as any).caption);
              }
            }
            if (images.length) {
              const path = `/${prefixOf((p as any).page_type)}/${p.slug}`;
              // Emit both locale-prefixed URLs so crawlers associate images with real pages.
              entries.push({ loc: `/ar${path}`, images });
              entries.push({ loc: `/en${path}`, images });
            }
          }
          for (const p of posts ?? []) {
            if (!isIndexedBlog(p.slug, p.seo_released)) continue;
            if ((p as any).og_image_url) {
              const imgs = [{ url: (p as any).og_image_url, caption: p.title_en }];
              entries.push({ loc: `/ar/blog/${p.slug}`, images: imgs });
              entries.push({ loc: `/en/blog/${p.slug}`, images: imgs });
            }
          }
        } catch {
          /* fall through */
        }
        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const urls = entries.map((e) => {
          const imgs = e.images.map((i) =>
            `    <image:image><image:loc>${esc(i.url)}</image:loc>${i.caption ? `<image:caption>${esc(i.caption)}</image:caption>` : ""}</image:image>`
          ).join("\n");
          return `  <url>\n    <loc>${esc(SITE.url + e.loc)}</loc>\n${imgs}\n  </url>`;
        });
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
