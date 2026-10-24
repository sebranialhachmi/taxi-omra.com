import { defineConfig } from "nitro";

// Unhashed files from /public (logo, fleet photos, icons) would otherwise be
// re-downloaded on every visit ("Use efficient cache lifetimes" in Lighthouse).
const cache = { headers: { "cache-control": "public, max-age=2592000" } };

export default defineConfig({
  routeRules: {
    "/fleet/**": cache,
    "/logo.png": cache,
    "/favicon.ico": cache,
    "/apple-touch-icon.png": cache,
    "/android-chrome-192x192.png": cache,
    "/android-chrome-512x512.png": cache,
    "/og-cover.jpg": cache,
    "/og-home-ar.jpg": cache,
    "/og-home-en.jpg": cache,
  },
});
