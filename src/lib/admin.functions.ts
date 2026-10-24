// Server functions for the admin panel. Every function except login/me checks
// the session cookie first, and table/column names are whitelisted.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const EDITABLE_TABLES = [
  "pages", "posts", "faqs", "hero_slides", "fleet", "prices", "testimonials", "redirects",
  "blog_categories", "homepage_sections",
] as const;
export type EditableTable = (typeof EDITABLE_TABLES)[number];

export const SETTING_KEYS = [
  "contact_phone", "whatsapp_number", "whatsapp_default_message",
  "google_site_verification", "bing_site_verification", "head_meta_custom", "head_scripts_custom",
  "commercial_registration", "transport_license",
] as const;

// Big tables list only the columns needed for the overview.
const LIST_COLS: Partial<Record<EditableTable, string[]>> = {
  pages: ["slug", "page_type", "title_ar", "title_en", "published", "seo_released", "sort_order"],
  posts: ["slug", "title_ar", "title_en", "published", "seo_released", "published_at", "category"],
  faqs: ["question_ar", "question_en", "category", "published", "sort_order"],
};

const table = z.enum(EDITABLE_TABLES);

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data }) => {
    const { one } = await import("@/server/db.server");
    const a = await import("@/server/auth.server");
    a.assertLoginAllowed();
    const user = await one("admin_users", { email: data.email.toLowerCase() });
    // Always run a hash so a missing user takes as long as a wrong password.
    const ok = a.verifyPassword(data.password, user?.password_hash ?? "scrypt$00$00") && !!user;
    if (!ok) {
      a.noteLoginFailure();
      throw new Error("Wrong email or password");
    }
    a.clearLoginFailures();
    await a.startSession(user!.id);
    return { email: user!.email as string };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const a = await import("@/server/auth.server");
  await a.endSession();
  return { ok: true };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const a = await import("@/server/auth.server");
  return a.currentAdmin();
});

export const adminChangePassword = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ current: z.string().min(1), next: z.string().min(10).max(200) }).parse(i))
  .handler(async ({ data }) => {
    const a = await import("@/server/auth.server");
    const { one, update } = await import("@/server/db.server");
    const admin = await a.requireAdmin();
    const user = await one("admin_users", { id: admin.id });
    if (!user || !a.verifyPassword(data.current, user.password_hash)) throw new Error("Current password is wrong");
    await update("admin_users", admin.id, { password_hash: a.hashPassword(data.next) });
    return { ok: true };
  });

export const adminList = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ table }).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { select } = await import("@/server/db.server");
    await requireAdmin();
    const cols = LIST_COLS[data.table];
    const rows = await select(data.table, { columns: cols ? ["id", ...cols] : undefined, orderBy: [["id", "asc"]] });
    return rows;
  });

export const adminGet = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ table, id: z.number().int() }).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { one } = await import("@/server/db.server");
    await requireAdmin();
    return one(data.table, { id: data.id });
  });

export const adminSave = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ table, id: z.number().int().optional(), values: z.record(z.any()) }).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { insert, update } = await import("@/server/db.server");
    await requireAdmin();
    try {
      let id = data.id;
      if (id) await update(data.table, id, data.values);
      else id = await insert(data.table, data.values);
      // A published, released page or article that was just saved: tell Bing/Yandex (IndexNow).
      if (data.table === "pages" || data.table === "posts") {
        const { one } = await import("@/server/db.server");
        const row = await one(data.table, { id: id! });
        if (row?.published && row?.seo_released) {
          const rel = await import("@/server/release.server");
          void rel.pingIndexNow(rel.urlsForRow(data.table, row as any));
        }
      }
      return { id: id! };
    } catch (e: any) {
      if (e?.code === "ER_DUP_ENTRY") throw new Error("This address/code is already used by another item");
      throw e;
    }
  });

export const adminDelete = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ table, id: z.number().int() }).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { remove } = await import("@/server/db.server");
    await requireAdmin();
    await remove(data.table, data.id);
    return { ok: true };
  });

export const adminGetSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/server/auth.server");
  const { getSettings } = await import("@/server/db.server");
  await requireAdmin();
  return getSettings([...SETTING_KEYS]);
});

export const adminSaveSettings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.record(z.string().max(20000)).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { setSetting } = await import("@/server/db.server");
    await requireAdmin();
    for (const [k, v] of Object.entries(data)) {
      if ((SETTING_KEYS as readonly string[]).includes(k)) await setSetting(k, v);
    }
    return { ok: true };
  });

export const adminListMessages = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/server/auth.server");
  const { select } = await import("@/server/db.server");
  await requireAdmin();
  return select("messages", { orderBy: [["id", "desc"]], limit: 300 });
});

export const adminMessageAction = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.number().int(), action: z.enum(["read", "unread", "delete"]) }).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { update, remove } = await import("@/server/db.server");
    await requireAdmin();
    if (data.action === "delete") await remove("messages", data.id);
    else await update("messages", data.id, { is_read: data.action === "read" });
    return { ok: true };
  });

// ---- automatic release ----
export const adminReleaseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/server/auth.server");
  const rel = await import("@/server/release.server");
  const { select } = await import("@/server/db.server");
  await requireAdmin();
  const settings = await rel.releaseSettings();
  const queue = await rel.buildQueue();
  const recent = await Promise.all(
    (["pages", "posts"] as const).map((t) =>
      select(t, { where: { seo_released: true }, columns: ["id", "slug", "title_ar", "released_at"], orderBy: [["released_at", "desc"]], limit: 8 }).then((rows) => rows.map((r) => ({ ...r, table: t }))),
    ),
  );
  const nextAt = settings.lastAt ? new Date(new Date(settings.lastAt).getTime() + settings.everyDays * 86_400_000).toISOString() : null;
  return {
    settings: { ...settings, nextAt },
    queue: queue.map(({ urls: _u, ...q }) => q),
    recent: recent.flat().sort((a, b) => String(b.released_at ?? "").localeCompare(String(a.released_at ?? ""))).slice(0, 10),
    releasedCount: { pages: await (await import("@/server/db.server")).count("pages", { seo_released: true }), posts: await (await import("@/server/db.server")).count("posts", { seo_released: true }) },
  };
});

export const adminReleaseSaveSettings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ enabled: z.boolean(), everyDays: z.number().int().min(1).max(30), batch: z.number().int().min(1).max(10) }).parse(i))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth.server");
    const { setSetting } = await import("@/server/db.server");
    await requireAdmin();
    await setSetting("auto_release_enabled", data.enabled ? "1" : "0");
    await setSetting("auto_release_every_days", String(data.everyDays));
    await setSetting("auto_release_batch", String(data.batch));
    return { ok: true };
  });

export const adminReleaseRunNow = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("@/server/auth.server");
  const rel = await import("@/server/release.server");
  await requireAdmin();
  const r = await rel.runAutoRelease({ force: true });
  return {
    released: r.released.map((i) => ({ slug: i.slug, title: i.title, urls: i.urls })),
    skipped: r.skipped.slice(0, 10).map((i) => ({ slug: i.slug, title: i.title, problems: i.problems })),
    reason: r.reason,
  };
});
