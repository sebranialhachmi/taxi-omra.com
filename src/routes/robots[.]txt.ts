// Single source of truth for robots.txt (there must be no static copy in
// /public). The Sitemap URL follows SITE.url, so changing VITE_SITE_URL
// updates every environment.
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE } from "@/lib/site-info";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          // Page data requests must stay crawlable: Google needs them to render pages.
          "Allow: /_serverFn/",
          "Allow: /api/public/media/",
          "Disallow: /admin/",
          "Disallow: /auth",
          "Disallow: /reset-password",
          "Disallow: /_authenticated/",
          "Disallow: /api/",
          "",
          ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
          `Sitemap: ${SITE.url}/sitemap-index.xml`,
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
