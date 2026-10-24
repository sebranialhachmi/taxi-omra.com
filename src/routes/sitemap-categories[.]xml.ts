import { createFileRoute } from "@tanstack/react-router";
import { select } from "@/server/db.server";
import { SITE } from "@/lib/site-info";

const BASE_URL = SITE.url;
const LOCALES = ["ar", "en"] as const;

export const Route = createFileRoute("/sitemap-categories.xml")({
  server: {
    handlers: {
      GET: async () => {
        const cats = await select("fleet", { where: { is_active: true }, columns: ["code"] });

        const urls: string[] = [];
        for (const c of cats ?? []) {
          for (const lang of LOCALES) {
            urls.push(`  <url>\n    <loc>${BASE_URL}/${lang}/fleet/${c.code}</loc>\n  </url>`);
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
