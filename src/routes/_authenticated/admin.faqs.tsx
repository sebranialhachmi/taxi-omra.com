import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/faqs")({ component: FaqsAdmin });

function FaqsAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["faqs-admin"], queryFn: async () => (await supabase.from("faqs").select("*").order("sort_order")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const save = async (fd: FormData) => {
    const payload: any = {
      question_en: fd.get("question_en"),
      question_ar: fd.get("question_ar"),
      answer_en: fd.get("answer_en"),
      answer_ar: fd.get("answer_ar"),
      sort_order: Number(fd.get("sort_order") || 0),
      published: fd.get("published") === "on",
    };
    const res = editing ? await supabase.from("faqs").update(payload).eq("id", editing.id) : await supabase.from("faqs").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["faqs-admin"] });
  };
  const del = async (id: string) => {
    if (!confirm(ar ? "حذف؟" : "Delete?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["faqs-admin"] });
  };

  const cols: Column<any>[] = [
    { key: "question_en", header: ar ? "السؤال" : "Question", render: (r) => <div className="font-medium max-w-md">{ar ? r.question_ar : r.question_en}</div> },
    { key: "published", header: ar ? "منشور" : "Published", render: (r) => <Switch checked={r.published} onCheckedChange={async (v) => { await supabase.from("faqs").update({ published: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["faqs-admin"] }); }} /> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-2">
        <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader title={ar ? "الأسئلة الشائعة" : "FAQ"} description={ar ? "الأسئلة المتكررة على الموقع العام." : "Frequently asked questions for the public website."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" /> {ar ? "سؤال جديد" : "New FAQ"}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل السؤال" : "Edit FAQ") : (ar ? "سؤال جديد" : "New FAQ")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div><label className="text-sm">{ar ? "السؤال (إنجليزي)" : "Question (EN)"}</label><Input name="question_en" defaultValue={editing?.question_en} required /></div>
              <div><label className="text-sm">{ar ? "السؤال (عربي)" : "Question (AR)"}</label><Input name="question_ar" defaultValue={editing?.question_ar} dir="rtl" required /></div>
              <div><label className="text-sm">{ar ? "الإجابة (إنجليزي)" : "Answer (EN)"}</label><Textarea name="answer_en" defaultValue={editing?.answer_en} rows={4} required /></div>
              <div><label className="text-sm">{ar ? "الإجابة (عربي)" : "Answer (AR)"}</label><Textarea name="answer_ar" defaultValue={editing?.answer_ar} rows={4} dir="rtl" required /></div>
              <div><label className="text-sm">{ar ? "الترتيب" : "Sort order"}</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> {ar ? "منشور" : "Published"}</label>
              <DialogFooter><Button type="submit">{ar ? "حفظ" : "Save"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
