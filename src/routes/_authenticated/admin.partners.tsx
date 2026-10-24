import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/partners")({ component: PartnersAdmin });

function PartnersAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["partners-admin"], queryFn: async () => (await supabase.from("partners").select("*").order("sort_order")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const save = async (fd: FormData) => {
    const p: any = {
      name: fd.get("name"), logo_url: fd.get("logo_url") || null,
      website: fd.get("website") || null, sort_order: Number(fd.get("sort_order") || 0),
      active: fd.get("active") === "on",
    };
    const res = editing ? await supabase.from("partners").update(p).eq("id", editing.id) : await supabase.from("partners").insert(p);
    if (res.error) return toast.error(res.error.message);
    toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["partners-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف؟" : "Delete?")) return;
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["partners-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "logo", header: ar ? "الشعار" : "Logo", render: (r) => r.logo_url ? <img src={r.logo_url} alt={r.name} className="h-8" /> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "name", header: ar ? "الاسم" : "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "website", header: ar ? "الموقع" : "Website", render: (r) => r.website ? <a href={r.website} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">{r.website}</a> : null },
    { key: "active", header: ar ? "مفعّل" : "Active", render: (r) => <Switch checked={r.active} onCheckedChange={async (v) => { await supabase.from("partners").update({ active: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["partners-admin"] }); }} /> },
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
        <PageHeader title={ar ? "الشركاء" : "Partners"} description={ar ? "الشركاء المؤسسيون والفنادق وشركاء السفر المعروضون على الموقع." : "Corporate partners, hotels, and travel affiliates featured on the marketing site."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{ar ? "شريك جديد" : "New Partner"}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل شريك" : "Edit partner") : (ar ? "شريك جديد" : "New partner")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div><label className="text-sm">{ar ? "الاسم" : "Name"}</label><Input name="name" defaultValue={editing?.name} required /></div>
              <div><label className="text-sm">{ar ? "رابط الشعار" : "Logo URL"}</label><Input name="logo_url" defaultValue={editing?.logo_url} type="url" /></div>
              <div><label className="text-sm">{ar ? "الموقع الإلكتروني" : "Website"}</label><Input name="website" defaultValue={editing?.website} type="url" /></div>
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
