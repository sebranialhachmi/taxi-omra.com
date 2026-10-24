import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Eye, ExternalLink, Search, Archive, Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type PageRow = Record<string, any>;

const SCHEMA_TYPES = ["Service", "TaxiService", "LocalBusiness", "Place", "Airport", "Vehicle", "FAQPage", "Article", "BreadcrumbList"];
const STATUSES = ["draft", "published", "archived"] as const;

export interface CmsPageManagerProps {
  pageType: string;
  title: string;
  description: string;
  publicPathPrefix: string;    // e.g. "/services", "/cities"
  defaultSchemaType?: string;
}

export function CmsPageManager({ pageType, title, description, publicPathPrefix, defaultSchemaType }: CmsPageManagerProps) {
  const qc = useQueryClient();
  const { locale } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("sort_order");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [preview, setPreview] = useState<PageRow | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const pageSize = 20;

  const key = ["cms-page-manager", pageType, statusFilter, sortBy, showDeleted];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase.from("cms_pages").select("*", { count: "exact" }).eq("page_type", pageType as any);
      query = showDeleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      const { data, error } = await query.order(sortBy, { ascending: sortBy !== "updated_at" });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter((r: any) =>
      (r.title_en || "").toLowerCase().includes(s) ||
      (r.title_ar || "").toLowerCase().includes(s) ||
      (r.slug || "").toLowerCase().includes(s));
  }, [q.data, search]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const slugify = (s: string) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120);

  const save = async (fd: FormData) => {
    const kw = String(fd.get("keywords") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const gallery = String(fd.get("gallery") || "").split("\n").map((s) => s.trim()).filter(Boolean);
    let slug = String(fd.get("slug") || "").trim();
    const title_en = String(fd.get("title_en") || "").trim();
    const title_ar = String(fd.get("title_ar") || "").trim();
    if (!slug) slug = slugify(title_en || title_ar);
    if (!slug) { toast.error(locale === "ar" ? "الرابط الدائم مطلوب" : "Slug is required"); return; }
    slug = slugify(slug);
    const payload: any = {
      slug,
      page_type: pageType,
      title_en, title_ar,
      subtitle_en: fd.get("subtitle_en") || null,
      subtitle_ar: fd.get("subtitle_ar") || null,
      body_en: fd.get("body_en") || null,
      body_ar: fd.get("body_ar") || null,
      hero_image_url: fd.get("hero_image_url") || null,
      featured_image_url: fd.get("featured_image_url") || null,
      og_image_url: fd.get("og_image_url") || null,
      twitter_image_url: fd.get("twitter_image_url") || null,
      gallery,
      meta_title: fd.get("meta_title") || null,
      meta_description: fd.get("meta_description") || null,
      og_title: fd.get("og_title") || null,
      og_description: fd.get("og_description") || null,
      twitter_title: fd.get("twitter_title") || null,
      twitter_description: fd.get("twitter_description") || null,
      twitter_card: fd.get("twitter_card") || "summary_large_image",
      canonical_url: fd.get("canonical_url") || null,
      robots: fd.get("robots") || "index,follow",
      schema_type: fd.get("schema_type") || defaultSchemaType || null,
      keywords: kw.length ? kw : null,
      sort_order: Number(fd.get("sort_order") || 0),
      status: fd.get("status") || "draft",
    };
    const res = editing
      ? await supabase.from("cms_pages").update(payload).eq("id", editing.id)
      : await supabase.from("cms_pages").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["cms-page-manager"] });
  };

  const softDelete = async (id: string) => {
    if (!confirm(locale === "ar" ? "نقل إلى المحذوفات؟" : "Move to trash?")) return;
    const { error } = await supabase.from("cms_pages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["cms-page-manager"] });
  };

  const restore = async (id: string) => {
    const { error } = await supabase.from("cms_pages").update({ deleted_at: null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["cms-page-manager"] });
  };

  const bulkAction = async (action: "publish" | "draft" | "archive" | "trash" | "restore" | "delete") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (action === "delete" && !confirm(locale === "ar" ? "حذف نهائي؟" : "Permanently delete?")) return;
    let res;
    if (action === "delete") res = await supabase.from("cms_pages").delete().in("id", ids);
    else if (action === "trash") res = await supabase.from("cms_pages").update({ deleted_at: new Date().toISOString() }).in("id", ids);
    else if (action === "restore") res = await supabase.from("cms_pages").update({ deleted_at: null }).in("id", ids);
    else res = await supabase.from("cms_pages").update({ status: action === "publish" ? "published" : action === "draft" ? "draft" : "archived" }).in("id", ids);
    if (res?.error) { toast.error(res.error.message); return; }
    toast.success(locale === "ar" ? "تم" : "Done");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["cms-page-manager"] });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((r: any) => r.id)));
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { published: "bg-emerald-500/10 text-emerald-600", draft: "bg-amber-500/10 text-amber-600", archived: "bg-slate-500/10 text-slate-500" };
    return <Badge variant="outline" className={map[s] || ""}>{s}</Badge>;
  };

  const cols: Column<any>[] = [
    {
      key: "sel",
      header: <Checkbox checked={paged.length > 0 && selected.size === paged.length} onCheckedChange={toggleAll} />,
      render: (r) => <Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => { const n = new Set(selected); v ? n.add(r.id) : n.delete(r.id); setSelected(n); }} />,
    },
    { key: "title_en", header: locale === "ar" ? "العنوان" : "Title", render: (r) => (
      <div><div className="font-medium">{locale === "ar" ? r.title_ar || r.title_en : r.title_en || r.title_ar}</div>
        <div className="text-xs text-muted-foreground">{publicPathPrefix}/{r.slug}</div></div>
    )},
    { key: "status", header: locale === "ar" ? "الحالة" : "Status", render: (r) => statusBadge(r.status) },
    { key: "sort_order", header: locale === "ar" ? "الترتيب" : "Order", render: (r) => <span className="text-xs">{r.sort_order}</span> },
    { key: "updated_at", header: locale === "ar" ? "التحديث" : "Updated", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</span> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Button size="icon" variant="ghost" title="Preview" onClick={() => setPreview(r)}><Eye className="h-4 w-4" /></Button>
        {r.status === "published" && !r.deleted_at && (
          <a href={`${publicPathPrefix}/${r.slug}`} target="_blank" rel="noreferrer">
            <Button size="icon" variant="ghost" title="Open"><ExternalLink className="h-4 w-4" /></Button>
          </a>
        )}
        {r.deleted_at ? (
          <Button size="icon" variant="ghost" title="Restore" onClick={() => restore(r.id)}><Undo2 className="h-4 w-4" /></Button>
        ) : (
          <Button size="icon" variant="ghost" title="Edit" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
        )}
        <Button size="icon" variant="ghost" title={r.deleted_at ? "Delete forever" : "Trash"} onClick={() => softDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <PageHeader title={title} description={description} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-2" />{locale === "ar" ? "جديد" : "New"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? (locale === "ar" ? "تحرير" : "Edit") : (locale === "ar" ? "جديد" : "New")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-4">
              <Tabs defaultValue="content">
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="content">{locale === "ar" ? "المحتوى" : "Content"}</TabsTrigger>
                  <TabsTrigger value="media">{locale === "ar" ? "الوسائط" : "Media"}</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="settings">{locale === "ar" ? "الإعدادات" : "Settings"}</TabsTrigger>
                </TabsList>

                <TabsContent forceMount value="content" className="space-y-3 pt-4 data-[state=inactive]:hidden">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Slug</label><Input name="slug" defaultValue={editing?.slug} placeholder={locale === "ar" ? "يُنشأ تلقائياً من العنوان" : "auto-generated from title"} /></div>
                    <div><label className="text-sm">{locale === "ar" ? "الحالة" : "Status"} *</label>
                      <Select name="status" defaultValue={editing?.status ?? "draft"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">{locale === "ar" ? "العنوان (إنجليزي)" : "Title (EN)"} *</label><Input name="title_en" defaultValue={editing?.title_en} required /></div>
                    <div><label className="text-sm">{locale === "ar" ? "العنوان (عربي)" : "Title (AR)"} *</label><Input name="title_ar" defaultValue={editing?.title_ar} dir="rtl" required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">{locale === "ar" ? "العنوان الفرعي (إنجليزي)" : "Subtitle (EN)"}</label><Input name="subtitle_en" defaultValue={editing?.subtitle_en} /></div>
                    <div><label className="text-sm">{locale === "ar" ? "العنوان الفرعي (عربي)" : "Subtitle (AR)"}</label><Input name="subtitle_ar" defaultValue={editing?.subtitle_ar} dir="rtl" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">{locale === "ar" ? "المحتوى (إنجليزي)" : "Body (EN)"}</label><Textarea name="body_en" defaultValue={editing?.body_en} rows={10} /></div>
                    <div><label className="text-sm">{locale === "ar" ? "المحتوى (عربي)" : "Body (AR)"}</label><Textarea name="body_ar" defaultValue={editing?.body_ar} rows={10} dir="rtl" /></div>
                  </div>
                </TabsContent>

                <TabsContent forceMount value="media" className="space-y-3 pt-4 data-[state=inactive]:hidden">
                  <div><label className="text-sm">{locale === "ar" ? "صورة الغلاف (Hero)" : "Hero image URL"}</label><Input name="hero_image_url" defaultValue={editing?.hero_image_url} type="url" /></div>
                  <div><label className="text-sm">{locale === "ar" ? "الصورة المميزة" : "Featured image URL"}</label><Input name="featured_image_url" defaultValue={editing?.featured_image_url} type="url" /></div>
                  <div><label className="text-sm">{locale === "ar" ? "المعرض (رابط في كل سطر)" : "Gallery (one URL per line)"}</label>
                    <Textarea name="gallery" defaultValue={Array.isArray(editing?.gallery) ? editing.gallery.join("\n") : ""} rows={5} />
                  </div>
                </TabsContent>

                <TabsContent forceMount value="seo" className="space-y-3 pt-4 data-[state=inactive]:hidden">
                  <div><label className="text-sm">{locale === "ar" ? "عنوان الميتا" : "Meta title"}</label><Input name="meta_title" defaultValue={editing?.meta_title} maxLength={70} /></div>
                  <div><label className="text-sm">{locale === "ar" ? "وصف الميتا" : "Meta description"}</label><Textarea name="meta_description" defaultValue={editing?.meta_description} rows={2} maxLength={160} /></div>
                  <div><label className="text-sm">{locale === "ar" ? "الكلمات المفتاحية (مفصولة بفواصل)" : "Keywords (comma separated)"}</label><Input name="keywords" defaultValue={editing?.keywords?.join(", ") ?? ""} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-sm">{locale === "ar" ? "الرابط الكانوني" : "Canonical URL"}</label><Input name="canonical_url" defaultValue={editing?.canonical_url} placeholder="auto" /></div>
                    <div><label className="text-sm">Robots</label>
                      <Select name="robots" defaultValue={editing?.robots ?? "index,follow"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="index,follow">index,follow</SelectItem>
                          <SelectItem value="noindex,follow">noindex,follow</SelectItem>
                          <SelectItem value="index,nofollow">index,nofollow</SelectItem>
                          <SelectItem value="noindex,nofollow">noindex,nofollow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><label className="text-sm">Schema.org</label>
                      <Select name="schema_type" defaultValue={editing?.schema_type ?? defaultSchemaType ?? ""}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{SCHEMA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent forceMount value="social" className="space-y-3 pt-4 data-[state=inactive]:hidden">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">OG title</label><Input name="og_title" defaultValue={editing?.og_title} /></div>
                    <div><label className="text-sm">OG description</label><Input name="og_description" defaultValue={editing?.og_description} /></div>
                  </div>
                  <div><label className="text-sm">OG image URL</label><Input name="og_image_url" defaultValue={editing?.og_image_url} type="url" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Twitter title</label><Input name="twitter_title" defaultValue={editing?.twitter_title} /></div>
                    <div><label className="text-sm">Twitter description</label><Input name="twitter_description" defaultValue={editing?.twitter_description} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Twitter image URL</label><Input name="twitter_image_url" defaultValue={editing?.twitter_image_url} type="url" /></div>
                    <div><label className="text-sm">Twitter card</label>
                      <Select name="twitter_card" defaultValue={editing?.twitter_card ?? "summary_large_image"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summary">summary</SelectItem>
                          <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent forceMount value="settings" className="space-y-3 pt-4 data-[state=inactive]:hidden">
                  <div><label className="text-sm">{locale === "ar" ? "الترتيب" : "Sort order"}</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit">{locale === "ar" ? "حفظ" : "Save"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={locale === "ar" ? "بحث..." : "Search..."} className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sort_order">Sort: order</SelectItem>
            <SelectItem value="updated_at">Sort: recent</SelectItem>
            <SelectItem value="title_en">Sort: A→Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={showDeleted ? "default" : "outline"} size="sm" onClick={() => setShowDeleted((v) => !v)}>
          <Archive className="h-4 w-4 me-1" />{locale === "ar" ? "المحذوفات" : "Trash"}
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
          <span>{selected.size} {locale === "ar" ? "محدد" : "selected"}</span>
          <div className="ms-auto flex gap-1">
            {!showDeleted && <>
              <Button size="sm" variant="outline" onClick={() => bulkAction("publish")}>Publish</Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction("draft")}>Draft</Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction("archive")}>Archive</Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction("trash")}>Trash</Button>
            </>}
            {showDeleted && <>
              <Button size="sm" variant="outline" onClick={() => bulkAction("restore")}>Restore</Button>
              <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>Delete</Button>
            </>}
          </div>
        </div>
      )}

      <DataTable data={paged} columns={cols} loading={q.isLoading} />

      <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
        <span>{filtered.length} {locale === "ar" ? "عنصر" : "items"}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="px-2">Page {page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Preview modal */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{locale === "ar" ? "معاينة" : "Preview"}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4">
              {preview.hero_image_url && <img src={preview.hero_image_url} alt="" className="w-full rounded-lg object-cover max-h-[300px]" />}
              <div className="flex gap-2 items-center">{statusBadge(preview.status)}<span className="text-xs text-muted-foreground">{publicPathPrefix}/{preview.slug}</span></div>
              <div>
                <h2 className="text-2xl font-display">{locale === "ar" ? preview.title_ar : preview.title_en}</h2>
                {preview.subtitle_ar && <p className="text-muted-foreground mt-1">{locale === "ar" ? preview.subtitle_ar : preview.subtitle_en}</p>}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{locale === "ar" ? preview.body_ar : preview.body_en}</div>
              <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                <div><b>Meta title:</b> {preview.meta_title || "—"}</div>
                <div><b>Meta desc:</b> {preview.meta_description || "—"}</div>
                <div><b>Canonical:</b> {preview.canonical_url || "auto"}</div>
                <div><b>Robots:</b> {preview.robots}</div>
                <div><b>Schema:</b> {preview.schema_type || "—"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
