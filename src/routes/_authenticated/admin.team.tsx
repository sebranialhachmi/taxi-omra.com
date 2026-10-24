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

export const Route = createFileRoute("/_authenticated/admin/team")({ component: TeamAdmin });

const STATUSES = ["draft", "published", "archived"];

function TeamAdmin() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const q = useQuery({
    queryKey: ["admin-team", statusFilter],
    queryFn: async () => {
      let query = supabase.from("team_members").select("*").is("deleted_at", null);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      const { data, error } = await query.order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (q.data ?? []).filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.name_en || "").toLowerCase().includes(s) || (r.name_ar || "").toLowerCase().includes(s);
  });

  const save = async (fd: FormData) => {
    const payload: any = {
      slug: fd.get("slug") || null,
      name_en: fd.get("name_en"),
      name_ar: fd.get("name_ar"),
      role_en: fd.get("role_en") || null,
      role_ar: fd.get("role_ar") || null,
      bio_en: fd.get("bio_en") || null,
      bio_ar: fd.get("bio_ar") || null,
      photo_url: fd.get("photo_url") || null,
      email: fd.get("email") || null,
      phone: fd.get("phone") || null,
      linkedin_url: fd.get("linkedin_url") || null,
      meta_title: fd.get("meta_title") || null,
      meta_description: fd.get("meta_description") || null,
      sort_order: Number(fd.get("sort_order") || 0),
      status: fd.get("status") || "draft",
    };
    const res = editing
      ? await supabase.from("team_members").update(payload).eq("id", editing.id)
      : await supabase.from("team_members").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-team"] });
  };

  const softDelete = async (id: string) => {
    if (!confirm("Delete team member?")) return;
    const { error } = await supabase.from("team_members").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-team"] });
  };

  const cols: Column<any>[] = [
    { key: "name_en", header: locale === "ar" ? "الاسم" : "Name", render: (r) => (
      <div>
        <div className="font-medium">{locale === "ar" ? r.name_ar : r.name_en}</div>
        <div className="text-xs text-muted-foreground">{locale === "ar" ? r.role_ar : r.role_en}</div>
      </div>
    )},

    { key: "email", header: "Contact", render: (r) => <div className="text-xs">{r.email || "—"}<br/>{r.phone || ""}</div> },
    { key: "status", header: "Status", render: (r) => <Badge variant="outline">{r.status}</Badge> },
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
        <PageHeader title={locale === "ar" ? "فريق العمل" : "Team Members"} description={locale === "ar" ? "أعضاء الفريق المعروضون على صفحة من نحن" : "Team members displayed on the About page."} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />New</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} team member</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Slug</label><Input name="slug" defaultValue={editing?.slug} pattern="[a-z0-9-]+" /></div>
                <div><label className="text-sm">Status</label>
                  <Select name="status" defaultValue={editing?.status ?? "draft"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Name (EN) *</label><Input name="name_en" defaultValue={editing?.name_en} required /></div>
                <div><label className="text-sm">Name (AR) *</label><Input name="name_ar" defaultValue={editing?.name_ar} dir="rtl" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Role (EN)</label><Input name="role_en" defaultValue={editing?.role_en} /></div>
                <div><label className="text-sm">Role (AR)</label><Input name="role_ar" defaultValue={editing?.role_ar} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Bio (EN)</label><Textarea name="bio_en" defaultValue={editing?.bio_en} rows={4} /></div>
                <div><label className="text-sm">Bio (AR)</label><Textarea name="bio_ar" defaultValue={editing?.bio_ar} dir="rtl" rows={4} /></div>
              </div>
              <div><label className="text-sm">Photo URL</label><Input name="photo_url" type="url" defaultValue={editing?.photo_url} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm">Email</label><Input name="email" type="email" defaultValue={editing?.email} /></div>
                <div><label className="text-sm">Phone</label><Input name="phone" defaultValue={editing?.phone} /></div>
                <div><label className="text-sm">LinkedIn</label><Input name="linkedin_url" type="url" defaultValue={editing?.linkedin_url} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm">Meta title</label><Input name="meta_title" defaultValue={editing?.meta_title} /></div>
                <div><label className="text-sm">Meta description</label><Input name="meta_description" defaultValue={editing?.meta_description} /></div>
              </div>
              <div><label className="text-sm">Sort order</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
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
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filtered} columns={cols} loading={q.isLoading} />
    </div>
  );
}
