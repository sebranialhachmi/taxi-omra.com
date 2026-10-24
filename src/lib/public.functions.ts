// Public read-only data + public write (contact form) via server publishable Supabase client.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function serverPublic() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listCmsPages = createServerFn({ method: "GET" })
  .inputValidator((input: { type?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const sb = serverPublic();
    let q = sb.from("cms_pages").select("*").eq("published", true).order("sort_order");
    if (data.type) q = q.eq("page_type", data.type as any);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getCmsPage = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: row } = await sb.from("cms_pages").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    return row;
  });

export const getCmsPageByType = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; type: string }) => input)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: row } = await sb
      .from("cms_pages")
      .select("*")
      .eq("slug", data.slug)
      .eq("page_type", data.type as any)
      .eq("published", true)
      .maybeSingle();
    return row;
  });

export const listRelatedCmsPages = createServerFn({ method: "GET" })
  .inputValidator((input: { type: string; excludeSlug?: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    let q = sb
      .from("cms_pages")
      .select("slug,title_ar,title_en,subtitle_ar,subtitle_en,hero_image_url,page_type")
      .eq("page_type", data.type as any)
      .eq("published", true)
      .order("sort_order")
      .limit(data.limit ?? 6);
    if (data.excludeSlug) q = q.neq("slug", data.excludeSlug);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const getVehicleCategoryByCode = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: row } = await sb
      .from("vehicle_categories")
      .select("*, vehicle_category_translations(*)")
      .eq("code", data.code)
      .eq("is_active", true)
      .maybeSingle();
    return row;
  });

export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("blog_posts")
    .select("id,slug,title_ar,title_en,excerpt_ar,excerpt_en,cover_url,tags,published_at,reading_time_min,featured,category_id")
    .eq("published", true)
    .order("published_at", { ascending: false });
  return data ?? [];
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: row } = await sb.from("blog_posts").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    return row;
  });

export const listFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb.from("faqs").select("*").eq("published", true).order("sort_order");
  return data ?? [];
});

export const listTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb.from("testimonials").select("*").eq("published", true).order("sort_order");
  return data ?? [];
});

export const listVehicleCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("vehicle_categories")
    .select("*, vehicle_category_translations(*)")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
});

export const listHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb.from("hero_slides").select("*").eq("active", true).order("sort_order");
  return data ?? [];
});

export const listHomepageSections = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb.from("homepage_sections").select("*").eq("enabled", true).order("sort_order");
  return data ?? [];
});

export const listPromotions = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("promotions").select("*").eq("active", true).order("sort_order");
  return data ?? [];
});

export const listPartners = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb.from("partners").select("*").eq("active", true).order("sort_order");
  return data ?? [];
});

// Active site-wide announcement banners (extends coupons: rows with is_announcement=true).
// Public row-level policy already restricts to active + within date window.
export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("coupons")
    .select("id,code,title_ar,title_en,description_ar,description_en,cta_text_ar,cta_text_en,cta_url,bg_color,text_color,icon,priority,target_pages,show_once,dismissible,valid_until")
    .eq("is_announcement", true)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(5);
  return data ?? [];
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(4000),
  page_url: z.string().trim().max(400).optional().or(z.literal("")),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { error } = await sb.from("contact_submissions").insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      page_url: data.page_url || null,
      source: "contact_form",
    });
    if (error) throw error;
    return { ok: true };
  });

// -------- Public booking request --------
// Persisted to `contact_submissions` with source="booking_form" so it flows
// into the same admin inbox — no new tables/RLS needed. The full structured
// booking payload is preserved in a JSON block appended to the message body.
const bookingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(4).max(40),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  pickup: z.string().trim().min(2).max(300),
  dropoff: z.string().trim().min(2).max(300),
  pickup_at: z.string().trim().max(64).optional().or(z.literal("")),
  passengers: z.coerce.number().int().min(1).max(60).optional(),
  luggage: z.coerce.number().int().min(0).max(60).optional(),
  vehicle: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  page_url: z.string().trim().max(400).optional().or(z.literal("")),
  locale: z.enum(["en", "ar"]).optional(),
});

export const submitBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const summary = [
      `Pickup: ${data.pickup}`,
      `Dropoff: ${data.dropoff}`,
      data.pickup_at ? `When: ${data.pickup_at}` : null,
      data.passengers ? `Passengers: ${data.passengers}` : null,
      data.luggage != null ? `Luggage: ${data.luggage}` : null,
      data.vehicle ? `Vehicle: ${data.vehicle}` : null,
      data.notes ? `Notes: ${data.notes}` : null,
    ].filter(Boolean).join("\n");
    const message = `${summary}\n\n[booking_payload]${JSON.stringify(data)}[/booking_payload]`;
    const { error } = await sb.from("contact_submissions").insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      subject: `Booking request: ${data.pickup} → ${data.dropoff}`,
      message,
      page_url: data.page_url || null,
      source: "booking_form",
    });
    if (error) throw error;
    return { ok: true };
  });
