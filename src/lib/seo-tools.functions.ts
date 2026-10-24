// Phase D — SEO Engine server functions.
// Audit tools, redirect resolver, programmatic page generation, internal linking, related content.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SITE } from "@/lib/site-info";

function sbPublic() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function isValidSlug(s: string) {
  return typeof s === "string" && s.length >= 2 && s.length <= 96 && SLUG_RE.test(s);
}

// ----- Redirect resolver (used by public layout) -----
export const resolveRedirect = createServerFn({ method: "GET" })
  .inputValidator((input: { path: string }) => ({ path: String(input.path).slice(0, 512) }))
  .handler(async ({ data }) => {
    const sb = sbPublic();
    const { data: row } = await sb
      .from("seo_redirects")
      .select("destination_path,status_code,active")
      .eq("source_path", data.path)
      .eq("active", true)
      .maybeSingle();
    return row ?? null;
  });

// ----- SEO audit -----
export const runSeoAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: pages } = await supabase
      .from("cms_pages")
      .select("id,slug,page_type,title_en,title_ar,meta_title,meta_description,og_image_url,canonical_url,schema_type,published,status")
      .is("deleted_at", null);
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id,slug,title_en,title_ar,meta_title,meta_description,og_image_url,published");

    type Row = { entity: "cms_page" | "blog_post"; id: string; slug: string; label: string };
    const missingTitle: Row[] = [];
    const missingDescription: Row[] = [];
    const shortDescription: Row[] = [];
    const longTitle: Row[] = [];
    const missingImage: Row[] = [];
    const invalidSlug: Row[] = [];
    const duplicateTitles: { title: string; rows: Row[] }[] = [];
    const duplicateDescriptions: { description: string; rows: Row[] }[] = [];

    const titleMap = new Map<string, Row[]>();
    const descMap = new Map<string, Row[]>();

    const consider = (r: Row, title: string | null | undefined, desc: string | null | undefined, image: string | null | undefined, slug: string) => {
      const t = (title ?? "").trim();
      const d = (desc ?? "").trim();
      if (!t) missingTitle.push(r);
      else if (t.length > 70) longTitle.push(r);
      if (!d) missingDescription.push(r);
      else if (d.length < 60) shortDescription.push(r);
      if (!image) missingImage.push(r);
      if (!isValidSlug(slug)) invalidSlug.push(r);
      if (t) { const k = t.toLowerCase(); titleMap.set(k, [...(titleMap.get(k) ?? []), r]); }
      if (d) { const k = d.toLowerCase(); descMap.set(k, [...(descMap.get(k) ?? []), r]); }
    };

    for (const p of pages ?? []) {
      const r: Row = { entity: "cms_page", id: p.id, slug: p.slug, label: `${p.page_type}: ${p.title_en || p.slug}` };
      consider(r, p.meta_title || p.title_en, p.meta_description, p.og_image_url, p.slug);
    }
    for (const p of posts ?? []) {
      const r: Row = { entity: "blog_post", id: p.id, slug: p.slug, label: `blog: ${p.title_en || p.slug}` };
      consider(r, p.meta_title || p.title_en, p.meta_description, p.og_image_url, p.slug);
    }
    for (const [k, rows] of titleMap) if (rows.length > 1) duplicateTitles.push({ title: k, rows });
    for (const [k, rows] of descMap) if (rows.length > 1) duplicateDescriptions.push({ description: k, rows });

    // Broken internal link detection: scan body_en/body_ar for internal links (/en/… /ar/… or /path)
    // and verify targets exist in cms_pages/blog_posts.
    const { data: bodies } = await supabase.from("cms_pages").select("id,slug,body_en,body_ar").is("deleted_at", null);
    const knownPaths = new Set<string>();
    for (const p of pages ?? []) {
      const prefix =
        p.page_type === "service" ? "services" :
        p.page_type === "city" ? "cities" :
        p.page_type === "airport" ? "airports" :
        p.page_type === "route_page" ? "routes" : "p";
      knownPaths.add(`/${prefix}/${p.slug}`);
    }
    for (const p of posts ?? []) knownPaths.add(`/blog/${p.slug}`);
    const brokenLinks: { pageSlug: string; href: string }[] = [];
    const HREF_RE = /href=["'](\/(?:en|ar)?\/?[^"'#?]+)["']/g;
    for (const b of bodies ?? []) {
      const text = `${b.body_en ?? ""} ${b.body_ar ?? ""}`;
      let m: RegExpExecArray | null;
      while ((m = HREF_RE.exec(text))) {
        const href = m[1].replace(/^\/(en|ar)/, "");
        if (!href.startsWith("/")) continue;
        if (/\.(png|jpg|jpeg|svg|webp|pdf|xml|ico)$/i.test(href)) continue;
        if (["/", "/about", "/services", "/fleet", "/blog", "/contact", "/pricing", "/faq", "/airport-transfers", "/privacy", "/terms", "/refund", "/cancellation"].includes(href)) continue;
        if (!knownPaths.has(href)) brokenLinks.push({ pageSlug: b.slug, href });
      }
    }

    return {
      counts: {
        pages: pages?.length ?? 0,
        posts: posts?.length ?? 0,
        missingTitle: missingTitle.length,
        missingDescription: missingDescription.length,
        shortDescription: shortDescription.length,
        longTitle: longTitle.length,
        missingImage: missingImage.length,
        invalidSlug: invalidSlug.length,
        duplicateTitles: duplicateTitles.length,
        duplicateDescriptions: duplicateDescriptions.length,
        brokenLinks: brokenLinks.length,
      },
      missingTitle, missingDescription, shortDescription, longTitle,
      missingImage, invalidSlug, duplicateTitles, duplicateDescriptions, brokenLinks,
    };
  });

