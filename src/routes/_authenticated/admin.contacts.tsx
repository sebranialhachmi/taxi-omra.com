import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Trash2, ExternalLink, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { WhatsAppSendMenu } from "@/components/WhatsAppSendMenu";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/contacts")({ component: ContactsAdmin });

const STATUSES = ["new", "in_progress", "converted", "closed", "spam"] as const;

function ContactsAdmin() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const STATUS_AR: Record<string, string> = {
    new: "جديد", in_progress: "قيد المعالجة", converted: "تم التحويل", closed: "مغلق", spam: "مزعج",
  };
  const statusLabel = (s: string) => STATUS_AR[s] ?? s.replace("_", " ");

  const q = useQuery({
    queryKey: ["contacts-admin"],
    queryFn: async () => (await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const staff = useQuery({
    queryKey: ["staff-lookup"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").order("full_name")).data ?? [],
  });

  const updateOne = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("contact_submissions").update({ ...patch, handled_at: new Date().toISOString() } as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["contacts-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm("حذف الطلب؟")) return;
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["contacts-admin"] });
  };

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    const s = search.trim().toLowerCase();
    return rows.filter((r: any) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!s) return true;
      return [r.name, r.email, r.phone, r.subject, r.message].filter(Boolean).some((v: string) => v.toLowerCase().includes(s));
    });
  }, [q.data, search, statusFilter]);

  const exportCsv = () => {
    downloadCsv(`contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((r: any) => ({
        created_at: r.created_at, name: r.name, email: r.email, phone: r.phone,
        subject: r.subject, message: r.message, status: r.status,
        source: r.source, page_url: r.page_url, notes: r.notes,
      })));
    toast.success(`تم تصدير ${filtered.length} صف`);
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      new: "bg-primary/15 text-primary",
      in_progress: "bg-yellow-500/15 text-yellow-700",
      converted: "bg-green-600/15 text-green-700",
      closed: "bg-muted text-muted-foreground",
      spam: "bg-destructive/15 text-destructive",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[s]}`}>{statusLabel(s)}</span>;
  };

  const cols: Column<any>[] = [
    { key: "when", header: "التاريخ", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</span> },
    { key: "who", header: "من", render: (r) => (
      <div>
        <div className="font-medium">{r.name}</div>
        <div className="text-xs text-muted-foreground flex gap-3">
          {r.email && <a href={`mailto:${r.email}`}><Mail className="inline h-3 w-3 me-1" />{r.email}</a>}
          {r.phone && <a href={`tel:${r.phone}`}><Phone className="inline h-3 w-3 me-1" />{r.phone}</a>}
        </div>
      </div>
    ) },
    { key: "msg", header: "الرسالة", render: (r) => <span className="text-sm line-clamp-2 max-w-md">{r.message}</span> },
    { key: "status", header: "الحالة", render: (r) => badge(r.status) },
    { key: "assigned", header: "المسؤول", render: (r) => {
      const p = (staff.data ?? []).find((x: any) => x.id === r.assigned_to);
      return <span className="text-xs">{p?.full_name ?? p?.email ?? "—"}</span>;
    } },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => setSelected(r)}><ExternalLink className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  const counts = STATUSES.map((s) => ({ s, n: (q.data ?? []).filter((r: any) => r.status === s).length }));

  return (
    <div>
      <PageHeader title="طلبات التواصل" description="الطلبات الواردة — عيّن موظفاً، ردّ عبر واتساب/البريد، وحوّلها إلى حجوزات."
        actions={<Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 me-1" />CSV</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {counts.map((c) => (
          <button key={c.s} onClick={() => setStatusFilter(statusFilter === c.s ? "all" : c.s)}
            className={`rounded-2xl border p-4 text-start transition ${statusFilter === c.s ? "border-gold bg-gold/5" : "border-border bg-card"}`}>
            <div className="text-[10px] tracking-wider text-muted-foreground">{statusLabel(c.s)}</div>
            <div className="font-display text-3xl mt-1">{c.n}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث…" className="ps-9 w-80" />
        </div>
        <div className="text-sm text-muted-foreground self-center">{filtered.length} من {(q.data ?? []).length}</div>
      </div>

      <DataTable data={filtered} columns={cols} loading={q.isLoading} onRowClick={(r) => setSelected(r)} />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">{selected.name}{badge(selected.status)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  {selected.email && <a href={`mailto:${selected.email}`}><Mail className="inline h-3 w-3 me-1" />{selected.email}</a>}
                  {selected.phone && <a href={`tel:${selected.phone}`}><Phone className="inline h-3 w-3 me-1" />{selected.phone}</a>}
                </div>
                {selected.page_url && <Badge variant="outline" className="text-xs">{selected.page_url}</Badge>}
                <div className="rounded-lg border border-border bg-muted/30 p-4 whitespace-pre-line">{selected.message}</div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs tracking-wider text-muted-foreground">الحالة</label>
                    <Select defaultValue={selected.status} onValueChange={(v) => updateOne(selected.id, { status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs tracking-wider text-muted-foreground">المسؤول</label>
                    <Select defaultValue={selected.assigned_to ?? "unassigned"} onValueChange={(v) => updateOne(selected.id, { assigned_to: v === "unassigned" ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">بدون تعيين</SelectItem>
                        {(staff.data ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-wider text-muted-foreground">ملاحظات داخلية</label>
                  <Textarea defaultValue={selected.notes ?? ""} rows={3} onBlur={(e) => updateOne(selected.id, { notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="flex-wrap gap-2">
                <WhatsAppSendMenu phone={selected.phone} contactId={selected.id}
                  vars={{ customer_name: selected.name, message: selected.message ?? "" }} />
                {selected.email && <Button asChild variant="outline"><a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject ?? "")}`}><Mail className="h-4 w-4 me-1" />رد عبر البريد</a></Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
