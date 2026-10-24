import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryPill, daysUntil } from "@/components/ExpiryPill";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Download, Trash2, Save, Wrench, ShieldAlert, Gauge, Fuel, Cog, Car } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/fleet/$id")({ component: VehicleProfile });

const VEHICLE_STATUSES = ["active","assigned","on_trip","reserved","maintenance","out_of_service","retired"];
const VEHICLE_DOC_KINDS = ["registration","insurance","permit","inspection","other"] as const;
const MAINT_KINDS = ["oil_change","tire","brake","battery","inspection","repair","service","other"] as const;

const DOC_KIND_AR: Record<string, string> = { registration: "استمارة", insurance: "تأمين", permit: "تصريح", inspection: "فحص", other: "أخرى" };
const MAINT_KIND_AR: Record<string, string> = { oil_change: "تغيير زيت", tire: "إطارات", brake: "فرامل", battery: "بطارية", inspection: "فحص", repair: "إصلاح", service: "صيانة", other: "أخرى" };
const FUEL_AR: Record<string, string> = { petrol: "بنزين", diesel: "ديزل", hybrid: "هجين", electric: "كهرباء", lpg: "غاز مسال", cng: "غاز طبيعي" };
const TRANS_AR: Record<string, string> = { automatic: "أوتوماتيك", manual: "عادي" };

function VehicleProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const tr = (k: keyof typeof T) => (ar ? T[k].ar : T[k].en);

  const q = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => (await supabase.from("vehicles").select("*, category:vehicle_categories(code, name_en)").eq("id", id).maybeSingle()).data,
  });
  const maint = useQuery({
    queryKey: ["vehicle-maint", id],
    queryFn: async () => (await supabase.from("vehicle_maintenance").select("*").eq("vehicle_id", id).order("service_date", { ascending: false })).data ?? [],
  });
  const docs = useQuery({
    queryKey: ["vehicle-docs", id],
    queryFn: async () => (await supabase.from("vehicle_documents").select("*").eq("vehicle_id", id).order("expires_on", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const assignments = useQuery({
    queryKey: ["vehicle-assignments", id],
    queryFn: async () => (await supabase.from("driver_vehicle_assignments").select("*, driver:drivers(id, full_name)").eq("vehicle_id", id).order("started_at", { ascending: false }).limit(50)).data ?? [],
  });
  const trips = useQuery({
    queryKey: ["vehicle-trips", id],
    queryFn: async () => (await supabase.from("bookings").select("id, code, status, total_fare, pickup_at, pickup_location, dropoff_location, driver:drivers(full_name)").eq("vehicle_id", id).order("pickup_at", { ascending: false }).limit(100)).data ?? [],
  });

  if (q.isLoading) return <div className="p-8 text-sm text-muted-foreground">{ar ? "جاري التحميل…" : "Loading…"}</div>;
  if (!q.data) return <div className="p-8"><Button variant="outline" onClick={() => navigate({ to: "/admin/fleet" })}><ArrowLeft className="h-4 w-4 me-2" />{ar ? "رجوع" : "Back"}</Button><div className="mt-4">{ar ? "المركبة غير موجودة" : "Vehicle not found"}</div></div>;

  const v = q.data as any;
  const expiring = [
    { key: ar ? "استمارة" : "Registration", date: v.registration_expiry },
    { key: ar ? "تأمين" : "Insurance", date: v.insurance_expiry },
    { key: ar ? "فحص" : "Inspection", date: v.inspection_expiry },
    ...(docs.data ?? []).map((x: any) => ({ key: x.title || (ar ? DOC_KIND_AR[x.kind] ?? x.kind : x.kind), date: x.expires_on })),
  ].filter((x) => x.date && daysUntil(x.date)! <= 30);

  const maintDue = v.next_maintenance_date && daysUntil(v.next_maintenance_date)! <= 14;
  const totalMaintCost = (maint.data ?? []).reduce((s: number, m: any) => s + Number(m.cost ?? 0), 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/admin/fleet"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1" />{ar ? "الأسطول" : "Fleet"}</Button></Link>
      </div>

      <PageHeader
        eyebrow={ar ? "ملف المركبة" : "Vehicle profile"}
        title={`${v.plate_number} · ${v.make ?? ""} ${v.model ?? ""}`}
        description={v.internal_code ? `${ar ? "كود داخلي" : "Internal"} ${v.internal_code}${v.vin ? " · VIN " + v.vin : ""}` : v.vin ? `VIN ${v.vin}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={v.status} />
            <EditVehicleDialog vehicle={v} onSaved={() => qc.invalidateQueries({ queryKey: ["vehicle", id] })} ar={ar} />
          </div>
        }
      />

      {(expiring.length > 0 || maintDue) && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-warning-foreground mt-0.5" />
            <div className="min-w-0 flex-1 space-y-2">
              {maintDue && <div className="text-sm">{ar ? "الصيانة القادمة مستحقة" : "Next maintenance due"} <ExpiryPill date={v.next_maintenance_date} /></div>}
              {expiring.length > 0 && (
                <div>
                  <div className="text-sm font-medium">{ar ? "مستندات قاربت على الانتهاء" : "Expiring documents"}</div>
                  <div className="mt-2 flex flex-wrap gap-2">{expiring.map((e, i) => <ExpiryPill key={i} date={e.date} label={e.key} />)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6 mb-6">
        <StatCard label={ar ? "الفئة" : "Category"} value={v.category?.code ?? "—"} icon={Car} />
        <StatCard label={ar ? "المقاعد" : "Seats"} value={v.seats ?? 4} icon={Car} />
        <StatCard label={ar ? "الوقود" : "Fuel"} value={ar ? (FUEL_AR[v.fuel_type] ?? "—") : (v.fuel_type ?? "—")} icon={Fuel} />
        <StatCard label={ar ? "ناقل الحركة" : "Transmission"} value={ar ? (TRANS_AR[v.transmission] ?? "—") : (v.transmission ?? "—")} icon={Cog} />
        <StatCard label={ar ? "المسافة" : "Mileage"} value={v.current_mileage ? Number(v.current_mileage).toLocaleString() : "—"} icon={Gauge} />
        <StatCard label={ar ? "تكلفة الصيانة" : "Maint. cost"} value={totalMaintCost.toFixed(2)} icon={Wrench} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{ar ? "نظرة عامة" : "Overview"}</TabsTrigger>
          <TabsTrigger value="maintenance">{ar ? "الصيانة" : "Maintenance"}</TabsTrigger>
          <TabsTrigger value="documents">{ar ? "المستندات" : "Documents"}</TabsTrigger>
          <TabsTrigger value="assignments">{ar ? "السائقون" : "Drivers"}</TabsTrigger>
          <TabsTrigger value="trips">{ar ? "الرحلات" : "Trips"}</TabsTrigger>
          <TabsTrigger value="timeline">{ar ? "السجل" : "Timeline"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card><CardContent className="p-4 space-y-2 text-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{ar ? "تفاصيل المركبة" : "Vehicle details"}</div>
            <Row k={ar ? "اللوحة" : "Plate"} v={v.plate_number} />
            <Row k={ar ? "الكود الداخلي" : "Internal code"} v={v.internal_code} />
            <Row k="VIN" v={v.vin} />
            <Row k={ar ? "الصانع / الطراز" : "Make / Model"} v={`${v.make ?? ""} ${v.model ?? ""}`.trim() || null} />
            <Row k={ar ? "السنة" : "Year"} v={v.year} />
            <Row k={ar ? "اللون" : "Color"} v={v.color} />
            <Row k={ar ? "المقاعد" : "Seats"} v={v.seats} />
            <Row k={ar ? "الوقود" : "Fuel"} v={ar ? FUEL_AR[v.fuel_type] : v.fuel_type} />
            <Row k={ar ? "ناقل الحركة" : "Transmission"} v={ar ? TRANS_AR[v.transmission] : v.transmission} />
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-2 text-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{ar ? "الامتثال" : "Compliance"}</div>
            <div className="flex justify-between items-center py-1 border-b border-border/40"><span className="text-muted-foreground">{ar ? "الاستمارة" : "Registration"}</span><ExpiryPill date={v.registration_expiry} /></div>
            <div className="flex justify-between items-center py-1 border-b border-border/40"><span className="text-muted-foreground">{ar ? "التأمين" : "Insurance"}</span><ExpiryPill date={v.insurance_expiry} /></div>
            <div className="flex justify-between items-center py-1 border-b border-border/40"><span className="text-muted-foreground">{ar ? "الفحص" : "Inspection"}</span><ExpiryPill date={v.inspection_expiry} /></div>
            <Row k={ar ? "المسافة الحالية" : "Current mileage"} v={v.current_mileage ? Number(v.current_mileage).toLocaleString() + " km" : null} />
            <Row k={ar ? "الصيانة القادمة (كم)" : "Next maint. km"} v={v.next_maintenance_mileage ? Number(v.next_maintenance_mileage).toLocaleString() + " km" : null} />
            <div className="flex justify-between items-center py-1"><span className="text-muted-foreground">{ar ? "الصيانة القادمة" : "Next maintenance"}</span><ExpiryPill date={v.next_maintenance_date} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenancePanel vehicleId={id} rows={maint.data ?? []} onChange={() => { qc.invalidateQueries({ queryKey: ["vehicle-maint", id] }); qc.invalidateQueries({ queryKey: ["vehicle", id] }); }} ar={ar} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <VehicleDocsPanel vehicleId={id} docs={docs.data ?? []} onChange={() => qc.invalidateQueries({ queryKey: ["vehicle-docs", id] })} ar={ar} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card><CardContent className="p-0">
            {(assignments.data ?? []).length === 0 && <div className="p-6 text-sm text-muted-foreground">{ar ? "لا يوجد سجل سائقين." : "No driver history."}</div>}
            <div className="divide-y">
              {(assignments.data ?? []).map((a: any) => (
                <div key={a.id} className="p-3 flex items-center justify-between">
                  <div>
                    <Link to={"/admin/drivers/$id" as any} params={{ id: a.driver?.id } as any} className="text-sm font-medium hover:text-gold">{a.driver?.full_name ?? "—"}</Link>
                    <div className="text-xs text-muted-foreground">{new Date(a.started_at).toLocaleString()} → {a.ended_at ? new Date(a.ended_at).toLocaleString() : (ar ? "حالياً" : "current")}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          <Card><CardContent className="p-0">
            {(trips.data ?? []).length === 0 && <div className="p-6 text-sm text-muted-foreground">{ar ? "لا توجد رحلات." : "No trips."}</div>}
            <div className="divide-y">
              {(trips.data ?? []).map((b: any) => (
                <div key={b.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-mono">{b.code ?? b.id.slice(0,8)}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.pickup_location} → {b.dropoff_location}</div>
                    {b.driver?.full_name && <div className="text-xs">{b.driver.full_name}</div>}
                  </div>
                  <div className="text-end shrink-0">
                    <StatusBadge value={b.status} />
                    <div className="text-xs text-muted-foreground mt-1">{b.pickup_at ? new Date(b.pickup_at).toLocaleString() : "—"}</div>
                    <div className="text-xs">{Number(b.total_fare ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card><CardContent className="p-4">
            <ActivityTimeline entityType="vehicle" entityId={id} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const T = {
  loading: { en: "Loading…", ar: "جاري التحميل…" },
} as const;

function Row({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between gap-3 py-1 border-b border-border/40 last:border-0"><span className="text-muted-foreground">{k}</span><span className="truncate max-w-[60%] text-end">{v || "—"}</span></div>;
}

function MaintenancePanel({ vehicleId, rows, onChange, ar }: { vehicleId: string; rows: any[]; onChange: () => void; ar: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ kind: "service", title: "", service_date: new Date().toISOString().slice(0,10), mileage: "", cost: "", vendor: "", next_due_date: "", next_due_mileage: "", notes: "" });

  const save = async () => {
    const { error } = await supabase.from("vehicle_maintenance").insert({
      vehicle_id: vehicleId,
      kind: f.kind as any,
      description: f.title || null,
      service_date: f.service_date || new Date().toISOString().slice(0,10),
      mileage: f.mileage ? Number(f.mileage) : null,
      cost: f.cost ? Number(f.cost) : 0,
      vendor: f.vendor || null,
      next_due_date: f.next_due_date || null,
      next_due_mileage: f.next_due_mileage ? Number(f.next_due_mileage) : null,
      notes: f.notes || null,
    });
    if (error) return toast.error(error.message);
    const patch: any = {};
    if (f.mileage) patch.current_mileage = Number(f.mileage);
    if (f.next_due_date) patch.next_maintenance_date = f.next_due_date;
    if (f.next_due_mileage) patch.next_maintenance_mileage = Number(f.next_due_mileage);
    if (Object.keys(patch).length) await supabase.from("vehicles").update(patch).eq("id", vehicleId);
    toast.success(ar ? "تم التسجيل" : "Recorded");
    setOpen(false);
    setF({ kind: "service", title: "", service_date: new Date().toISOString().slice(0,10), mileage: "", cost: "", vendor: "", next_due_date: "", next_due_mileage: "", notes: "" });
    onChange();
  };

  const del = async (rowId: string) => {
    if (!confirm(ar ? "حذف هذا السجل؟" : "Delete this record?")) return;
    const { error } = await supabase.from("vehicle_maintenance").delete().eq("id", rowId);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">{ar ? "سجل الصيانة" : "Maintenance history"}</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Wrench className="h-3.5 w-3.5 me-1" />{ar ? "تسجيل صيانة" : "Log service"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{ar ? "تسجيل صيانة" : "Log maintenance"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{ar ? "النوع" : "Kind"}</Label>
                <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MAINT_KINDS.map(k => <SelectItem key={k} value={k}>{ar ? MAINT_KIND_AR[k] : k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{ar ? "تاريخ التنفيذ" : "Performed on"}</Label><Input type="date" value={f.service_date} onChange={(e) => setF({ ...f, service_date: e.target.value })} /></div>
              <div className="col-span-2"><Label>{ar ? "العنوان" : "Title"}</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>{ar ? "المسافة (كم)" : "Mileage (km)"}</Label><Input type="number" value={f.mileage} onChange={(e) => setF({ ...f, mileage: e.target.value })} /></div>
              <div><Label>{ar ? "التكلفة" : "Cost"}</Label><Input type="number" step="0.01" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} /></div>
              <div className="col-span-2"><Label>{ar ? "المورّد" : "Vendor"}</Label><Input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></div>
              <div><Label>{ar ? "تاريخ الصيانة القادمة" : "Next service date"}</Label><Input type="date" value={f.next_due_date} onChange={(e) => setF({ ...f, next_due_date: e.target.value })} /></div>
              <div><Label>{ar ? "الصيانة القادمة (كم)" : "Next service km"}</Label><Input type="number" value={f.next_due_mileage} onChange={(e) => setF({ ...f, next_due_mileage: e.target.value })} /></div>
              <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={save}><Save className="h-4 w-4 me-1" />{ar ? "حفظ" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {rows.length === 0 ? <div className="text-sm text-muted-foreground py-3">{ar ? "لا توجد سجلات صيانة بعد." : "No maintenance records yet."}</div> :
        <div className="divide-y">
          {rows.map((m) => (
            <div key={m.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{m.description || (ar ? MAINT_KIND_AR[m.kind] : m.kind)} <span className="text-muted-foreground text-xs">· {ar ? MAINT_KIND_AR[m.kind] : m.kind}</span></div>
                <div className="text-xs text-muted-foreground">{new Date(m.service_date).toLocaleDateString()} {m.vendor ? `· ${m.vendor}` : ""} {m.mileage ? `· ${Number(m.mileage).toLocaleString()} km` : ""}</div>
                {m.notes && <div className="text-xs mt-1">{m.notes}</div>}
              </div>
              <div className="text-end shrink-0">
                <div className="text-sm tabular-nums">{Number(m.cost ?? 0).toFixed(2)}</div>
                <Button variant="ghost" size="icon" onClick={() => del(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      }
    </CardContent></Card>
  );
}

function VehicleDocsPanel({ vehicleId, docs, onChange, ar }: { vehicleId: string; docs: any[]; onChange: () => void; ar: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ kind: "registration", title: "", document_number: "", issued_on: "", expires_on: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setUploading(true);
    try {
      let file_path: string | null = null;
      if (file) {
        const path = `vehicles/${vehicleId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("fleet-documents").upload(path, file);
        if (error) throw error;
        file_path = path;
      }
      const { error } = await supabase.from("vehicle_documents").insert({
        vehicle_id: vehicleId,
        kind: f.kind as any,
        title: f.title || null,
        document_number: f.document_number || null,
        issued_on: f.issued_on || null,
        expires_on: f.expires_on || null,
        notes: f.notes || null,
        file_path,
      });
      if (error) throw error;
      toast.success(ar ? "تمت إضافة المستند" : "Document added");
      setOpen(false); setFile(null);
      setF({ kind: "registration", title: "", document_number: "", issued_on: "", expires_on: "", notes: "" });
      onChange();
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("fleet-documents").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };
  const del = async (docId: string, path: string | null) => {
    if (!confirm(ar ? "حذف هذا المستند؟" : "Delete this document?")) return;
    if (path) await supabase.storage.from("fleet-documents").remove([path]);
    const { error } = await supabase.from("vehicle_documents").delete().eq("id", docId);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">{ar ? "المستندات" : "Documents"}</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Upload className="h-3.5 w-3.5 me-1" />{ar ? "إضافة مستند" : "Add document"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{ar ? "مستند جديد" : "New document"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{ar ? "النوع" : "Kind"}</Label>
                <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VEHICLE_DOC_KINDS.map(k => <SelectItem key={k} value={k}>{ar ? DOC_KIND_AR[k] : k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{ar ? "العنوان" : "Title"}</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>{ar ? "رقم المستند" : "Document #"}</Label><Input value={f.document_number} onChange={(e) => setF({ ...f, document_number: e.target.value })} /></div>
              <div><Label>{ar ? "تاريخ الإصدار" : "Issued on"}</Label><Input type="date" value={f.issued_on} onChange={(e) => setF({ ...f, issued_on: e.target.value })} /></div>
              <div><Label>{ar ? "تاريخ الانتهاء" : "Expires on"}</Label><Input type="date" value={f.expires_on} onChange={(e) => setF({ ...f, expires_on: e.target.value })} /></div>
              <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} /></div>
              <div className="col-span-2"><Label>{ar ? "الملف" : "File"}</Label><Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button disabled={uploading} onClick={save}><Save className="h-4 w-4 me-1" />{ar ? "حفظ" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {docs.length === 0 ? <div className="text-sm text-muted-foreground py-3">{ar ? "لا توجد مستندات." : "No documents."}</div> :
        <div className="divide-y">
          {docs.map((doc: any) => (
            <div key={doc.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{doc.title || (ar ? DOC_KIND_AR[doc.kind] : doc.kind)} <span className="text-muted-foreground text-xs">· {ar ? DOC_KIND_AR[doc.kind] : doc.kind}</span></div>
                <div className="text-xs text-muted-foreground">{doc.document_number ?? ""}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ExpiryPill date={doc.expires_on} />
                {doc.file_path && <Button variant="ghost" size="icon" onClick={() => download(doc.file_path)}><Download className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="icon" onClick={() => del(doc.id, doc.file_path)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      }
    </CardContent></Card>
  );
}

function EditVehicleDialog({ vehicle, onSaved, ar }: { vehicle: any; onSaved: () => void; ar: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ ...vehicle });
  const cats = useQuery({ queryKey: ["cats"], queryFn: async () => (await supabase.from("vehicle_categories").select("id, code").order("sort_order")).data ?? [] });

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        plate_number: f.plate_number, internal_code: f.internal_code || null, vin: f.vin || null,
        make: f.make || null, model: f.model || null, year: f.year ? Number(f.year) : null,
        color: f.color || null, seats: Number(f.seats || 4),
        fuel_type: f.fuel_type || null, transmission: f.transmission || null,
        category_id: f.category_id || null, status: f.status,
        registration_expiry: f.registration_expiry || null,
        insurance_expiry: f.insurance_expiry || null,
        inspection_expiry: f.inspection_expiry || null,
        current_mileage: f.current_mileage ? Number(f.current_mileage) : 0,
        next_maintenance_date: f.next_maintenance_date || null,
        next_maintenance_mileage: f.next_maintenance_mileage ? Number(f.next_maintenance_mileage) : null,
        notes: f.notes || null,
      };
      const { error } = await supabase.from("vehicles").update(payload).eq("id", vehicle.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">{ar ? "تعديل" : "Edit"}</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{ar ? "تعديل المركبة" : "Edit vehicle"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{ar ? "رقم اللوحة" : "Plate #"}</Label><Input value={f.plate_number ?? ""} onChange={(e) => setF({ ...f, plate_number: e.target.value })} /></div>
          <div><Label>{ar ? "الكود الداخلي" : "Internal code"}</Label><Input value={f.internal_code ?? ""} onChange={(e) => setF({ ...f, internal_code: e.target.value })} /></div>
          <div className="col-span-2"><Label>VIN</Label><Input value={f.vin ?? ""} onChange={(e) => setF({ ...f, vin: e.target.value })} /></div>
          <div><Label>{ar ? "الصانع" : "Make"}</Label><Input value={f.make ?? ""} onChange={(e) => setF({ ...f, make: e.target.value })} /></div>
          <div><Label>{ar ? "الطراز" : "Model"}</Label><Input value={f.model ?? ""} onChange={(e) => setF({ ...f, model: e.target.value })} /></div>
          <div><Label>{ar ? "السنة" : "Year"}</Label><Input type="number" value={f.year ?? ""} onChange={(e) => setF({ ...f, year: e.target.value })} /></div>
          <div><Label>{ar ? "اللون" : "Color"}</Label><Input value={f.color ?? ""} onChange={(e) => setF({ ...f, color: e.target.value })} /></div>
          <div><Label>{ar ? "المقاعد" : "Seats"}</Label><Input type="number" value={f.seats ?? 4} onChange={(e) => setF({ ...f, seats: e.target.value })} /></div>
          <div><Label>{ar ? "الوقود" : "Fuel"}</Label>
            <Select value={f.fuel_type ?? ""} onValueChange={(v) => setF({ ...f, fuel_type: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{["petrol","diesel","hybrid","electric","lpg","cng"].map(x => <SelectItem key={x} value={x}>{ar ? FUEL_AR[x] : x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{ar ? "ناقل الحركة" : "Transmission"}</Label>
            <Select value={f.transmission ?? ""} onValueChange={(v) => setF({ ...f, transmission: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{["automatic","manual"].map(x => <SelectItem key={x} value={x}>{ar ? TRANS_AR[x] : x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>{ar ? "الفئة" : "Category"}</Label>
            <Select value={f.category_id ?? ""} onValueChange={(v) => setF({ ...f, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{(cats.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{ar ? "الحالة" : "Status"}</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VEHICLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{ar ? "المسافة الحالية (كم)" : "Current mileage (km)"}</Label><Input type="number" value={f.current_mileage ?? ""} onChange={(e) => setF({ ...f, current_mileage: e.target.value })} /></div>
          <div><Label>{ar ? "انتهاء الاستمارة" : "Registration expiry"}</Label><Input type="date" value={f.registration_expiry ?? ""} onChange={(e) => setF({ ...f, registration_expiry: e.target.value })} /></div>
          <div><Label>{ar ? "انتهاء التأمين" : "Insurance expiry"}</Label><Input type="date" value={f.insurance_expiry ?? ""} onChange={(e) => setF({ ...f, insurance_expiry: e.target.value })} /></div>
          <div><Label>{ar ? "انتهاء الفحص" : "Inspection expiry"}</Label><Input type="date" value={f.inspection_expiry ?? ""} onChange={(e) => setF({ ...f, inspection_expiry: e.target.value })} /></div>
          <div><Label>{ar ? "الصيانة القادمة" : "Next maintenance"}</Label><Input type="date" value={f.next_maintenance_date ?? ""} onChange={(e) => setF({ ...f, next_maintenance_date: e.target.value })} /></div>
          <div><Label>{ar ? "الصيانة القادمة (كم)" : "Next maintenance km"}</Label><Input type="number" value={f.next_maintenance_mileage ?? ""} onChange={(e) => setF({ ...f, next_maintenance_mileage: e.target.value })} /></div>
          <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea rows={3} value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4 me-1" />{ar ? "حفظ" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
