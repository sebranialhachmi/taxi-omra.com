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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VehicleCategoriesPanel } from "@/components/admin/VehicleCategoriesPanel";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/fleet")({ component: Fleet });

const VEHICLE_STATUSES = ["active","assigned","on_trip","reserved","maintenance","out_of_service","retired"];

const emptyForm = { plate_number: "", internal_code: "", make: "", model: "", year: "", color: "", seats: "4", category_id: "" };

function Fleet() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const q = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("*, category:vehicle_categories(code)").order("created_at", { ascending: false })).data ?? [],
  });
  const cats = useQuery({ queryKey: ["cats"], queryFn: async () => (await supabase.from("vehicle_categories").select("*").order("sort_order")).data ?? [] });

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      plate_number: v.plate_number ?? "",
      internal_code: v.internal_code ?? "",
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year?.toString() ?? "",
      color: v.color ?? "",
      seats: (v.seats ?? 4).toString(),
      category_id: v.category_id ?? "",
    });
    setOpen(true);
  };

  const filtered = useMemo(() => {
    const list = q.data ?? [];
    return list.filter((v: any) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(`${v.plate_number} ${v.internal_code ?? ""} ${v.vin ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.toLowerCase().includes(s))) return false;
      }
      if (expiryFilter !== "all") {
        const dates = [v.registration_expiry, v.insurance_expiry, v.inspection_expiry].filter(Boolean);
        const mins = dates.map((x: string) => daysUntil(x)!);
        const min = mins.length ? Math.min(...mins) : Infinity;
        if (expiryFilter === "expired" && !(min < 0)) return false;
        if (expiryFilter === "soon" && !(min >= 0 && min <= 30)) return false;
        if (expiryFilter === "maint" && !(v.next_maintenance_date && daysUntil(v.next_maintenance_date)! <= 14)) return false;
      }
      return true;
    });
  }, [q.data, search, statusFilter, expiryFilter]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        plate_number: form.plate_number,
        internal_code: form.internal_code || null,
        make: form.make || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        color: form.color || null,
        seats: Number(form.seats || 4),
        category_id: form.category_id || null,
      };
      const res = editing
        ? await supabase.from("vehicles").update(payload).eq("id", editing.id)
        : await supabase.from("vehicles").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم الحفظ" : "Saved");
      setOpen(false); setEditing(null); setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف المركبة؟" : "Delete vehicle?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const columns: Column<any>[] = [
    { key: "plate_number", header: ar ? "اللوحة" : "Plate", render: (r) => (
      <div><div className="font-mono font-medium">{r.plate_number}</div>{r.internal_code && <div className="text-[10px] text-muted-foreground">#{r.internal_code}</div>}</div>
    ) },
    { key: "make", header: ar ? "المركبة" : "Vehicle", render: (r) => (
      <div><div className="text-sm">{`${r.make ?? ""} ${r.model ?? ""}`.trim() || "—"}</div><div className="text-xs text-muted-foreground">{r.year ?? ""} · {r.color ?? ""}</div></div>
    ) },
    { key: "category", header: ar ? "الفئة" : "Category", render: (r) => r.category?.code ?? "—" },
    { key: "current_mileage", header: ar ? "المسافة" : "Mileage", render: (r) => <span className="tabular-nums">{r.current_mileage ? Number(r.current_mileage).toLocaleString() : "—"}</span> },
    { key: "next_maintenance_date", header: ar ? "الصيانة القادمة" : "Next service", render: (r) => <ExpiryPill date={r.next_maintenance_date} /> },
    { key: "expiries", header: ar ? "المستندات" : "Compliance", render: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.registration_expiry && <ExpiryPill date={r.registration_expiry} label={ar ? "استمارة" : "Reg"} />}
        {r.insurance_expiry && <ExpiryPill date={r.insurance_expiry} label={ar ? "تأمين" : "Ins"} />}
        {r.inspection_expiry && <ExpiryPill date={r.inspection_expiry} label={ar ? "فحص" : "Insp"} />}
        {!r.registration_expiry && !r.insurance_expiry && !r.inspection_expiry && <span className="text-xs text-muted-foreground">—</span>}
      </div>
    ) },
    { key: "status", header: ar ? "الحالة" : "Status", render: (r) => <StatusBadge value={r.status} /> },
  ];

  const alerts = (q.data ?? []).filter((v: any) =>
    [v.registration_expiry, v.insurance_expiry, v.inspection_expiry].some((x: string | null) => x && daysUntil(x)! <= 30) ||
    (v.next_maintenance_date && daysUntil(v.next_maintenance_date)! <= 14)
  ).length;

  return (
    <div>
      <PageHeader title={t("fleet")}
        description={alerts > 0 ? (ar ? `${alerts} مركبات تحتاج انتباه` : `${alerts} vehicles need attention`) : undefined}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 me-1" />{ar ? "مركبة جديدة" : "New Vehicle"}</Button>}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل مركبة" : "Edit vehicle") : (ar ? "مركبة جديدة" : "New vehicle")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{ar ? "رقم اللوحة" : "Plate"} *</Label><Input value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} /></div>
            <div><Label>{ar ? "الكود الداخلي" : "Internal code"}</Label><Input value={form.internal_code} onChange={(e) => setForm({ ...form, internal_code: e.target.value })} /></div>
            <div><Label>{ar ? "الشركة الصانعة" : "Make"}</Label><Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
            <div><Label>{ar ? "الطراز" : "Model"}</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            <div><Label>{ar ? "السنة" : "Year"}</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
            <div><Label>{ar ? "اللون" : "Color"}</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            <div><Label>{ar ? "المقاعد" : "Seats"}</Label><Input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></div>
            <div><Label>{ar ? "الفئة" : "Category"}</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button disabled={!form.plate_number} onClick={() => save.mutate()}>{ar ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">{ar ? "المركبات" : "Vehicles"}</TabsTrigger>
          <TabsTrigger value="categories">{ar ? "الفئات" : "Categories"}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <VehicleCategoriesPanel onAddVehicle={openNew} />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={ar ? "بحث عن لوحة، رقم هيكل، شركة…" : "Search plate, VIN, make…"} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-64" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{ar ? "كل الحالات" : "All statuses"}</SelectItem>{VEHICLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
                <SelectItem value="soon">{ar ? "مستندات قريبة الانتهاء (30 يوم)" : "Docs expiring 30d"}</SelectItem>
                <SelectItem value="expired">{ar ? "مستندات منتهية" : "Docs expired"}</SelectItem>
                <SelectItem value="maint">{ar ? "صيانة مستحقة" : "Maintenance due"}</SelectItem>
              </SelectContent>
            </Select>
            {alerts > 0 && <div className="ms-auto inline-flex items-center gap-2 rounded-md bg-warning/15 text-warning-foreground px-3 py-2 text-xs"><AlertTriangle className="h-3.5 w-3.5" />{ar ? `${alerts} تنبيه` : `${alerts} alerts`}</div>}
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            loading={q.isLoading}
            onRowClick={(r) => navigate({ to: "/admin/fleet/$id" as any, params: { id: r.id } as any })}
            actions={(r) => (
              <div className="flex items-center gap-1">
                <Select value={r.status} onValueChange={async (v) => {
                  const { error } = await supabase.from("vehicles").update({ status: v as any }).eq("id", r.id);
                  if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["vehicles"] });
                }}>
                  <SelectTrigger className="w-32 h-8" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                  <SelectContent>{VEHICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); del(r.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
