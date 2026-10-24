// Isomorphic HTML utilities for the blog rich-text pipeline.
// Used both when saving (admin) and when rendering (SSR public page).

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "sub", "sup", "code", "pre",
  "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading", "decoding"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
  "*": new Set(["dir"]),
};

// Blocks that must never survive, including their content.
const STRIP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|form|svg|math)\b[\s\S]*?<\/\1\s*>/gi;
const SELF_CLOSING_DANGEROUS = /<\/?(script|style|iframe|object|embed|noscript|form|input|button|link|meta|svg|math)\b[^>]*>/gi;

function safeUrl(value: string) {
  const v = value.trim();
  if (/^\s*(javascript|vbscript|file):/i.test(v)) return "";
  if (/^data:/i.test(v) && !/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(v)) return "";
  return v;
}

function cleanAttrs(tag: string, raw: string) {
  const out: string[] = [];
  const re = /([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    let value = m[3] ?? m[4] ?? m[5] ?? "";
    if (name.startsWith("on")) continue;
    const allowed = ALLOWED_ATTRS[tag]?.has(name) || ALLOWED_ATTRS["*"].has(name);
    if (!allowed) continue;
    if (name === "href" || name === "src") {
      value = safeUrl(value);
      if (!value) continue;
    }
    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }
  if (tag === "a") {
    const hasTarget = out.some((a) => a.startsWith("target="));
    if (hasTarget && !out.some((a) => a.startsWith("rel="))) out.push('rel="noopener noreferrer"');
  }
  if (tag === "img") {
    if (!out.some((a) => a.startsWith("loading="))) out.push('loading="lazy"');
    if (!out.some((a) => a.startsWith("decoding="))) out.push('decoding="async"');
    if (!out.some((a) => a.startsWith("alt="))) out.push('alt=""');
  }
  return out.length ? " " + out.join(" ") : "";
}

/**
 * Allow-list sanitizer. Keeps semantic article structure (headings, lists,
 * tables, links, images) and removes scripts, handlers and unsafe URLs.
 * H1 is downgraded to H2 so a post always has exactly one H1 (the title).
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  let html = String(input);
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(STRIP_WITH_CONTENT, "");
  html = html.replace(SELF_CLOSING_DANGEROUS, "");
  html = html.replace(/<h1\b([^>]*)>/gi, "<h2$1>").replace(/<\/h1\s*>/gi, "</h2>");

  html = html.replace(/<\/?([a-zA-Z][-\w]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;
    const selfClosing = /\/\s*$/.test(rawAttrs);
    return `<${tag}${cleanAttrs(tag, rawAttrs)}${selfClosing || tag === "br" || tag === "hr" || tag === "img" ? " /" : ""}>`;
  });

  return html.trim();
}

export function looksLikeHtml(value: string | null | undefined) {
  if (!value) return false;
  return /<(p|h2|h3|h4|ul|ol|li|table|blockquote|img|figure|div|strong|em|a)\b/i.test(value);
}

/** Backward compatibility: render legacy plain-text posts as paragraphs. */
export function plainTextToHtml(text: string | null | undefined) {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

/** Content coming from the DB may be legacy plain text or rich HTML. */
export function renderableContent(value: string | null | undefined) {
  return looksLikeHtml(value) ? sanitizeHtml(value) : plainTextToHtml(value);
}
