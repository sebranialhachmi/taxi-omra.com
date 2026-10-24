import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/whatsapp-templates")({ component: WhatsAppTemplatesAdmin });

const CATEGORIES = ["operational", "financial", "marketing"];

function WhatsAppTemplatesAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const CAT_LABEL: Record<string, string> = ar
    ? { operational: "تشغيلية", financial: "مالية", marketing: "تسويقية" }
    : { operational: "Operational", financial: "Financial", marketing: "Marketing" };

  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wa-templates-admin"],
    queryFn: async () => (await supabase.from("whatsapp_templates").select("*").order("sort_order")).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [category, setCategory] = useState("operational");

  const save = async (fd: FormData) => {
    const vars = String(fd.get("variables") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const payload: any = {
      code: fd.get("code"),
      name: fd.get("name"),
      category,
      body_en: fd.get("body_en"),
      body_ar: fd.get("body_ar"),
      variables: vars,
      is_active: fd.get("is_active") === "on",
      sort_order: Number(fd.get("sort_order") || 0),
    };
    const res = editing
      ? await supabase.from("whatsapp_templates").update(payload).eq("id", editing.id)
      : await supabase.from("whatsapp_templates").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(ar ? "تم الحفظ" : "Saved");
    setOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["wa-templates-admin"] });
    qc.invalidateQueries({ queryKey: ["wa-templates-active"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف؟" : "Delete?")) return;
    const { error } = await supabase.from("whatsapp_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["wa-templates-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "name", header: ar ? "القالب" : "Template", render: (r) => <div><div className="font-medium">{r.name}</div><code className="text-xs text-muted-foreground">{r.code}</code></div> },
    { key: "category", header: ar ? "الفئة" : "Category", render: (r) => <span className="text-xs uppercase tracking-wider text-muted-foreground">{CAT_LABEL[r.category] ?? r.category}</span> },
    { key: "variables", header: ar ? "المتغيرات" : "Variables", render: (r) => <span className="text-xs">{(r.variables ?? []).map((v: string) => `{{${v}}}`).join(" ")}</span> },
    { key: "is_active", header: ar ? "مفعّل" : "Active", render: (r) => (
      <Switch checked={r.is_active} onCheckedChange={async (v) => {
        await supabase.from("whatsapp_templates").update({ is_active: v }).eq("id", r.id);
        qc.invalidateQueries({ queryKey: ["wa-templates-admin"] });
        qc.invalidateQueries({ queryKey: ["wa-templates-active"] });
      }} />
    ) },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setCategory(r.category); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader
          title={ar ? "قوالب واتساب" : "WhatsApp Templates"}
          description={ar ? "رسائل قابلة لإعادة الاستخدام تُرسل من الحجوزات والفواتير والحملات. تستخدم {{متغيرات}} تُستبدل عند الإرسال." : "Reusable messages sent from bookings, invoices, and campaigns. Uses {{variables}} substituted at send time."}
        />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setCategory("operational"); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{ar ? "قالب جديد" : "New Template"}</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل القالب" : "Edit template") : (ar ? "قالب جديد" : "New template")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "الرمز (فريد)" : "Code (unique)"}</label><Input name="code" defaultValue={editing?.code} required pattern="[a-z0-9_]+" /></div>
                <div><label className="text-sm">{ar ? "الاسم" : "Name"}</label><Input name="name" defaultValue={editing?.name} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">{ar ? "الفئة" : "Category"}</label>
                  <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CAT_LABEL[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm">{ar ? "الترتيب" : "Sort order"}</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
              </div>
              <div><label className="text-sm">{ar ? "النص (إنجليزي)" : "Body (EN)"}</label><Textarea name="body_en" defaultValue={editing?.body_en} rows={6} required /></div>
              <div><label className="text-sm">{ar ? "النص (عربي)" : "Body (AR)"}</label><Textarea name="body_ar" defaultValue={editing?.body_ar} rows={6} dir="rtl" required /></div>
              <div><label className="text-sm">{ar ? "المتغيرات (مفصولة بفواصل، مثلاً: name,code,pickup)" : "Variables (comma-separated, e.g. name,code,pickup)"}</label><Input name="variables" defaultValue={editing?.variables?.join(", ") ?? ""} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> {ar ? "مفعّل" : "Active"}</label>
              <DialogFooter><Button type="submit">{ar ? "حفظ" : "Save"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