// ----- Programmatic SEO page generation -----
const GenSchema = z.object({
  type: z.enum(["city", "airport", "service", "route_page", "vehicle"]),
  slug: z.string().min(2).max(96),
  title_en: z.string().min(3).max(140),
  title_ar: z.string().min(3).max(140),
  subtitle_en: z.string().max(280).optional().nullable(),
  subtitle_ar: z.string().max(280).optional().nullable(),
  body_en: z.string().optional().nullable(),
  body_ar: z.string().optional().nullable(),
  featured_image_url: z.string().url().optional().nullable(),
  keywords: z.array(z.string()).max(20).optional().nullable(),
});

export const generateSeoPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (!isValidSlug(data.slug)) throw new Error("Invalid slug format");

    const prefix =
      data.type === "service" ? "services" :
      data.type === "city" ? "cities" :
      data.type === "airport" ? "airports" :
      data.type === "route_page" ? "routes" : "fleet";
    const url = `/${prefix}/${data.slug}`;

    if (data.type === "vehicle") {
      // Programmatic vehicles land as service-type CMS pages with a Vehicle schema.
      // Real fleet edits go through admin/fleet — this only creates a landing page.
    }

    const cmsType =
      data.type === "vehicle" ? "service" :
      (data.type as "service" | "city" | "airport" | "route_page");

    const schemaType =
      data.type === "service" ? "Service" :
      data.type === "city" ? "Place" :
      data.type === "airport" ? "Airport" :
      data.type === "route_page" ? "Service" :
      "Vehicle";

    const meta_title = `${data.title_en} | ${SITE.brand.en}`.slice(0, 70);
    const meta_description = (data.subtitle_en || `Book premium ${data.title_en.toLowerCase()} in Jeddah with ${SITE.brand.en}. 24/7 chauffeur service, professional drivers, luxury fleet.`).slice(0, 160);

    const payload = {
      slug: data.slug,
      page_type: cmsType,
      title_en: data.title_en,
      title_ar: data.title_ar,
      subtitle_en: data.subtitle_en ?? null,
      subtitle_ar: data.subtitle_ar ?? null,
      body_en: data.body_en ?? null,
      body_ar: data.body_ar ?? null,
      meta_title,
      meta_description,
      og_title: data.title_en,
      og_description: meta_description,
      og_image_url: data.featured_image_url ?? null,
      twitter_card: "summary_large_image",
      canonical_url: url,
      robots: "index,follow",
      schema_type: schemaType,
      keywords: data.keywords ?? null,
      featured_image_url: data.featured_image_url ?? null,
      status: "draft",
      published: false,
      sort_order: 0,
    };

    const { data: row, error } = await supabase
      .from("cms_pages")
      .upsert(payload as any, { onConflict: "slug" })
      .select("id,slug,page_type")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id, slug: row.slug, url };
  });

// ----- Bulk programmatic generation (combinations) -----
const BulkSchema = z.object({
  combinations: z.array(z.object({
    type: z.enum(["city", "airport", "service", "route_page", "vehicle"]),
    slug: z.string(),
    title_en: z.string(),
    title_ar: z.string(),
    subtitle_en: z.string().optional().nullable(),
    subtitle_ar: z.string().optional().nullable(),
  })).max(200),
});
export const bulkGenerateSeoPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BulkSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let created = 0; let skipped = 0; const errors: string[] = [];
    for (const c of data.combinations) {
      if (!isValidSlug(c.slug)) { skipped++; errors.push(`invalid slug: ${c.slug}`); continue; }
      const prefix =
        c.type === "service" ? "services" :
        c.type === "city" ? "cities" :
        c.type === "airport" ? "airports" :
        c.type === "route_page" ? "routes" : "fleet";
      const cmsType = c.type === "vehicle" ? "service" : c.type;
      const schemaType =
        c.type === "service" ? "Service" :
        c.type === "city" ? "Place" :
        c.type === "airport" ? "Airport" :
        c.type === "route_page" ? "Service" : "Vehicle";
      const meta_title = `${c.title_en} | ${SITE.brand.en}`.slice(0, 70);
      const meta_description = (c.subtitle_en || `Premium ${c.title_en.toLowerCase()} with ${SITE.brand.en} — luxury chauffeur service in Jeddah.`).slice(0, 160);
      const { error } = await supabase.from("cms_pages").upsert({
        slug: c.slug,
        page_type: cmsType as any,
        title_en: c.title_en, title_ar: c.title_ar,
        subtitle_en: c.subtitle_en ?? null, subtitle_ar: c.subtitle_ar ?? null,
        meta_title, meta_description,
        og_title: c.title_en, og_description: meta_description,
        twitter_card: "summary_large_image",
        canonical_url: `/${prefix}/${c.slug}`,
        robots: "index,follow", schema_type: schemaType,
        status: "draft", published: false,
      } as any, { onConflict: "slug" });
      if (error) { skipped++; errors.push(`${c.slug}: ${error.message}`); }
      else created++;
    }
    return { created, skipped, errors };
  });

// ----- Internal linking / related content (public) -----
export const getInternalLinks = createServerFn({ method: "GET" })
  .inputValidator((input: { type?: string; limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const sb = sbPublic();
    let q = sb.from("cms_pages")
      .select("slug,page_type,title_en,title_ar")
      .eq("published", true)
      .order("sort_order")
      .limit(Math.min(data.limit ?? 12, 40));
    if (data.type) q = q.eq("page_type", data.type as any);
    const { data: rows } = await q;
    return rows ?? [];
  });
