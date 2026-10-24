import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site-info";

const BASE_URL = SITE.url;

export const Route = createFileRoute("/sitemap-index.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sitemaps = [
          "/sitemap.xml",
          "/sitemap-posts.xml",
          "/sitemap-pages.xml",
          "/sitemap-categories.xml",
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...sitemaps.map(s => `  <sitemap>\n    <loc>${BASE_URL}${s}</loc>\n  </sitemap>`),
          `</sitemapindex>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
