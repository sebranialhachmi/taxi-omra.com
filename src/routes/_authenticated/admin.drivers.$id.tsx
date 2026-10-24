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
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Car, Upload, Download, Trash2, Save, Wallet, Route as RouteIcon, TrendingUp, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/drivers/$id")({ component: DriverProfile });

const DRIVER_STATUSES = ["available","offline","assigned","en_route","waiting","on_trip","on_break","vacation","suspended"];
const EMPLOYMENT_STATUSES = ["active","probation","suspended","terminated","vacation"];
const DOC_KINDS = ["license","national_id","medical","work_permit","insurance","other"] as const;

function DriverProfile() {
  const { id } = Route.useParams();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["driver", id],
    queryFn: async () => (await supabase.from("drivers").select("*, vehicle:vehicles(id, plate_number, make, model)").eq("id", id).maybeSingle()).data,
  });
  const bookings = useQuery({
    queryKey: ["driver-bookings", id],
    queryFn: async () => (await supabase.from("bookings").select("id, code, status, total_fare, pickup_at, pickup_location, dropoff_location, customer:customers(full_name)").eq("driver_id", id).order("pickup_at", { ascending: false }).limit(100)).data ?? [],
  });
  const docs = useQuery({
    queryKey: ["driver-docs", id],
    queryFn: async () => (await supabase.from("driver_documents").select("*").eq("driver_id", id).order("expires_on", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const assignments = useQuery({
    queryKey: ["driver-assignments", id],
    queryFn: async () => (await supabase.from("driver_vehicle_assignments").select("*, vehicle:vehicles(plate_number, make, model)").eq("driver_id", id).order("started_at", { ascending: false }).limit(50)).data ?? [],
  });

  if (q.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-8"><Button variant="outline" onClick={() => navigate({ to: "/admin/drivers" })}><ArrowLeft className="h-4 w-4 me-2" />Back</Button><div className="mt-4">Driver not found</div></div>;

  const d = q.data as any;
  const bList = bookings.data ?? [];
  const upcoming = bList.filter((b: any) => b.pickup_at && new Date(b.pickup_at) > new Date() && !["completed","cancelled","no_show"].includes(b.status));
  const current = bList.find((b: any) => ["assigned","en_route","picked_up","on_trip"].includes(b.status));

  const expiring = [
    { key: "License", date: d.license_expiry },
    { key: "Medical", date: d.medical_expiry },
    { key: "Work permit", date: d.work_permit_expiry },
    { key: "Insurance", date: d.insurance_expiry },
    ...(docs.data ?? []).map((x: any) => ({ key: x.title || x.kind, date: x.expires_on })),
  ].filter((x) => x.date && daysUntil(x.date)! <= 30);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/admin/drivers"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1" />Drivers</Button></Link>
      </div>

      <PageHeader
        eyebrow="Driver profile"
        title={d.full_name}
        description={d.email || d.phone || undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={d.status} />
            <StatusBadge value={d.employment_status} />
            <EditDriverDialog driver={d} onSaved={() => qc.invalidateQueries({ queryKey: ["driver", id] })} />
          </div>
        }
      />

      {/* Contact strip */}
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Phone className="h-4 w-4 text-gold" />
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Phone</div><a href={`tel:${d.phone ?? ""}`} className="text-sm truncate block">{d.phone ?? "—"}</a></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <MessageCircle className="h-4 w-4 text-gold" />
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">WhatsApp</div>
            {d.whatsapp ? <a href={`https://wa.me/${d.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="text-sm truncate block">{d.whatsapp}</a> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Mail className="h-4 w-4 text-gold" />
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</div><span className="text-sm truncate block">{d.email ?? "—"}</span></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Car className="h-4 w-4 text-gold" />
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current vehicle</div>
            {d.vehicle ? <Link to={"/admin/fleet/$id" as any} params={{ id: d.vehicle.id } as any} className="text-sm truncate block hover:text-gold">{d.vehicle.plate_number} · {d.vehicle.make ?? ""} {d.vehicle.model ?? ""}</Link> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {expiring.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-warning-foreground mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Documents expiring or expired</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiring.map((e, i) => <ExpiryPill key={i} date={e.date} label={e.key} />)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6 mb-6">
        <StatCard label="Total trips" value={d.total_trips ?? 0} icon={RouteIcon} />
        <StatCard label="Completed" value={d.completed_trips ?? 0} icon={TrendingUp} />
        <StatCard label="Cancelled" value={d.cancelled_trips ?? 0} icon={XCircle} />
        <StatCard label="No-show" value={d.no_show_trips ?? 0} icon={XCircle} />
        <StatCard label="Revenue" value={Number(d.total_earnings ?? 0).toFixed(2)} icon={Wallet} />
        <StatCard label="Rating" value={d.avg_rating ? Number(d.avg_rating).toFixed(2) : "—"} icon={TrendingUp} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card><CardContent className="p-4 space-y-2 text-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Personal</div>
            <Row k="National ID" v={d.national_id} />
            <Row k="Address" v={d.address} />
            <Row k="Employment date" v={d.hired_at} />
            <Row k="Emergency contact" v={d.emergency_contact_name ? `${d.emergency_contact_name} · ${d.emergency_contact_phone ?? ""}` : null} />
            <Row k="Languages" v={(d.languages ?? []).join(", ") || null} />
            <Row k="Notes" v={d.notes} />
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-2 text-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">License & Certifications</div>
            <Row k="License #" v={d.license_number} />
            <Row k="License class" v={d.license_class} />
            <div className="flex justify-between items-center py-1 border-b border-border/40"><span className="text-muted-foreground">License expiry</span><ExpiryPill date={d.license_expiry} /></div>
            <div className="flex justify-between items-center py-1 border-b border-border/40"><span className="text-muted-foreground">Medical</span><ExpiryPill date={d.medical_expiry} /></div>
            <div className="flex justify-between items-center py-1 border-b border-border/40"><span className="text-muted-foreground">Work permit</span><ExpiryPill date={d.work_permit_expiry} /></div>
            <div className="flex justify-between items-center py-1"><span className="text-muted-foreground">Insurance</span><ExpiryPill date={d.insurance_expiry} /></div>
          </CardContent></Card>

          <Card className="md:col-span-2"><CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Current & upcoming</div>
            {current && <BookingRow b={current} highlight />}
            {upcoming.slice(0, 5).map((b: any) => <BookingRow key={b.id} b={b} />)}
            {!current && upcoming.length === 0 && <div className="text-sm text-muted-foreground py-3">No active bookings.</div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card><CardContent className="p-0">
            {bList.length === 0 && <div className="p-6 text-sm text-muted-foreground">No trip history.</div>}
            <div className="divide-y">
              {bList.map((b: any) => <BookingRow key={b.id} b={b} />)}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsPanel driverId={id} docs={docs.data ?? []} onChange={() => qc.invalidateQueries({ queryKey: ["driver-docs", id] })} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card><CardContent className="p-0">
            {(assignments.data ?? []).length === 0 && <div className="p-6 text-sm text-muted-foreground">No assignment history.</div>}
            <div className="divide-y">
              {(assignments.data ?? []).map((a: any) => (
                <div key={a.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{a.vehicle?.plate_number} · {a.vehicle?.make} {a.vehicle?.model}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.started_at).toLocaleString()} → {a.ended_at ? new Date(a.ended_at).toLocaleString() : "current"}</div>
                    {a.notes && <div className="text-xs mt-1">{a.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card><CardContent className="p-4">
            <ActivityTimeline entityType="driver" entityId={id} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between gap-3 py-1 border-b border-border/40 last:border-0"><span className="text-muted-foreground">{k}</span><span className="truncate max-w-[60%] text-end">{v || "—"}</span></div>;
}

function BookingRow({ b, highlight }: { b: any; highlight?: boolean }) {
  return (
    <Link to={"/admin/bookings" as any} className={`block p-3 hover:bg-muted/30 ${highlight ? "bg-gold/5" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-mono">{b.code ?? b.id.slice(0,8)}</div>
          <div className="text-xs text-muted-foreground truncate">{b.pickup_location} → {b.dropoff_location}</div>
          {b.customer?.full_name && <div className="text-xs mt-0.5">{b.customer.full_name}</div>}
        </div>
        <div className="text-end shrink-0">
          <StatusBadge value={b.status} />
          <div className="text-xs text-muted-foreground mt-1">{b.pickup_at ? new Date(b.pickup_at).toLocaleString() : "—"}</div>
          <div className="text-xs">{Number(b.total_fare ?? 0).toFixed(2)}</div>
        </div>
      </div>
    </Link>
  );
}

function DocumentsPanel({ driverId, docs, onChange }: { driverId: string; docs: any[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kind: "license", title: "", document_number: "", issued_on: "", expires_on: "", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setUploading(true);
    try {
      let file_path: string | null = null;
      if (file) {
        const path = `drivers/${driverId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("fleet-documents").upload(path, file);
        if (error) throw error;
        file_path = path;
      }
      const { error } = await supabase.from("driver_documents").insert({
        driver_id: driverId,
        kind: form.kind as any,
        title: form.title || null,
        document_number: form.document_number || null,
        issued_on: form.issued_on || null,
        expires_on: form.expires_on || null,
        notes: form.notes || null,
        file_path,
      });
      if (error) throw error;
      toast.success("Document added");
      setOpen(false); setFile(null);
      setForm({ kind: "license", title: "", document_number: "", issued_on: "", expires_on: "", notes: "" });
      onChange();
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("fleet-documents").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const del = async (docId: string, path: string | null) => {
    if (!confirm("Delete this document?")) return;
    if (path) await supabase.storage.from("fleet-documents").remove([path]);
    const { error } = await supabase.from("driver_documents").delete().eq("id", docId);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Documents</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Upload className="h-3.5 w-3.5 me-1" />Add document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New document</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kind</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Document #</Label><Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} /></div>
              <div><Label>Issued on</Label><Input type="date" value={form.issued_on} onChange={(e) => setForm({ ...form, issued_on: e.target.value })} /></div>
              <div><Label>Expires on</Label><Input type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="col-span-2"><Label>File</Label><Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={uploading} onClick={save}><Save className="h-4 w-4 me-1" />Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {docs.length === 0 ? <div className="text-sm text-muted-foreground py-3">No documents.</div> :
        <div className="divide-y">
          {docs.map((doc: any) => (
            <div key={doc.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{doc.title || doc.kind} <span className="text-muted-foreground text-xs">· {doc.kind}</span></div>
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

function EditDriverDialog({ driver, onSaved }: { driver: any; onSaved: () => void }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ ...driver, languages: (driver.languages ?? []).join(", ") });

  const openDialog = () => {
    setF({ ...driver, languages: (driver.languages ?? []).join(", ") });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: f.full_name, phone: f.phone || null, whatsapp: f.whatsapp || null, email: f.email || null,
        address: f.address || null, national_id: f.national_id || null,
        license_number: f.license_number || null, license_class: f.license_class || null, license_expiry: f.license_expiry || null,
        medical_expiry: f.medical_expiry || null, work_permit_expiry: f.work_permit_expiry || null, insurance_expiry: f.insurance_expiry || null,
        hired_at: f.hired_at || null,
        employment_status: f.employment_status, status: f.status,
        emergency_contact_name: f.emergency_contact_name || null, emergency_contact_phone: f.emergency_contact_phone || null,
        languages: String(f.languages || "").split(",").map((s: string) => s.trim()).filter(Boolean),
        notes: f.notes || null,
      };
      const { error } = await supabase.from("drivers").update(payload).eq("id", driver.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>{ar ? "تعديل" : "Edit"}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ar ? "تعديل السائق" : "Edit driver"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>{ar ? "الاسم الكامل" : "Full name"}</Label><Input value={f.full_name ?? ""} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div><Label>{ar ? "الهاتف" : "Phone"}</Label><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div><Label>{ar ? "واتساب" : "WhatsApp"}</Label><Input value={f.whatsapp ?? ""} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
            <div><Label>{ar ? "البريد" : "Email"}</Label><Input value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>{ar ? "الهوية الوطنية" : "National ID"}</Label><Input value={f.national_id ?? ""} onChange={(e) => setF({ ...f, national_id: e.target.value })} /></div>
            <div className="col-span-2"><Label>{ar ? "العنوان" : "Address"}</Label><Input value={f.address ?? ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            <div><Label>{ar ? "رقم الرخصة" : "License #"}</Label><Input value={f.license_number ?? ""} onChange={(e) => setF({ ...f, license_number: e.target.value })} /></div>
            <div><Label>{ar ? "فئة الرخصة" : "License class"}</Label><Input value={f.license_class ?? ""} onChange={(e) => setF({ ...f, license_class: e.target.value })} /></div>
            <div><Label>{ar ? "انتهاء الرخصة" : "License expiry"}</Label><Input type="date" value={f.license_expiry ?? ""} onChange={(e) => setF({ ...f, license_expiry: e.target.value })} /></div>
            <div><Label>{ar ? "انتهاء الفحص الطبي" : "Medical expiry"}</Label><Input type="date" value={f.medical_expiry ?? ""} onChange={(e) => setF({ ...f, medical_expiry: e.target.value })} /></div>
            <div><Label>{ar ? "انتهاء تصريح العمل" : "Work permit expiry"}</Label><Input type="date" value={f.work_permit_expiry ?? ""} onChange={(e) => setF({ ...f, work_permit_expiry: e.target.value })} /></div>
            <div><Label>{ar ? "انتهاء التأمين" : "Insurance expiry"}</Label><Input type="date" value={f.insurance_expiry ?? ""} onChange={(e) => setF({ ...f, insurance_expiry: e.target.value })} /></div>
            <div><Label>{ar ? "تاريخ التوظيف" : "Employment date"}</Label><Input type="date" value={f.hired_at ?? ""} onChange={(e) => setF({ ...f, hired_at: e.target.value })} /></div>
            <div><Label>{ar ? "حالة التوظيف" : "Employment status"}</Label>
              <Select value={f.employment_status} onValueChange={(v) => setF({ ...f, employment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{ar ? "حالة السائق" : "Driver status"}</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DRIVER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{ar ? "اسم جهة الاتصال للطوارئ" : "Emergency name"}</Label><Input value={f.emergency_contact_name ?? ""} onChange={(e) => setF({ ...f, emergency_contact_name: e.target.value })} /></div>
            <div><Label>{ar ? "هاتف الطوارئ" : "Emergency phone"}</Label><Input value={f.emergency_contact_phone ?? ""} onChange={(e) => setF({ ...f, emergency_contact_phone: e.target.value })} /></div>
            <div className="col-span-2"><Label>{ar ? "اللغات (مفصولة بفواصل)" : "Languages (comma-separated)"}</Label><Input value={f.languages ?? ""} onChange={(e) => setF({ ...f, languages: e.target.value })} /></div>
            <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4 me-1" />{ar ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
