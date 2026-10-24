import { SITE } from "@/lib/site-info";

/**
 * Image URLs imported with the old content point at /blog-images/*.webp, a
 * folder that was never shipped, so every one of them is a 404. Treat those as
 * "no image" so pages fall back to a bundled photo instead of a broken one.
 */
export function usableImage(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u || u.startsWith("/blog-images/")) return null;
  return u;
}

/** Open Graph, Twitter cards and JSON-LD need absolute URLs. */
export function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE.url}${url.startsWith("/") ? "" : "/"}${url}`;
}
