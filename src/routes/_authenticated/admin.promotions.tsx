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

export const Route = createFileRoute("/_authenticated/admin/promotions")({ component: PromotionsAdmin });

function PromotionsAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["promotions-admin"], queryFn: async () => (await supabase.from("promotions").select("*").order("sort_order")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const save = async (fd: FormData) => {
    const p: any = {
      title_en: fd.get("title_en"), title_ar: fd.get("title_ar"),
      body_en: fd.get("body_en") || null, body_ar: fd.get("body_ar") || null,
      image_url: fd.get("image_url") || null, badge: fd.get("badge") || null,
      cta_label_en: fd.get("cta_label_en") || null, cta_label_ar: fd.get("cta_label_ar") || null, cta_href: fd.get("cta_href") || null,
      starts_at: fd.get("starts_at") || null, ends_at: fd.get("ends_at") || null,
      sort_order: Number(fd.get("sort_order") || 0),
      active: fd.get("active") === "on",
    };
    const res = editing ? await supabase.from("promotions").update(p).eq("id", editing.id) : await supabase.from("promotions").insert(p);
    if (res.error) return toast.error(res.error.message);
    toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["promotions-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف؟" : "Delete?")) return;
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["promotions-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "t", header: ar ? "العنوان" : "Title", render: (r) => <div><div className="font-medium">{ar ? (r.title_ar || r.title_en) : r.title_en}</div><div className="text-xs text-muted-foreground">{r.badge}</div></div> },
    { key: "window", header: ar ? "الفترة" : "Window", render: (r) => <span className="text-xs text-muted-foreground">{r.starts_at?.slice(0,10) || "—"} → {r.ends_at?.slice(0,10) || "—"}</span> },
    { key: "active", header: ar ? "مفعّل" : "Active", render: (r) => <Switch checked={r.active} onCheckedChange={async (v) => { await supabase.from("promotions").update({ active: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["promotions-admin"] }); }} /> },
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
        <PageHeader title={ar ? "العروض الترويجية" : "Promotions"} description={ar ? "لافتات وحملات مؤقتة تعرض في الموقع العام." : "Time-boxed banners and campaigns shown across the public site."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{ar ? "عرض جديد" : "New Promotion"}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل العرض" : "Edit promotion") : (ar ? "عرض جديد" : "New promotion")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "العنوان (إنجليزي)" : "Title (EN)"}</label><Input name="title_en" defaultValue={editing?.title_en} required /></div>
                <div><label className="text-sm">{ar ? "العنوان (عربي)" : "Title (AR)"}</label><Input name="title_ar" defaultValue={editing?.title_ar} dir="rtl" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "النص (إنجليزي)" : "Body (EN)"}</label><Textarea name="body_en" defaultValue={editing?.body_en} rows={3} /></div>
                <div><label className="text-sm">{ar ? "النص (عربي)" : "Body (AR)"}</label><Textarea name="body_ar" defaultValue={editing?.body_ar} dir="rtl" rows={3} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "رابط الصورة" : "Image URL"}</label><Input name="image_url" defaultValue={editing?.image_url} type="url" /></div>
                <div><label className="text-sm">{ar ? "الشارة" : "Badge"}</label><Input name="badge" defaultValue={editing?.badge} placeholder="-20%" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm">{ar ? "زر الإجراء (إنجليزي)" : "CTA (EN)"}</label><Input name="cta_label_en" defaultValue={editing?.cta_label_en} /></div>
                <div><label className="text-sm">{ar ? "زر الإجراء (عربي)" : "CTA (AR)"}</label><Input name="cta_label_ar" defaultValue={editing?.cta_label_ar} dir="rtl" /></div>
                <div><label className="text-sm">{ar ? "رابط الزر" : "CTA href"}</label><Input name="cta_href" defaultValue={editing?.cta_href} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "يبدأ في" : "Starts at"}</label><Input name="starts_at" type="datetime-local" defaultValue={editing?.starts_at?.slice(0,16)} /></div>
                <div><label className="text-sm">{ar ? "ينتهي في" : "Ends at"}</label><Input name="ends_at" type="datetime-local" defaultValue={editing?.ends_at?.slice(0,16)} /></div>
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

