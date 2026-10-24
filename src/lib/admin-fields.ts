// Describes what the admin can edit in each table: which fields, in which order,
// and how each is rendered. The server enforces the table/column whitelist; this
// file only drives the forms.
import type { EditableTable } from "./admin.functions";

export type FieldType = "text" | "textarea" | "html" | "bool" | "number" | "tags" | "json" | "image" | "datetime" | "select";

export interface Field {
  key: string;
  label: string;
  type?: FieldType;
  rtl?: boolean;
  options?: string[];
  help?: string;
  /** Show in the "SEO / advanced" collapsible section. */
  advanced?: boolean;
}

export interface TableConfig {
  label: string;
  /** Column used as the row title in the list. */
  title: string;
  /** Extra columns shown in the list (key → heading). */
  columns: Array<[string, string]>;
  fields: Field[];
  /** Default values for "new". */
  defaults?: Record<string, unknown>;
}

const PAGE_TYPES = ["service", "city", "airport", "route_page", "generic"];

export const TABLE_CONFIG: Record<EditableTable, TableConfig> = {
  pages: {
    label: "الصفحات",
    title: "title_ar",
    columns: [["page_type", "النوع"], ["slug", "الرابط"], ["published", "منشورة"], ["seo_released", "فهرسة"]],
    defaults: { page_type: "service", published: true, seo_released: false, sort_order: 100, robots: "index,follow" },
    fields: [
      { key: "page_type", label: "نوع الصفحة", type: "select", options: PAGE_TYPES },
      { key: "slug", label: "الرابط (slug)", help: "حروف إنجليزية صغيرة وشرطات فقط، مثل jeddah-to-makkah" },
      { key: "title_ar", label: "العنوان (عربي)", rtl: true },
      { key: "title_en", label: "العنوان (إنجليزي)" },
      { key: "subtitle_ar", label: "العنوان الفرعي (عربي)", type: "textarea", rtl: true },
      { key: "subtitle_en", label: "العنوان الفرعي (إنجليزي)", type: "textarea" },
      { key: "published", label: "منشورة", type: "bool" },
      { key: "seo_released", label: "السماح لجوجل بفهرستها", type: "bool", help: "إن كانت مغلقة تظهر الصفحة للزوار لكن جوجل لا يفهرسها." },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "body_ar", label: "المحتوى (عربي)", type: "html", rtl: true },
      { key: "body_en", label: "المحتوى (إنجليزي)", type: "html" },
      { key: "hero_image_url", label: "صورة الغلاف (رابط)", type: "image" },
      { key: "featured_image_url", label: "الصورة البارزة (رابط)", type: "image" },
      { key: "meta_title", label: "عنوان جوجل (SEO)", advanced: true },
      { key: "meta_description", label: "وصف جوجل (SEO)", type: "textarea", advanced: true },
      { key: "keywords", label: "الكلمات المفتاحية (مفصولة بفواصل)", type: "tags", advanced: true },
      { key: "canonical_url", label: "الرابط الأساسي (canonical)", advanced: true },
      { key: "robots", label: "robots", advanced: true },
      { key: "schema_type", label: "نوع Schema", advanced: true },
      { key: "og_title", label: "عنوان المشاركة", advanced: true },
      { key: "og_description", label: "وصف المشاركة", type: "textarea", advanced: true },
      { key: "og_image_url", label: "صورة المشاركة (رابط)", type: "image", advanced: true },
      { key: "gallery", label: "معرض الصور (روابط، سطر لكل رابط أو فواصل)", type: "tags", advanced: true },
      { key: "custom_schema", label: "Schema مخصص (JSON)", type: "json", advanced: true },
    ],
  },
  posts: {
    label: "المقالات",
    title: "title_ar",
    columns: [["category", "التصنيف"], ["slug", "الرابط"], ["published", "منشور"], ["seo_released", "فهرسة"]],
    defaults: { published: true, seo_released: true, published_at: new Date().toISOString(), category: "guides", content_format: "html" },
    fields: [
      { key: "slug", label: "الرابط (slug)" },
      { key: "title_ar", label: "العنوان (عربي)", rtl: true },
      { key: "title_en", label: "العنوان (إنجليزي)" },
      { key: "excerpt_ar", label: "الملخص (عربي)", type: "textarea", rtl: true },
      { key: "excerpt_en", label: "الملخص (إنجليزي)", type: "textarea" },
      { key: "category", label: "التصنيف (slug)", help: "مثل guides" },
      { key: "published", label: "منشور", type: "bool" },
      { key: "seo_released", label: "السماح لجوجل بفهرسته", type: "bool" },
      { key: "featured", label: "مقال مميز", type: "bool" },
      { key: "published_at", label: "تاريخ النشر", type: "datetime" },
      { key: "reading_time_min", label: "وقت القراءة (دقائق)", type: "number" },
      { key: "cover_url", label: "صورة الغلاف (رابط)", type: "image" },
      { key: "cover_alt_ar", label: "وصف الصورة (عربي)", rtl: true },
      { key: "cover_alt_en", label: "وصف الصورة (إنجليزي)" },
      { key: "content_ar", label: "المحتوى (عربي)", type: "html", rtl: true },
      { key: "content_en", label: "المحتوى (إنجليزي)", type: "html" },
      { key: "tags", label: "الوسوم (مفصولة بفواصل)", type: "tags", advanced: true },
      { key: "meta_title_ar", label: "عنوان جوجل (عربي)", advanced: true },
      { key: "meta_description_ar", label: "وصف جوجل (عربي)", type: "textarea", advanced: true },
      { key: "meta_title", label: "عنوان جوجل (إنجليزي)", advanced: true },
      { key: "meta_description", label: "وصف جوجل (إنجليزي)", type: "textarea", advanced: true },
      { key: "keywords", label: "الكلمات المفتاحية", type: "tags", advanced: true },
      { key: "primary_keyword_ar", label: "الكلمة الرئيسية (عربي)", advanced: true },
      { key: "primary_keyword_en", label: "الكلمة الرئيسية (إنجليزي)", advanced: true },
      { key: "og_image_url", label: "صورة المشاركة (رابط)", type: "image", advanced: true },
      { key: "canonical_url", label: "الرابط الأساسي (canonical)", advanced: true },
    ],
  },
  faqs: {
    label: "الأسئلة الشائعة",
    title: "question_ar",
    columns: [["category", "التصنيف"], ["published", "منشور"]],
    defaults: { published: true, sort_order: 100 },
    fields: [
      { key: "question_ar", label: "السؤال (عربي)", type: "textarea", rtl: true },
      { key: "answer_ar", label: "الجواب (عربي)", type: "textarea", rtl: true },
      { key: "question_en", label: "السؤال (إنجليزي)", type: "textarea" },
      { key: "answer_en", label: "الجواب (إنجليزي)", type: "textarea" },
      { key: "category", label: "التصنيف" },
      { key: "published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  prices: {
    label: "الأسعار",
    title: "from_ar",
    columns: [["to_ar", "إلى"], ["economy_price", "اقتصادي"], ["suv_price", "دفع رباعي"], ["vip_price", "VIP"], ["category", "القسم"]],
    defaults: { category: "jeddah", sort_order: 100 },
    fields: [
      { key: "code", label: "رمز المسار (فريد)", help: "مثل jed-to-makkah — لا تغيّره للأسعار الموجودة لأن الصفحات تعتمد عليه" },
      { key: "category", label: "القسم", type: "select", options: ["jeddah", "makkah", "madinah", "taif", "dammam", "airport", "intercity"] },
      { key: "from_ar", label: "من (عربي)", rtl: true },
      { key: "from_en", label: "من (إنجليزي)" },
      { key: "to_ar", label: "إلى (عربي)", rtl: true },
      { key: "to_en", label: "إلى (إنجليزي)" },
      { key: "economy_price", label: "سعر الاقتصادي (ريال)", help: "اكتب رقمًا أو «اطلب السعر»" },
      { key: "suv_price", label: "سعر الدفع الرباعي (ريال)" },
      { key: "vip_price", label: "سعر VIP (ريال)" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  fleet: {
    label: "الأسطول",
    title: "name_ar",
    columns: [["code", "الرمز"], ["seats", "المقاعد"], ["is_active", "فعّال"]],
    defaults: { is_active: true, sort_order: 100, seats: 4 },
    fields: [
      { key: "code", label: "الرمز (فريد)" },
      { key: "name_ar", label: "الاسم (عربي)", rtl: true },
      { key: "name_en", label: "الاسم (إنجليزي)" },
      { key: "description_ar", label: "الوصف (عربي)", type: "textarea", rtl: true },
      { key: "description_en", label: "الوصف (إنجليزي)", type: "textarea" },
      { key: "seats", label: "عدد المقاعد", type: "number" },
      { key: "is_active", label: "فعّال", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "featured_image_url", label: "الصورة الرئيسية (رابط)", type: "image" },
      { key: "gallery", label: "معرض الصور (روابط مفصولة بفواصل)", type: "tags" },
      { key: "meta_title", label: "عنوان جوجل", advanced: true },
      { key: "meta_description", label: "وصف جوجل", type: "textarea", advanced: true },
      { key: "base_fare", label: "أجرة الفتح", type: "number", advanced: true },
      { key: "price_per_km", label: "السعر لكل كم", type: "number", advanced: true },
      { key: "price_per_min", label: "السعر لكل دقيقة", type: "number", advanced: true },
    ],
  },
  hero_slides: {
    label: "شرائح الصفحة الرئيسية",
    title: "title_ar",
    columns: [["active", "فعّالة"]],
    defaults: { active: true, sort_order: 100 },
    fields: [
      { key: "title_ar", label: "العنوان (عربي)", rtl: true },
      { key: "title_en", label: "العنوان (إنجليزي)" },
      { key: "subtitle_ar", label: "النص (عربي)", type: "textarea", rtl: true },
      { key: "subtitle_en", label: "النص (إنجليزي)", type: "textarea" },
      { key: "image_url", label: "الصورة (رابط)", type: "image" },
      { key: "cta_label_ar", label: "نص الزر (عربي)", rtl: true },
      { key: "cta_label_en", label: "نص الزر (إنجليزي)" },
      { key: "cta_href", label: "رابط الزر" },
      { key: "active", label: "فعّالة", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  homepage_sections: {
    label: "أقسام الرئيسية",
    title: "title_ar",
    columns: [["section_key", "المفتاح"], ["enabled", "فعّال"]],
    defaults: { enabled: true, sort_order: 100 },
    fields: [
      { key: "section_key", label: "المفتاح (فريد)" },
      { key: "title_ar", label: "العنوان (عربي)", rtl: true },
      { key: "title_en", label: "العنوان (إنجليزي)" },
      { key: "subtitle_ar", label: "النص (عربي)", type: "textarea", rtl: true },
      { key: "subtitle_en", label: "النص (إنجليزي)", type: "textarea" },
      { key: "enabled", label: "فعّال", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "config", label: "إعدادات (JSON)", type: "json", advanced: true },
    ],
  },
  testimonials: {
    label: "آراء العملاء",
    title: "name",
    columns: [["rating", "التقييم"], ["published", "منشور"]],
    defaults: { published: true, rating: 5, sort_order: 100 },
    fields: [
      { key: "name", label: "الاسم" },
      { key: "role_ar", label: "الصفة (عربي)", rtl: true },
      { key: "role_en", label: "الصفة (إنجليزي)" },
      { key: "quote_ar", label: "الرأي (عربي)", type: "textarea", rtl: true },
      { key: "quote_en", label: "الرأي (إنجليزي)", type: "textarea" },
      { key: "rating", label: "التقييم (1-5)", type: "number" },
      { key: "published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  blog_categories: {
    label: "تصنيفات المدونة",
    title: "name_ar",
    columns: [["slug", "الرابط"]],
    defaults: { sort_order: 100 },
    fields: [
      { key: "slug", label: "الرابط (slug)" },
      { key: "name_ar", label: "الاسم (عربي)", rtl: true },
      { key: "name_en", label: "الاسم (إنجليزي)" },
      { key: "description_ar", label: "الوصف (عربي)", type: "textarea", rtl: true },
      { key: "description_en", label: "الوصف (إنجليزي)", type: "textarea" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  redirects: {
    label: "التحويلات",
    title: "source_path",
    columns: [["destination_path", "إلى"], ["status_code", "الكود"], ["is_active", "فعّال"]],
    defaults: { status_code: 301, is_active: true },
    fields: [
      { key: "source_path", label: "من (مسار بدون لغة)", help: "مثل /old-page" },
      { key: "destination_path", label: "إلى", help: "مثل /ar/services/umrah-taxi" },
      { key: "status_code", label: "الكود", type: "select", options: ["301", "302"] },
      { key: "is_active", label: "فعّال", type: "bool" },
    ],
  },
};
