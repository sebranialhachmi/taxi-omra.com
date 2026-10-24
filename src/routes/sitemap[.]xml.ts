// The index at /sitemap-index.xml lists every sitemap. Older links and crawlers
// that still request /sitemap.xml are sent there instead of getting a second,
// overlapping list of URLs.
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(null, { status: 301, headers: { Location: new URL("/sitemap-index.xml", request.url).toString() } }),
    },
  },
});
