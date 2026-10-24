import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/hero")({ component: HeroAdmin });

function HeroAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hero-admin"], queryFn: async () => (await supabase.from("hero_slides").select("*").order("sort_order")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const save = async (fd: FormData) => {
    const p: any = {
      title_en: fd.get("title_en"), title_ar: fd.get("title_ar"),
      subtitle_en: fd.get("subtitle_en") || null, subtitle_ar: fd.get("subtitle_ar") || null,
      image_url: fd.get("image_url") || null,
      cta_label_en: fd.get("cta_label_en") || null, cta_label_ar: fd.get("cta_label_ar") || null,
      cta_href: fd.get("cta_href") || null,
      sort_order: Number(fd.get("sort_order") || 0),
      active: fd.get("active") === "on",
    };
    const res = editing ? await supabase.from("hero_slides").update(p).eq("id", editing.id) : await supabase.from("hero_slides").insert(p);
    if (res.error) return toast.error(res.error.message);
    toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["hero-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف؟" : "Delete?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["hero-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "title_en", header: ar ? "العنوان" : "Title", render: (r) => <div><div className="font-medium">{ar ? r.title_ar : r.title_en}</div><div className="text-xs text-muted-foreground" dir={ar ? "ltr" : "rtl"}>{ar ? r.title_en : r.title_ar}</div></div> },
    { key: "cta", header: ar ? "زر الإجراء" : "CTA", render: (r) => r.cta_href ? <span className="text-xs text-muted-foreground truncate max-w-[220px] inline-block">{r.cta_href}</span> : null },
    { key: "sort_order", header: ar ? "الترتيب" : "Order" },
    { key: "active", header: ar ? "مفعّل" : "Active", render: (r) => <Switch checked={r.active} onCheckedChange={async (v) => { await supabase.from("hero_slides").update({ active: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["hero-admin"] }); }} /> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader title={ar ? "شرائح الهيرو" : "Hero Slides"} description={ar ? "الشرائح الدوارة التي تظهر في أعلى الصفحة الرئيسية." : "Rotating hero slides shown on the public homepage."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{ar ? "شريحة جديدة" : "New Slide"}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل الشريحة" : "Edit slide") : (ar ? "شريحة جديدة" : "New slide")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "العنوان (إنجليزي)" : "Title (EN)"}</label><Input name="title_en" defaultValue={editing?.title_en} required /></div>
                <div><label className="text-sm">{ar ? "العنوان (عربي)" : "Title (AR)"}</label><Input name="title_ar" defaultValue={editing?.title_ar} dir="rtl" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "العنوان الفرعي (إنجليزي)" : "Subtitle (EN)"}</label><Textarea name="subtitle_en" defaultValue={editing?.subtitle_en} rows={2} /></div>
                <div><label className="text-sm">{ar ? "العنوان الفرعي (عربي)" : "Subtitle (AR)"}</label><Textarea name="subtitle_ar" defaultValue={editing?.subtitle_ar} dir="rtl" rows={2} /></div>
              </div>
              <div><label className="text-sm">{ar ? "رابط الصورة" : "Image URL"}</label><Input name="image_url" defaultValue={editing?.image_url} type="url" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm">{ar ? "نص الزر (إنجليزي)" : "CTA (EN)"}</label><Input name="cta_label_en" defaultValue={editing?.cta_label_en} /></div>
                <div><label className="text-sm">{ar ? "نص الزر (عربي)" : "CTA (AR)"}</label><Input name="cta_label_ar" defaultValue={editing?.cta_label_ar} dir="rtl" /></div>
                <div><label className="text-sm">{ar ? "رابط الزر" : "CTA href"}</label><Input name="cta_href" defaultValue={editing?.cta_href} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div><label className="text-sm">{ar ? "الترتيب" : "Sort order"}</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing ? editing.active : true} />{ar ? "مفعّل" : "Active"}</label>
              </div>
              <DialogFooter><Button type="submit">{ar ? "حفظ" : "Save"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
