// Programmatic SEO Generator — bulk-create landing pages for cities/airports/routes/services/vehicles.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bulkGenerateSeoPages, generateSeoPage } from "@/lib/seo-tools.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/seo-generator")({
  component: SeoGenerator,
});

type EntityType = "city" | "airport" | "service" | "route_page" | "vehicle";

function typeLabel(t: EntityType, ar: boolean) {
  const map: Record<EntityType, [string, string]> = {
    service: ["Service", "خدمة"],
    city: ["City", "مدينة"],
    airport: ["Airport", "مطار"],
    route_page: ["Route", "مسار"],
    vehicle: ["Vehicle", "مركبة"],
  };
  return ar ? map[t][1] : map[t][0];
}

function SeoGenerator() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{ar ? "مولد صفحات السيو" : "Programmatic SEO Generator"}</h1>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "توليد تلقائي لصفحات هبوط ثنائية اللغة مع بيانات SEO، Canonical، OpenGraph، Twitter Cards، وSchema.org — للمدن والمطارات والمسارات والخدمات والمركبات."
            : "Auto-generate bilingual landing pages with SEO metadata, canonicals, OpenGraph, Twitter Cards, and Schema.org — for Cities, Airports, Routes, Services, and Vehicles."}
        </p>
      </div>
      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single"><Sparkles className="mr-2 h-4 w-4" />{ar ? "صفحة واحدة" : "Single page"}</TabsTrigger>
          <TabsTrigger value="bulk"><Layers className="mr-2 h-4 w-4" />{ar ? "توليد مجمّع" : "Bulk / Combinations"}</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4"><SingleForm ar={ar} /></TabsContent>
        <TabsContent value="bulk" className="mt-4"><BulkForm ar={ar} /></TabsContent>
      </Tabs>
    </div>
  );
}

