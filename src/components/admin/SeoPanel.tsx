import { useMemo } from "react";
import type { FormState } from "./FieldInput";

type Check = { ok: boolean; label: string; hint?: string };

/** Counts words, headings, images and internal links in an HTML fragment (admin runs in the browser). */
function analyse(html: string) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  const imgs = Array.from(doc.querySelectorAll("img"));
  const links = Array.from(doc.querySelectorAll("a[href]")).map((a) => a.getAttribute("href") ?? "");
  return {
    words: text ? text.split(" ").length : 0,
    h1: doc.querySelectorAll("h1").length,
    h2: doc.querySelectorAll("h2").length,
    imgsNoAlt: imgs.filter((i) => !(i.getAttribute("alt") ?? "").trim()).length,
    internal: links.filter((h) => h.startsWith("/") || h.includes("taxi-omra.com")).length,
  };
}

const range = (n: number, min: number, max: number) => n >= min && n <= max;

function langChecks(form: FormState, lang: "ar" | "en", isPost: boolean): Check[] {
  const L = lang === "ar" ? "عربي" : "إنجليزي";
  const titleKey = isPost ? (lang === "ar" ? "meta_title_ar" : "meta_title") : "meta_title";
  const descKey = isPost ? (lang === "ar" ? "meta_description_ar" : "meta_description") : "meta_description";
  const title = String(form[titleKey] || form[`title_${lang}`] || "");
  const desc = String(form[descKey] || (isPost ? form[`excerpt_${lang}`] : form[`subtitle_${lang}`]) || "");
  const a = analyse(String(form[isPost ? `content_${lang}` : `body_${lang}`] ?? ""));
  const minWords = isPost ? 350 : 150;
  return [
    { ok: range(title.length, 30, 60), label: `عنوان جوجل (${L}): ${title.length} حرفًا`, hint: "المثالي بين 30 و60 حرفًا" },
    { ok: range(desc.length, 120, 160), label: `وصف جوجل (${L}): ${desc.length} حرفًا`, hint: "المثالي بين 120 و160 حرفًا" },
    { ok: a.words >= minWords, label: `طول المحتوى (${L}): ${a.words} كلمة`, hint: `الأفضل ${minWords} كلمة فأكثر` },
    { ok: a.h1 === 0, label: `لا عنوان H1 داخل المحتوى (${L})`, hint: "العنوان الرئيسي هو عنوان المقال، استخدم H2 وH3 داخل النص" },
    { ok: a.h2 >= 2, label: `عناوين فرعية H2 (${L}): ${a.h2}`, hint: "استخدم عنوانين فرعيين على الأقل" },
    { ok: a.imgsNoAlt === 0, label: `صور بدون وصف alt (${L}): ${a.imgsNoAlt}`, hint: "أضف وصفًا لكل صورة" },
    { ok: a.internal >= 2, label: `روابط داخلية (${L}): ${a.internal}`, hint: "اربط بصفحة خدمة أو سعر أو مقال آخر (رابطان على الأقل)" },
  ];
}

export function SeoPanel({ table, form }: { table: "posts" | "pages"; form: FormState }) {
  const isPost = table === "posts";
  const checks = useMemo<Check[]>(() => {
    const slug = String(form.slug ?? "");
    const base: Check[] = [
      { ok: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 75, label: `الرابط: ${slug || "(فارغ)"}`, hint: "حروف إنجليزية صغيرة وأرقام وشرطات، وبحد أقصى 75 حرفًا" },
      { ok: Boolean(form.published), label: "منشور" },
      { ok: Boolean(form.seo_released), label: "مسموح لجوجل بفهرسته", hint: "فعّل «السماح لجوجل بفهرسته» لتدخل الصفحة في خريطة الموقع" },
    ];
    if (isPost) {
      const cover = String(form.cover_url ?? "");
      base.push({ ok: /^https?:\/\//.test(cover), label: "صورة غلاف برابط كامل", hint: "بدون صورة تُستخدم صورة افتراضية مشتركة. ضع رابط صورة خاصة بالمقال (https://...)" });
    }
    return [...base, ...langChecks(form, "ar", isPost), ...langChecks(form, "en", isPost)];
  }, [form, isPost]);

  const passed = checks.filter((c) => c.ok).length;
  const pct = Math.round((passed / checks.length) * 100);
  return (
    <section className="rounded-xl border bg-background p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">فحص السيو المباشر</h2>
        <span className={`rounded-full px-3 py-1 text-sm ${pct >= 85 ? "bg-green-100 text-green-800" : pct >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{pct}% ({passed}/{checks.length})</span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {checks.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className={c.ok ? "text-green-600" : "text-amber-600"}>{c.ok ? "✓" : "⚠"}</span>
            <span>{c.label}{!c.ok && c.hint ? <span className="text-muted-foreground"> — {c.hint}</span> : null}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
