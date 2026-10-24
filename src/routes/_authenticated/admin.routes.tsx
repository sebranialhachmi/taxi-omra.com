import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/routes")({ component: RoutesPage });

const STATUSES = ["draft", "published", "archived"] as const;
const SCHEMA_TYPES = ["Service", "TaxiService", "TouristTrip", "Trip"];

function RoutesPage() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const q = useQuery({
    queryKey: ["routes-admin"],
    queryFn: async () => (await supabase.from("routes").select("*").is("deleted_at", null).order("sort_order")).data ?? [],
  });

  const save = async (fd: FormData) => {
    const kw = String(fd.get("keywords") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const gallery = String(fd.get("gallery") || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const payload: any = {
      slug: fd.get("slug"),
      name: fd.get("name"),
      origin: fd.get("origin"),
      destination: fd.get("destination"),
      distance_km: fd.get("distance_km") ? Number(fd.get("distance_km")) : null,
      duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
      fixed_price: fd.get("fixed_price") ? Number(fd.get("fixed_price")) : null,
      title_en: fd.get("title_en") || null,
      title_ar: fd.get("title_ar") || null,
      description_en: fd.get("description_en") || null,
      description_ar: fd.get("description_ar") || null,
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
      canonical_url: fd.get("canonical_url") || null,
      robots: fd.get("robots") || "index,follow",
      schema_type: fd.get("schema_type") || null,
      keywords: kw.length ? kw : null,
      sort_order: Number(fd.get("sort_order") || 0),
      status: fd.get("status") || "draft",
      is_active: fd.get("is_active") === "on",
    };
    const res = editing
      ? await supabase.from("routes").update(payload).eq("id", editing.id)
      : await supabase.from("routes").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["routes-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm(locale === "ar" ? "حذف المسار؟" : "Delete route?")) return;
    const { error } = await supabase.from("routes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["routes-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "name", header: locale === "ar" ? "الاسم" : "Name", render: (r) => (
      <div><div className="font-medium">{locale === "ar" ? r.title_ar || r.name : r.title_en || r.name}</div>
        <div className="text-xs text-muted-foreground">/routes/{r.slug}</div></div>
    ) },
    { key: "origin", header: locale === "ar" ? "من" : "From", render: (r) => <span className="text-xs">{r.origin} → {r.destination}</span> },
    { key: "fixed_price", header: locale === "ar" ? "السعر" : "Price", render: (r) => r.fixed_price ? Number(r.fixed_price).toFixed(2) : "—" },
    { key: "status", header: locale === "ar" ? "الحالة" : "Status", render: (r) => <Badge variant="outline">{r.status || "draft"}</Badge> },
    { key: "is_active", header: locale === "ar" ? "نشط" : "Active", render: (r) => <Switch checked={r.is_active} onCheckedChange={async (v) => { await supabase.from("routes").update({ is_active: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["routes-admin"] }); }} /> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        {r.slug && r.status === "published" && <a href={`/routes/${r.slug}`} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></a>}
        <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader title={locale === "ar" ? "المسارات" : "Routes"} description={locale === "ar" ? "مسارات النقل من — إلى، بأسعار ثابتة وصفحات SEO" : "Point-to-point routes with fixed prices and SEO landing pages."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{locale === "ar" ? "جديد" : "New"}</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? (locale === "ar" ? "تحرير" : "Edit route") : (locale === "ar" ? "مسار جديد" : "New route")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-4">
              <Tabs defaultValue="content">
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Slug *</label><Input name="slug" defaultValue={editing?.slug} required pattern="[a-z0-9-]+" /></div>
                    <div><label className="text-sm">Status</label>
                      <Select name="status" defaultValue={editing?.status ?? "draft"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><label className="text-sm">Internal name *</label><Input name="name" defaultValue={editing?.name} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Origin *</label><Input name="origin" defaultValue={editing?.origin} required /></div>
                    <div><label className="text-sm">Destination *</label><Input name="destination" defaultValue={editing?.destination} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Title (EN)</label><Input name="title_en" defaultValue={editing?.title_en} /></div>
                    <div><label className="text-sm">Title (AR)</label><Input name="title_ar" defaultValue={editing?.title_ar} dir="rtl" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Description (EN)</label><Textarea name="description_en" defaultValue={editing?.description_en} rows={8} /></div>
                    <div><label className="text-sm">Description (AR)</label><Textarea name="description_ar" defaultValue={editing?.description_ar} rows={8} dir="rtl" /></div>
                  </div>
                </TabsContent>
                <TabsContent value="pricing" className="space-y-3 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-sm">Distance (km)</label><Input type="number" step="0.1" name="distance_km" defaultValue={editing?.distance_km} /></div>
                    <div><label className="text-sm">Duration (min)</label><Input type="number" name="duration_min" defaultValue={editing?.duration_min} /></div>
                    <div><label className="text-sm">Fixed price</label><Input type="number" step="0.01" name="fixed_price" defaultValue={editing?.fixed_price} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Sort order</label><Input type="number" name="sort_order" defaultValue={editing?.sort_order ?? 0} /></div>
                    <label className="flex items-center gap-2 text-sm pt-6"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Active (bookable)</label>
                  </div>
                </TabsContent>
                <TabsContent value="media" className="space-y-3 pt-4">
                  <div><label className="text-sm">Featured image URL</label><Input name="featured_image_url" defaultValue={editing?.featured_image_url} type="url" /></div>
                  <div><label className="text-sm">Gallery (one URL per line)</label>
                    <Textarea name="gallery" defaultValue={Array.isArray(editing?.gallery) ? editing.gallery.join("\n") : ""} rows={5} />
                  </div>
                </TabsContent>
                <TabsContent value="seo" className="space-y-3 pt-4">
                  <div><label className="text-sm">Meta title</label><Input name="meta_title" defaultValue={editing?.meta_title} maxLength={70} /></div>
                  <div><label className="text-sm">Meta description</label><Textarea name="meta_description" defaultValue={editing?.meta_description} rows={2} maxLength={160} /></div>
                  <div><label className="text-sm">Keywords (comma separated)</label><Input name="keywords" defaultValue={editing?.keywords?.join(", ") ?? ""} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-sm">Canonical URL</label><Input name="canonical_url" defaultValue={editing?.canonical_url} placeholder="auto" /></div>
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
                      <Select name="schema_type" defaultValue={editing?.schema_type ?? ""}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{SCHEMA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="social" className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">OG title</label><Input name="og_title" defaultValue={editing?.og_title} /></div>
                    <div><label className="text-sm">OG description</label><Input name="og_description" defaultValue={editing?.og_description} /></div>
                  </div>
                  <div><label className="text-sm">OG image URL</label><Input name="og_image_url" defaultValue={editing?.og_image_url} type="url" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Twitter title</label><Input name="twitter_title" defaultValue={editing?.twitter_title} /></div>
                    <div><label className="text-sm">Twitter description</label><Input name="twitter_description" defaultValue={editing?.twitter_description} /></div>
                  </div>
                  <div><label className="text-sm">Twitter image URL</label><Input name="twitter_image_url" defaultValue={editing?.twitter_image_url} type="url" /></div>
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
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
