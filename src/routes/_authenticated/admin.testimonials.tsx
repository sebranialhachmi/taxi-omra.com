import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { toast } from "sonner";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({ component: TestimonialsAdmin });

const STATUSES = ["draft", "published", "archived"];

function TestimonialsAdmin() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const q = useQuery({
    queryKey: ["admin-testimonials", statusFilter],
    queryFn: async () => {
      let query = supabase.from("testimonials").select("*").is("deleted_at", null);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      const { data, error } = await query.order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (q.data ?? []).filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.name || "").toLowerCase().includes(s) || (r.quote_en || "").toLowerCase().includes(s) || (r.quote_ar || "").toLowerCase().includes(s);
  });

  const save = async (fd: FormData) => {
    const payload: any = {
      name: fd.get("name"),
      role_en: fd.get("role_en") || null,
      role_ar: fd.get("role_ar") || null,
      location_en: fd.get("location_en") || null,
      location_ar: fd.get("location_ar") || null,
      quote_en: fd.get("quote_en") || null,
      quote_ar: fd.get("quote_ar") || null,
      rating: Number(fd.get("rating") || 5),
      avatar_url: fd.get("avatar_url") || null,
      sort_order: Number(fd.get("sort_order") || 0),
      status: fd.get("status") || "draft",
      published: fd.get("status") === "published",
    };
    const res = editing
      ? await supabase.from("testimonials").update(payload).eq("id", editing.id)
      : await supabase.from("testimonials").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
  };

  const softDelete = async (id: string) => {
    if (!confirm("Delete testimonial?")) return;
    const { error } = await supabase.from("testimonials").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
  };

  const cols: Column<any>[] = [
    { key: "name", header: locale === "ar" ? "الاسم" : "Name", render: (r) => (
      <div className="flex items-center gap-3">
        {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-muted" />}
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground">{locale === "ar" ? r.role_ar : r.role_en}</div>
        </div>
      </div>
    )},
    { key: "quote", header: locale === "ar" ? "الاقتباس" : "Quote", render: (r) => <span className="text-sm line-clamp-2 max-w-md">{locale === "ar" ? r.quote_ar : r.quote_en}</span> },
    { key: "rating", header: "★", render: (r) => <span>{"★".repeat(r.rating || 0)}</span> },
    { key: "status", header: locale === "ar" ? "الحالة" : "Status", render: (r) => <Badge variant="outline">{r.status}</Badge> },
    { key: "sort_order", header: "#", render: (r) => <span className="text-xs">{r.sort_order}</span> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => softDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader title={locale === "ar" ? "الشهادات" : "Testimonials"} description={locale === "ar" ? "شهادات العملاء المعروضة على الموقع" : "Customer testimonials displayed on the public site."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{locale === "ar" ? "جديد" : "New"}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} testimonial</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Name *</label><Input name="name" defaultValue={editing?.name} required /></div>
                <div><label className="text-sm">Rating</label><Input name="rating" type="number" min={1} max={5} defaultValue={editing?.rating ?? 5} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Role (EN)</label><Input name="role_en" defaultValue={editing?.role_en} /></div>
                <div><label className="text-sm">Role (AR)</label><Input name="role_ar" defaultValue={editing?.role_ar} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Location (EN)</label><Input name="location_en" defaultValue={editing?.location_en} /></div>
                <div><label className="text-sm">Location (AR)</label><Input name="location_ar" defaultValue={editing?.location_ar} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Quote (EN)</label><Textarea name="quote_en" defaultValue={editing?.quote_en} rows={3} /></div>
                <div><label className="text-sm">Quote (AR)</label><Textarea name="quote_ar" defaultValue={editing?.quote_ar} dir="rtl" rows={3} /></div>
              </div>
              <div><label className="text-sm">Avatar URL</label><Input name="avatar_url" type="url" defaultValue={editing?.avatar_url} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Sort order</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
                <div><label className="text-sm">Status</label>
                  <Select name="status" defaultValue={editing?.status ?? "draft"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filtered} columns={cols} loading={q.isLoading} />
    </div>
  );
}
