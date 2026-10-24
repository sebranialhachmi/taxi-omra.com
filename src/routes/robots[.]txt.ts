// Server-rendered robots.txt so the Sitemap URL always follows the
// configured SITE.url. Change VITE_SITE_URL to update every environment.
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin/",
          "Disallow: /auth",
          "Disallow: /_authenticated/",
          "",
          `Sitemap: ${SITE.url}/sitemap.xml`,
          `Sitemap: ${SITE.url}/sitemap-images.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
