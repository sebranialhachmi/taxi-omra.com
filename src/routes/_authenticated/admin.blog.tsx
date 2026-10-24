import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Plus, Trash2, Edit, ExternalLink, ChevronDown, ImageIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { MediaPicker } from "@/components/editor/MediaPicker";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_authenticated/admin/blog")({ component: BlogAdmin });

const STATUSES = ["draft", "published", "scheduled", "archived"] as const;

function slugify(s: string) {
  return (s || "").toLowerCase().trim().replace(/[^\w\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

/** Collapsible admin section (SEO / Media) so the editor screen stays short. */
function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg border border-border">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium">
        {title}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

function SerpPreview({ title, desc, slug, dir }: { title: string; desc: string; slug: string; dir: "rtl" | "ltr" }) {
  return (
    <div dir={dir} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
      <div className="text-xs text-muted-foreground">{SITE.url}/blog/{slug || "your-slug"}</div>
      <div className="text-[#1a0dab] dark:text-blue-400 text-lg leading-snug line-clamp-1">{title || "—"}</div>
      <div className="text-sm text-muted-foreground line-clamp-2">{desc || "—"}</div>
      <div className="text-[11px] text-muted-foreground">{title.length} / 60 · {desc.length} / 160</div>
    </div>
  );
}

const EMPTY: any = { status: "draft" };

function BlogAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["blog-admin"], queryFn: async () => (await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })).data ?? [] });
  const cats = useQuery({ queryKey: ["blog-cats"], queryFn: async () => (await supabase.from("blog_categories").select("id,name_en,name_ar").order("name_en")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [coverPicker, setCoverPicker] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const editing = !!form.id;
  const slug = form.slug || slugify(form.title_en || "");

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (form.content_en && !form.meta_description) w.push("English SEO description is missing.");
    if (form.content_ar && !form.meta_description_ar) w.push("وصف SEO بالعربية مفقود.");
    if (form.cover_url && !form.cover_alt_en && !form.cover_alt_ar) w.push("Featured image alt text is missing.");
    return w;
  }, [form]);

  const openNew = () => { setForm(EMPTY); setOpen(true); };
  const openEdit = (r: any) => { setForm({ ...r }); setOpen(true); };

  const save = async () => {
    if (!form.title_en || !form.title_ar) { toast.error(ar ? "العنوان مطلوب بالعربية والإنجليزية" : "Title EN + AR are required"); return; }
    const toArr = (v: any) => (Array.isArray(v) ? v : String(v || "").split(",").map((s) => s.trim()).filter(Boolean));
    const kw = toArr(form.keywords);
    const tags = toArr(form.tags);
    const payload: any = {
      slug: slugify(form.slug || form.title_en),
      title_en: form.title_en, title_ar: form.title_ar,
      excerpt_en: form.excerpt_en || null, excerpt_ar: form.excerpt_ar || null,
      content_en: form.content_en || null, content_ar: form.content_ar || null,
      content_format: "html",
      cover_url: form.cover_url || null,
      cover_alt_en: form.cover_alt_en || null, cover_alt_ar: form.cover_alt_ar || null,
      cover_caption: form.cover_caption || null,
      og_image_url: form.og_image_url || null,
      meta_title: form.meta_title || null, meta_description: form.meta_description || null,
      meta_title_ar: form.meta_title_ar || null, meta_description_ar: form.meta_description_ar || null,
      primary_keyword_en: form.primary_keyword_en || null, primary_keyword_ar: form.primary_keyword_ar || null,
      canonical_url: form.canonical_url || null,
      keywords: kw.length ? kw : null, tags: tags.length ? tags : null,
      category_id: form.category_id || null,
      featured: !!form.featured,
      status: form.status || "draft",
      published: (form.status || "draft") === "published",
      published_at: (form.status || "draft") === "published" ? (form.published_at ?? new Date().toISOString()) : form.published_at ?? null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    };
    const res = editing
      ? await supabase.from("blog_posts").update(payload).eq("id", form.id)
      : await supabase.from("blog_posts").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(ar ? "تم الحفظ" : "Saved");
    if (warnings.length) toast.warning(warnings.join(" "));
    setOpen(false); setForm(EMPTY);
    qc.invalidateQueries({ queryKey: ["blog-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف المقال؟" : "Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["blog-admin"] });
  };

  const setPublished = async (r: any, v: boolean) => {
    await supabase.from("blog_posts").update({ status: v ? "published" : "draft", published: v, published_at: v ? (r.published_at ?? new Date().toISOString()) : null }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["blog-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "title_en", header: ar ? "العنوان" : "Title", render: (r) => (
      <div><div className="font-medium">{ar ? r.title_ar || r.title_en : r.title_en}</div>
        <div className="text-xs text-muted-foreground">/blog/{r.slug}</div></div>
    )},
    { key: "status", header: ar ? "الحالة" : "Status", render: (r) => <Badge variant="outline">{r.status || (r.published ? "published" : "draft")}</Badge> },
    { key: "featured", header: ar ? "مميز" : "Featured", render: (r) => r.featured ? "★" : "" },
    { key: "published", header: ar ? "منشور" : "Live", render: (r) => <Switch checked={r.status === "published"} onCheckedChange={(v) => setPublished(r, v)} /> },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        {r.status === "published" && <a href={`/${locale}/blog/${r.slug}`} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></a>}
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  const scheduledDefault = form.scheduled_at ? new Date(form.scheduled_at).toISOString().slice(0, 16) : "";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <PageHeader title={ar ? "المدونة" : "Blog Posts"} description={ar ? "إدارة المقالات ثنائية اللغة ومحتوى SEO" : "Manage bilingual articles and SEO for the public blog."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(EMPTY); }}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 me-2" /> {ar ? "مقال جديد" : "New Post"}</Button></DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? (ar ? "تحرير المقال" : "Edit post") : (ar ? "مقال جديد" : "New post")}</DialogTitle></DialogHeader>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-sm">Title (EN) *</label><Input value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></div>
                <div><label className="text-sm">العنوان (AR) *</label><Input dir="rtl" value={form.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></div>
              </div>
              <div><label className="text-sm">Slug</label><Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder={slug} /></div>

              <Tabs defaultValue="en">
                <TabsList className="grid grid-cols-2 w-64">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-3 pt-4">
                  <div><label className="text-sm">Excerpt (EN)</label><Textarea rows={2} value={form.excerpt_en ?? ""} onChange={(e) => set("excerpt_en", e.target.value)} /></div>
                  <div><label className="text-sm">Content (EN)</label>
                    <RichTextEditor dir="ltr" value={form.content_en ?? ""} onChange={(html) => set("content_en", html)} />
                  </div>
                </TabsContent>

                <TabsContent value="ar" className="space-y-3 pt-4">
                  <div><label className="text-sm">المقتطف (AR)</label><Textarea dir="rtl" rows={2} value={form.excerpt_ar ?? ""} onChange={(e) => set("excerpt_ar", e.target.value)} /></div>
                  <div><label className="text-sm">المحتوى (AR)</label>
                    <RichTextEditor dir="rtl" value={form.content_ar ?? ""} onChange={(html) => set("content_ar", html)} />
                  </div>
                </TabsContent>
              </Tabs>

              <Section title="SEO Settings">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><label className="text-sm">Meta Title (EN)</label><Input maxLength={70} value={form.meta_title ?? ""} onChange={(e) => set("meta_title", e.target.value)} /></div>
                    <div><label className="text-sm">Meta Description (EN)</label><Textarea rows={2} maxLength={180} value={form.meta_description ?? ""} onChange={(e) => set("meta_description", e.target.value)} /></div>
                    <div><label className="text-sm">Primary Keyword (EN)</label><Input value={form.primary_keyword_en ?? ""} onChange={(e) => set("primary_keyword_en", e.target.value)} /></div>
                    <SerpPreview dir="ltr" slug={slug} title={form.meta_title || form.title_en || ""} desc={form.meta_description || form.excerpt_en || ""} />
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-sm">Meta Title (AR)</label><Input dir="rtl" maxLength={70} value={form.meta_title_ar ?? ""} onChange={(e) => set("meta_title_ar", e.target.value)} /></div>
                    <div><label className="text-sm">Meta Description (AR)</label><Textarea dir="rtl" rows={2} maxLength={180} value={form.meta_description_ar ?? ""} onChange={(e) => set("meta_description_ar", e.target.value)} /></div>
                    <div><label className="text-sm">الكلمة المفتاحية (AR)</label><Input dir="rtl" value={form.primary_keyword_ar ?? ""} onChange={(e) => set("primary_keyword_ar", e.target.value)} /></div>
                    <SerpPreview dir="rtl" slug={slug} title={form.meta_title_ar || form.title_ar || ""} desc={form.meta_description_ar || form.excerpt_ar || ""} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className="text-sm">Secondary Keywords</label><Input value={Array.isArray(form.keywords) ? form.keywords.join(", ") : form.keywords ?? ""} onChange={(e) => set("keywords", e.target.value)} /></div>
                  <div><label className="text-sm">Tags</label><Input value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags ?? ""} onChange={(e) => set("tags", e.target.value)} /></div>
                  <div><label className="text-sm">Canonical URL</label><Input value={form.canonical_url ?? ""} onChange={(e) => set("canonical_url", e.target.value)} placeholder="auto" /></div>
                </div>
                {warnings.length > 0 && <ul className="text-xs text-amber-600 list-disc ps-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
              </Section>

              <Section title="Media">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="w-40 aspect-[16/10] rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                    {form.cover_url ? <img src={form.cover_url} alt={form.cover_alt_en || ""} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-64 space-y-3">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setCoverPicker(true)}>{ar ? "اختيار / رفع" : "Upload / Select"}</Button>
                      {form.cover_url && <Button type="button" variant="ghost" onClick={() => set("cover_url", "")}>{ar ? "إزالة" : "Remove"}</Button>}
                    </div>
                    <div><label className="text-sm">Featured image URL</label><Input value={form.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} /></div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><label className="text-sm">Alt Text (EN)</label><Input value={form.cover_alt_en ?? ""} onChange={(e) => set("cover_alt_en", e.target.value)} /></div>
                      <div><label className="text-sm">Alt Text (AR)</label><Input dir="rtl" value={form.cover_alt_ar ?? ""} onChange={(e) => set("cover_alt_ar", e.target.value)} /></div>
                    </div>
                    <div><label className="text-sm">Caption</label><Input value={form.cover_caption ?? ""} onChange={(e) => set("cover_caption", e.target.value)} /></div>
                    <div><label className="text-sm">OG / Social image URL</label><Input value={form.og_image_url ?? ""} onChange={(e) => set("og_image_url", e.target.value)} /></div>
                  </div>
                </div>
                <MediaPicker open={coverPicker} onOpenChange={setCoverPicker} onPick={(m) => {
                  set("cover_url", m.url);
                  if (m.altEn) set("cover_alt_en", m.altEn);
                  if (m.altAr) set("cover_alt_ar", m.altAr);
                  if (m.caption) set("cover_caption", m.caption);
                }} />
              </Section>

              <Section title={ar ? "النشر" : "Publish"} defaultOpen>
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className="text-sm">{ar ? "الحالة" : "Status"}</label>
                    <Select value={form.status ?? "draft"} onValueChange={(v) => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm">{ar ? "التصنيف" : "Category"}</label>
                    <Select value={form.category_id ?? ""} onValueChange={(v) => set("category_id", v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{(cats.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{ar ? c.name_ar || c.name_en : c.name_en}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm">{ar ? "موعد النشر" : "Scheduled at"}</label><Input type="datetime-local" value={scheduledDefault} onChange={(e) => set("scheduled_at", e.target.value)} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} /> {ar ? "مقال مميز" : "Featured"}</label>
              </Section>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                {form.slug && form.status === "published" && (
                  <a href={`/${locale}/blog/${form.slug}`} target="_blank" rel="noreferrer"><Button type="button" variant="outline">{ar ? "معاينة" : "Preview"}</Button></a>
                )}
                <Button type="button" variant="secondary" onClick={() => { set("status", "draft"); void save(); }}>{ar ? "حفظ كمسودة" : "Save Draft"}</Button>
                <Button type="button" onClick={() => void save()}>{ar ? "حفظ" : "Save"}</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
