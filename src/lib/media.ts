// Stable, crawlable public URL for a media-library object.
// The storage bucket stays private; this proxies through our own cached route.
export function publicMediaUrl(path: string) {
  if (!path) return "";
  // Already a usable URL (external, or a bundled asset path).
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `/api/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function isMediaProxyUrl(url: string) {
  return url.startsWith("/api/public/media/");
}