function SingleForm({ ar }: { ar: boolean }) {
  const gen = useServerFn(generateSeoPage);
  const [form, setForm] = useState({
    type: "service" as EntityType,
    slug: "",
    title_en: "",
    title_ar: "",
    subtitle_en: "",
    subtitle_ar: "",
    keywords: "",
    featured_image_url: "",
  });
  const [busy, setBusy] = useState(false);

  const slugify = (s: string) =>
    (s || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

  const submit = async () => {
    setBusy(true);
    try {
      const cleanSlug = slugify(form.slug) || slugify(form.title_en);
      if (!cleanSlug) { toast.error(ar ? "الرابط الدائم مطلوب" : "Slug is required"); setBusy(false); return; }
      const res = await gen({
        data: {
          type: form.type,
          slug: cleanSlug,
          title_en: form.title_en,
          title_ar: form.title_ar,
          subtitle_en: form.subtitle_en || null,
          subtitle_ar: form.subtitle_ar || null,
          featured_image_url: form.featured_image_url || null,
          keywords: form.keywords ? form.keywords.split(",").map((s) => s.trim()).filter(Boolean) : null,
        },
      });
      toast.success((ar ? "تم إنشاء " : "Created ") + res.url);
      setForm((f) => ({ ...f, slug: "", title_en: "", title_ar: "", subtitle_en: "", subtitle_ar: "", keywords: "", featured_image_url: "" }));
    } catch (e: any) {
      toast.error(e?.message ?? (ar ? "فشل" : "Failed"));
    } finally { setBusy(false); }
  };

  const types: EntityType[] = ["service","city","airport","route_page","vehicle"];

  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{ar ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as EntityType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {types.map((t) => <SelectItem key={t} value={t}>{typeLabel(t, ar)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{ar ? "الرابط الدائم" : "Slug"}</Label>
          <Input placeholder="jeddah-to-makkah" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} />
          <p className="text-[10px] text-muted-foreground mt-1">{ar ? "أحرف صغيرة وأرقام وشرطات فقط. سيُطبَّع تلقائياً عند الحفظ." : "Lowercase letters, digits and dashes. Auto-normalized on save."}</p>
        </div>
        <div>
          <Label>{ar ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
          <Input value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
        </div>
        <div>
          <Label>{ar ? "العنوان (عربي)" : "Title (AR)"}</Label>
          <Input dir="rtl" value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} />
        </div>
        <div>
          <Label>{ar ? "العنوان الفرعي (إنجليزي)" : "Subtitle (EN)"}</Label>
          <Textarea rows={2} value={form.subtitle_en} onChange={(e) => setForm((f) => ({ ...f, subtitle_en: e.target.value }))} />
        </div>
        <div>
          <Label>{ar ? "العنوان الفرعي (عربي)" : "Subtitle (AR)"}</Label>
          <Textarea rows={2} dir="rtl" value={form.subtitle_ar} onChange={(e) => setForm((f) => ({ ...f, subtitle_ar: e.target.value }))} />
        </div>
        <div>
          <Label>{ar ? "رابط الصورة المميزة" : "Featured image URL"}</Label>
          <Input value={form.featured_image_url} onChange={(e) => setForm((f) => ({ ...f, featured_image_url: e.target.value }))} />
        </div>
        <div>
          <Label>{ar ? "الكلمات المفتاحية (مفصولة بفواصل)" : "Keywords (comma-separated)"}</Label>
          <Input value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={submit} disabled={busy || !form.slug || !form.title_en || !form.title_ar}>{ar ? "توليد" : "Generate"}</Button>
      </div>
    </Card>
  );
}

function BulkForm({ ar }: { ar: boolean }) {
  const bulk = useServerFn(bulkGenerateSeoPages);
  const [type, setType] = useState<EntityType>("route_page");
  const [csv, setCsv] = useState(`# slug, title_en, title_ar, subtitle_en, subtitle_ar
jeddah-to-makkah, Jeddah to Makkah Transfer, نقل جدة إلى مكة, Comfortable premium ride to Makkah, رحلة مريحة إلى مكة
jeddah-to-madinah, Jeddah to Madinah Transfer, نقل جدة إلى المدينة, Direct chauffeur service to Madinah, خدمة سائق مباشرة إلى المدينة`);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const parse = () => {
    const rows: any[] = [];
    for (const line of csv.split(/\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const parts = t.split(",").map((s) => s.trim());
      if (parts.length < 3) continue;
      const [slug, title_en, title_ar, subtitle_en, subtitle_ar] = parts;
      rows.push({ type, slug, title_en, title_ar, subtitle_en: subtitle_en || null, subtitle_ar: subtitle_ar || null });
    }
    return rows;
  };

  const submit = async () => {
    const combos = parse();
    if (!combos.length) { toast.error(ar ? "أضف صفاً واحداً على الأقل" : "Add at least one row"); return; }
    setBusy(true);
    try {
      const res = await bulk({ data: { combinations: combos } });
      setResult(res);
      toast.success(ar ? `تم إنشاء ${res.created}، تم تخطي ${res.skipped}` : `Created ${res.created}, skipped ${res.skipped}`);
    } catch (e: any) {
      toast.error(e?.message ?? (ar ? "فشل" : "Failed"));
    } finally { setBusy(false); }
  };

  const types: EntityType[] = ["service","city","airport","route_page","vehicle"];

  return (
    <Card className="space-y-4 p-4">
      <div>
        <Label>{ar ? "نوع كل الصفوف" : "Type for all rows"}</Label>
        <Select value={type} onValueChange={(v) => setType(v as EntityType)}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{typeLabel(t, ar)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{ar ? "صفوف CSV — slug, title_en, title_ar, subtitle_en, subtitle_ar" : "CSV rows — slug, title_en, title_ar, subtitle_en, subtitle_ar"}</Label>
        <Textarea rows={12} className="font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy}>{ar ? "توليد الكل" : "Generate all"}</Button>
      </div>
      {result && (
        <div className="rounded border p-3 text-sm">
          <div><strong>{ar ? "تم الإنشاء:" : "Created:"}</strong> {result.created} · <strong>{ar ? "تم التخطي:" : "Skipped:"}</strong> {result.skipped}</div>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-destructive">
              {result.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
