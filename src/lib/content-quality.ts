// Shared helper to decide whether a piece of content is substantial enough to
// be indexed. Thin pages get classified as "Soft 404" / "Crawled - currently
// not indexed" by Google, which harms the whole site's crawl budget.

export const MIN_INDEXABLE_CHARS = 1000;

/** Approximate plain-text length of an HTML or plain-text body. */
export function textLength(content: string | null | undefined): number {
  if (!content) return 0;
  const stripped = content
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length;
}

export function isIndexable(content: string | null | undefined): boolean {
  return textLength(content) >= MIN_INDEXABLE_CHARS;
}
