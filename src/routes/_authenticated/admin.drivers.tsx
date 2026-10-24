import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryPill, daysUntil } from "@/components/ExpiryPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/drivers")({ component: Drivers });

const DRIVER_STATUSES = ["available","offline","assigned","en_route","waiting","on_trip","on_break","vacation","suspended"];
const DRIVER_STATUS_AR: Record<string, string> = {
  available: "متاح", offline: "خارج الخدمة", assigned: "مُعيَّن", en_route: "في الطريق", waiting: "انتظار",
  on_trip: "في رحلة", on_break: "استراحة", vacation: "إجازة", suspended: "موقوف",
};

function Drivers() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const statusLabel = (s: string) => ar ? (DRIVER_STATUS_AR[s] ?? s) : s;

  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", license_number: "", license_expiry: "", vehicle_id: "" });

  const q = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => (await supabase.from("drivers").select("*, vehicle:vehicles(plate_number, make, model)").order("created_at", { ascending: false })).data ?? [],
  });
  const vehicles = useQuery({ queryKey: ["vh-lookup"], queryFn: async () => (await supabase.from("vehicles").select("id, plate_number").eq("status", "active")).data ?? [] });

  const filtered = useMemo(() => {
    const list = q.data ?? [];
    return list.filter((d: any) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(`${d.full_name} ${d.phone ?? ""} ${d.license_number ?? ""} ${d.national_id ?? ""}`.toLowerCase().includes(s))) return false;
      }
      if (expiryFilter !== "all") {
        const dates = [d.license_expiry, d.medical_expiry, d.work_permit_expiry, d.insurance_expiry].filter(Boolean);
        const mins = dates.map((x: string) => daysUntil(x)!);
        const min = mins.length ? Math.min(...mins) : Infinity;
        if (expiryFilter === "expired" && !(min < 0)) return false;
        if (expiryFilter === "soon" && !(min >= 0 && min <= 30)) return false;
      }
      return true;
    });
  }, [q.data, search, statusFilter, expiryFilter]);

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: form.full_name, phone: form.phone || null, email: form.email || null,
        license_number: form.license_number || null, license_expiry: form.license_expiry || null,
        vehicle_id: form.vehicle_id || null,
      };
      const { error } = await supabase.from("drivers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Created"); setOpen(false); setForm({ full_name: "", phone: "", email: "", license_number: "", license_expiry: "", vehicle_id: "" }); qc.invalidateQueries({ queryKey: ["drivers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns: Column<any>[] = [
    { key: "full_name", header: t("name"), render: (r) => (
      <div><div className="font-medium">{r.full_name}</div><div className="text-xs text-muted-foreground">{r.phone ?? "—"}</div></div>
    ) },
    { key: "license_number", header: ar ? "الرخصة" : "License", render: (r) => (
      <div className="space-y-1">
        <div className="text-xs">{r.license_number ?? "—"}</div>
        <ExpiryPill date={r.license_expiry} />
      </div>
    ) },
    { key: "medical_expiry", header: ar ? "الفحص الطبي" : "Medical", render: (r) => <ExpiryPill date={r.medical_expiry} /> },
    { key: "vehicle", header: t("vehicle"), render: (r) => r.vehicle ? <span className="font-mono text-xs">{r.vehicle.plate_number}</span> : "—" },
    { key: "total_trips", header: ar ? "الرحلات" : "Trips", render: (r) => <span className="tabular-nums">{r.total_trips ?? 0}</span> },
    { key: "total_earnings", header: ar ? "الإيرادات" : "Revenue", render: (r) => <span className="tabular-nums">{Number(r.total_earnings ?? 0).toFixed(2)}</span> },
    { key: "avg_rating", header: ar ? "التقييم" : "Rating", render: (r) => r.avg_rating ? Number(r.avg_rating).toFixed(2) : "—" },
    { key: "status", header: t("status"), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف السائق؟" : "Delete driver?")) return;
    const { error } = await supabase.from("drivers").update({ status: "suspended" as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(ar ? "تم التعليق" : "Suspended");
    qc.invalidateQueries({ queryKey: ["drivers"] });
  };


  const alerts = (q.data ?? []).filter((d: any) => [d.license_expiry, d.medical_expiry, d.work_permit_expiry, d.insurance_expiry].some((x: string | null) => x && daysUntil(x)! <= 30)).length;


  return (
    <div>
      <PageHeader title={t("drivers")}
        description={alerts > 0 ? (ar ? `${alerts} سائق لديه وثائق قاربت على الانتهاء` : `${alerts} drivers with expiring documents`) : undefined}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("new")}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{ar ? "سائق جديد" : `${t("new")} ${t("driver")}`}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>{t("name")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>{t("phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>{t("email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>{ar ? "رقم الرخصة" : "License #"}</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
                <div><Label>{ar ? "انتهاء الرخصة" : "License Expiry"}</Label><Input type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} /></div>
                <div className="col-span-2"><Label>{t("vehicle")}</Label>
                  <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{(vehicles.data ?? []).map((v) => <SelectItem key={v.id} value={v.id}>{v.plate_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button disabled={!form.full_name} onClick={() => create.mutate()}>{t("save")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={ar ? "ابحث بالاسم، الهاتف، الرخصة…" : "Search name, phone, license…"} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-64" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{ar ? "كل الحالات" : "All statuses"}</SelectItem>{DRIVER_STATUSES.map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل الوثائق" : "All documents"}</SelectItem>
            <SelectItem value="soon">{ar ? "تنتهي خلال 30 يوم" : "Expiring in 30 days"}</SelectItem>
            <SelectItem value="expired">{ar ? "منتهية" : "Expired"}</SelectItem>
          </SelectContent>
        </Select>
        {alerts > 0 && <div className="ms-auto inline-flex items-center gap-2 rounded-md bg-warning/15 text-warning-foreground px-3 py-2 text-xs"><AlertTriangle className="h-3.5 w-3.5" />{ar ? `${alerts} وثائق قرب انتهائها` : `${alerts} with expiring docs`}</div>}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        loading={q.isLoading}
        onRowClick={(r) => navigate({ to: "/admin/drivers/$id" as any, params: { id: r.id } as any })}
        actions={(r) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Select value={r.status} onValueChange={async (v) => {
              const { error } = await supabase.from("drivers").update({ status: v as any }).eq("id", r.id);
              if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["drivers"] });
            }}>
              <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{DRIVER_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="icon" variant="ghost" title={ar ? "تعديل" : "Edit"} onClick={() => navigate({ to: "/admin/drivers/$id" as any, params: { id: r.id } as any })}><Edit className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" title={ar ? "حذف" : "Delete"} onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />
    </div>
  );
}

