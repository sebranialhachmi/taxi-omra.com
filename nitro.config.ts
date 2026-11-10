import { defineConfig } from "nitro";

// Unhashed files from /public (logo, fleet photos, icons) would otherwise be
// re-downloaded on every visit ("Use efficient cache lifetimes" in Lighthouse).
const cache = { headers: { "cache-control": "public, max-age=2592000" } };

const moved = (to: string) => ({ redirect: { to, status: 301 } });

export default defineConfig({
  routeRules: {
    // Old internal links that Google already crawled (locale-prefixed, so the app router never sees them).
    "/ar/fare-guide": moved("/ar/guide/taxi-fares"),
    "/en/fare-guide": moved("/en/guide/taxi-fares"),
    "/ar/jeddah-airport-to-haram": moved("/ar/blog/jeddah-airport-to-haram"),
    "/en/jeddah-airport-to-haram": moved("/en/blog/jeddah-airport-to-haram"),
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
