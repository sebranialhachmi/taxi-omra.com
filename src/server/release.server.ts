// Automatic SEO release: shows pages and articles to Google a few at a time instead of all at once.
// A release flips `seo_released` (which puts the item in the sitemaps and removes its noindex),
// then tells Bing/Yandex through IndexNow. Google discovers released URLs through the sitemap.
import { select, update, getSettings, setSetting } from "./db.server";
import { checkReadiness } from "../../db/release-rules.mjs";
import { SITE } from "@/lib/site-info";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";

export type QueueItem = {
  table: "pages" | "posts";
  id: number;
  slug: string;
  title: string;
  priority: number;
  manual: boolean;
  ready: boolean;
  problems: string[];
  urls: string[];
};

const PREFIX: Record<string, string> = { service: "/services", city: "/cities", airport: "/airports", route_page: "/routes" };

/** Public URLs (both languages) of a page or article. Consolidated duplicates are skipped. */
export function urlsForRow(table: "pages" | "posts", row: { slug: string; page_type?: string }): string[] {
  const path = table === "posts" ? `/blog/${row.slug}` : `${PREFIX[row.page_type ?? ""] ?? "/p"}/${row.slug}`;
  if (isConsolidatedDuplicate(path)) return [];
  return ["ar", "en"].map((l) => `${SITE.url}/${l}${path}`);
}

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

export async function releaseSettings() {
  const s = await getSettings([
    "auto_release_enabled", "auto_release_every_days", "auto_release_batch", "auto_release_last_at", "auto_release_first_batch",
  ]);
  return {
    enabled: s.auto_release_enabled === "1",
    everyDays: num(s.auto_release_every_days, 3),
    batch: num(s.auto_release_batch, 2),
    lastAt: typeof s.auto_release_last_at === "string" && s.auto_release_last_at ? s.auto_release_last_at : null,
    firstBatch: num(s.auto_release_first_batch, 0),
  };
}

export async function buildQueue(): Promise<QueueItem[]> {
  const [pages, posts] = await Promise.all([
    select("pages", { where: { published: true, seo_released: false } }),
    select("posts", { where: { published: true, seo_released: false } }),
  ]);
  const items: QueueItem[] = [];
  for (const [table, rows] of [["pages", pages], ["posts", posts]] as const) {
    for (const r of rows) {
      const urls = urlsForRow(table, r);
      if (!urls.length) continue; // a consolidated duplicate: it redirects, so releasing it does nothing
      const { ready, problems } = checkReadiness(r, table);
      const priority = Number.isFinite(Number(r.release_priority)) && r.release_priority != null ? Number(r.release_priority) : 1000;
      items.push({
        table, id: r.id, slug: r.slug, title: r.title_ar || r.title_en || r.slug,
        priority, manual: priority >= 900, ready, problems, urls,
      });
    }
  }
  return items.sort((a, b) => a.priority - b.priority || a.id - b.id);
}

export async function pingIndexNow(urls: string[]) {
  if (!urls.length) return;
  try {
    const key = (await getSettings(["indexnow_key"])).indexnow_key;
    if (typeof key !== "string" || !key) return;
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(SITE.url).host, key, keyLocation: `${SITE.url}/indexnow-key.txt`, urlList: urls }),
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`[release] IndexNow ${res.status} for ${urls.length} URL(s)`);
  } catch (e) {
    console.error("[release] IndexNow failed", e);
  }
}

let running = false;

/**
 * Releases the next ready items. Without `force` it only runs when auto-release is on
 * and the configured number of days has passed since the last release.
 */
export async function runAutoRelease(opts: { force?: boolean } = {}) {
  const result = { released: [] as QueueItem[], skipped: [] as QueueItem[], reason: "" };
  if (running) return { ...result, reason: "busy" };
  running = true;
  try {
    const s = await releaseSettings();
    if (!opts.force) {
      if (!s.enabled) return { ...result, reason: "disabled" };
      if (s.lastAt && Date.now() - new Date(s.lastAt).getTime() < s.everyDays * 86_400_000) return { ...result, reason: "not due" };
    }
    const size = !s.lastAt && s.firstBatch ? s.firstBatch : s.batch;
    const queue = (await buildQueue()).filter((i) => !i.manual);
    for (const item of queue) {
      if (result.released.length >= size) break;
      if (!item.ready) { result.skipped.push(item); continue; }
      await update(item.table, item.id, { seo_released: true, released_at: new Date().toISOString() });
      result.released.push(item);
    }
    if (result.released.length) {
      await setSetting("auto_release_last_at", new Date().toISOString());
      if (s.firstBatch) await setSetting("auto_release_first_batch", "");
      await pingIndexNow(result.released.flatMap((i) => i.urls));
      console.log(`[release] released ${result.released.map((i) => i.slug).join(", ")}`);
    } else {
      result.reason = queue.length ? "nothing ready" : "queue empty";
    }
    return result;
  } finally {
    running = false;
  }
}

let started = false;
/** Checks hourly; the stored `last_at` makes this safe across restarts. */
export function startScheduler() {
  if (started) return;
  started = true;
  const tick = () => runAutoRelease().catch((e) => console.error("[release] failed", e));
  setTimeout(tick, 60_000).unref?.();
  setInterval(tick, 60 * 60_000).unref?.();
}
