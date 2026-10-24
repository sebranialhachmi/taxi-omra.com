// Public read-only content + the contact/booking forms, backed by MySQL.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { select, one, insert, getSettings } from "@/server/db.server";

// Row shape the old Supabase-based routes expect for fleet categories.
function toCategory(r: any): any {
  const { name_ar, name_en, description_ar, description_en, ...rest } = r;
  return {
    ...rest,
    vehicle_category_translations: [
      { locale: "ar", name: name_ar, description: description_ar },
      { locale: "en", name: name_en, description: description_en },
    ],
  };
}

// Lists never need the long article bodies; leaving them out keeps the
// server-rendered HTML of the home page and index pages small.
const LIST_COLUMNS = [
  "id", "slug", "page_type", "title_ar", "title_en", "subtitle_ar", "subtitle_en", "hero_image_url",
  "og_image_url", "featured_image_url", "meta_title", "meta_description", "published", "sort_order",
  "seo_released", "updated_at",
];

export const listCmsPages = createServerFn({ method: "GET" })
  .inputValidator((input: { type?: string } | undefined) => input ?? {})
  .handler(async ({ data }) =>
    select("pages", {
      where: { published: true, ...(data.type ? { page_type: data.type } : {}) },
      orderBy: [["sort_order", "asc"]],
      columns: LIST_COLUMNS,
    }),
  );

export const getCmsPage = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => one("pages", { slug: data.slug, published: true }));

export const getCmsPageByType = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; type: string }) => input)
  .handler(async ({ data }) => one("pages", { slug: data.slug, page_type: data.type, published: true }));

export const listRelatedCmsPages = createServerFn({ method: "GET" })
  .inputValidator((input: { type: string; excludeSlug?: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    const rows = await select("pages", {
      where: { page_type: data.type, published: true },
      orderBy: [["sort_order", "asc"]],
      columns: ["slug", "title_ar", "title_en", "subtitle_ar", "subtitle_en", "hero_image_url", "page_type"],
    });
    return rows.filter((r) => r.slug !== data.excludeSlug).slice(0, data.limit ?? 6);
  });

export const getVehicleCategoryByCode = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const row = await one("fleet", { code: data.code, is_active: true });
    return row ? toCategory(row) : null;
  });

export const listVehicleCategories = createServerFn({ method: "GET" }).handler(async () =>
  (await select("fleet", { where: { is_active: true }, orderBy: [["sort_order", "asc"]] })).map(toCategory),
);

export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await select("posts", {
    where: { published: true },
    orderBy: [["published_at", "desc"]],
    columns: ["id", "slug", "title_ar", "title_en", "excerpt_ar", "excerpt_en", "cover_url", "tags", "published_at", "reading_time_min", "featured", "category"],
  });
  return rows.map((r) => ({ ...r, category_id: r.category }));
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => one("posts", { slug: data.slug, published: true }));

export const listFaqs = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) =>
    select("faqs", { where: { published: true }, orderBy: [["sort_order", "asc"]], limit: data.limit }),
  );

export const listTestimonials = createServerFn({ method: "GET" }).handler(async () =>
  select("testimonials", { where: { published: true }, orderBy: [["sort_order", "asc"]] }),
);

export const listHeroSlides = createServerFn({ method: "GET" }).handler(async () =>
  select("hero_slides", { where: { active: true }, orderBy: [["sort_order", "asc"]] }),
);

export const listHomepageSections = createServerFn({ method: "GET" }).handler(async () =>
  select("homepage_sections", { where: { enabled: true }, orderBy: [["sort_order", "asc"]] }),
);

// The announcement bar, promotions and partners were part of the old admin and
// are not stored any more; the functions stay so existing components compile.
export const listPromotions = createServerFn({ method: "GET" }).handler(async () => [] as any[]);
export const listPartners = createServerFn({ method: "GET" }).handler(async () => [] as any[]);
export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => [] as any[]);

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
    await insert("messages", {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      page_url: data.page_url || null,
      source: "contact_form",
    });
    return { ok: true };
  });

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

// Booking requests land in the same inbox as contact messages.
export const submitBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const message = [
      `Pickup: ${data.pickup}`,
      `Dropoff: ${data.dropoff}`,
      data.pickup_at ? `When: ${data.pickup_at}` : null,
      data.passengers ? `Passengers: ${data.passengers}` : null,
      data.luggage != null ? `Luggage: ${data.luggage}` : null,
      data.vehicle ? `Vehicle: ${data.vehicle}` : null,
      data.notes ? `Notes: ${data.notes}` : null,
    ].filter(Boolean).join("\n");
    await insert("messages", {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      subject: `Booking request: ${data.pickup} → ${data.dropoff}`,
      message,
      page_url: data.page_url || null,
      source: "booking_form",
    });
    return { ok: true };
  });

// Phone/WhatsApp shown in the header, footer and floating buttons, plus the
// scripts/meta the owner pasted into the admin settings page.
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const s = await getSettings([
    "contact_phone", "whatsapp_number", "whatsapp_default_message",
    "google_site_verification", "bing_site_verification", "head_meta_custom", "head_scripts_custom",
  ]);
  const text = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : "");
  return {
    contact_phone: text("contact_phone"),
    whatsapp_number: text("whatsapp_number"),
    whatsapp_default_message: text("whatsapp_default_message"),
    google_site_verification: text("google_site_verification"),
    bing_site_verification: text("bing_site_verification"),
    head_meta_custom: text("head_meta_custom"),
    head_scripts_custom: text("head_scripts_custom"),
  };
});

export const resolveRedirect = createServerFn({ method: "GET" })
  .inputValidator((input: { path: string }) => ({ path: String(input.path).slice(0, 512) }))
  .handler(async ({ data }) => {
    const row = await one("redirects", { source_path: data.path, is_active: true });
    return row ? { destination_path: row.destination_path as string, status_code: (row.status_code as number) ?? 301 } : null;
  });

// Titles for the HTML sitemap page.
export const getSitemapData = createServerFn({ method: "GET" }).handler(async () => {
  const [pages, posts, cats] = await Promise.all([
    select("pages", { where: { published: true }, orderBy: [["sort_order", "asc"]], columns: ["slug", "page_type", "title_en", "title_ar"] }),
    select("posts", { where: { published: true }, orderBy: [["published_at", "desc"]], columns: ["slug", "title_en", "title_ar"] }),
    select("fleet", { where: { is_active: true }, orderBy: [["sort_order", "asc"]], columns: ["code", "name_en", "name_ar"] }),
  ]);
  return { pages, posts, cats };
});
