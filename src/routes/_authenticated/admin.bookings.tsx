import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserPlus2, Star, StarOff, ListTree, Copy, Download, Printer, XCircle, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { WhatsAppSendMenu } from "@/components/WhatsAppSendMenu";
import { downloadCsv } from "@/lib/csv";
import { duplicateBooking, bulkUpdateBookings, cancelBooking, addBookingNote, scheduleBookingReminder } from "@/lib/booking-ops.functions";
import { CustomersListPanel } from "@/components/admin/CustomersListPanel";
import { UnifiedBookingDialog } from "@/components/admin/UnifiedBookingDialog";
import { CalendarCheck, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/bookings")({ component: BookingsPage });

const BOOKING_STATUSES = ["pending", "confirmed", "assigned", "en_route", "on_trip", "picked_up", "completed", "cancelled", "no_show"] as const;
const STATUS_LABELS_EN: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", assigned: "Driver Assigned", en_route: "En Route",
  on_trip: "On Trip", picked_up: "Picked Up", completed: "Completed", cancelled: "Cancelled", no_show: "No Show",
};
const STATUS_LABELS_AR: Record<string, string> = {
  pending: "قيد الانتظار", confirmed: "مؤكد", assigned: "مُعيَّن للسائق", en_route: "في الطريق",
  on_trip: "في رحلة", picked_up: "تم الاستلام", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر",
};
const CANCEL_CATEGORIES = ["customer_request", "no_show", "duplicate", "weather", "vehicle_issue", "other"];
const CANCEL_CAT_AR: Record<string, string> = {
  customer_request: "طلب العميل", no_show: "لم يحضر", duplicate: "مكرر", weather: "طقس", vehicle_issue: "مشكلة مركبة", other: "أخرى",
};
const CATEGORY_LABEL_AR: Record<string, string> = {
  economy: "اقتصادي", standard: "قياسي", business: "أعمال", premium: "بريميوم",
  suv: "دفع رباعي", family_suv: "دفع رباعي عائلي", luxury_van: "فان فاخر", van: "فان", vip: "VIP",
};
function catLabel(code: string, locale: string) {
  if (locale === "ar") return CATEGORY_LABEL_AR[code] ?? code;
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function BookingsPage() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const STATUS_LABELS = ar ? STATUS_LABELS_AR : STATUS_LABELS_EN;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityOnly, setPriorityOnly] = useState(false);

  const dup = useServerFn(duplicateBooking);
  const bulk = useServerFn(bulkUpdateBookings);

  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, code, status, total_fare, pickup_location, dropoff_location, pickup_at, distance_km, is_priority, tags, created_at, customer:customers(id, full_name, phone), driver:drivers(full_name), category:vehicle_categories(code)")
        .order("is_priority", { ascending: false })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const cats = useQuery({ queryKey: ["cats"], queryFn: async () => (await supabase.from("vehicle_categories").select("*").eq("is_active", true).order("sort_order")).data ?? [] });
  const customers = useQuery({ queryKey: ["cust-lookup"], queryFn: async () => (await supabase.from("customers").select("id, full_name, phone").order("full_name")).data ?? [] });
  const drivers = useQuery({ queryKey: ["drv-lookup"], queryFn: async () => (await supabase.from("drivers").select("id, full_name").eq("is_active", true).order("full_name")).data ?? [] });

  const filtered = useMemo(() => {
    const rows = bookings.data ?? [];
    const s = search.trim().toLowerCase();
    return rows.filter((r: any) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (priorityOnly && !r.is_priority) return false;
      if (!s) return true;
      return [r.code, r.customer?.full_name, r.customer?.phone, r.pickup_location, r.dropoff_location]
        .filter(Boolean).some((v: string) => v.toLowerCase().includes(s));
    });
  }, [bookings.data, search, statusFilter, priorityOnly]);

  const toggleSel = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((r: any) => r.id)));

  const togglePriority = async (r: any) => {
    const { error } = await supabase.from("bookings").update({ is_priority: !r.is_priority }).eq("id", r.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  const duplicate = async (id: string) => {
    try {
      const c = await dup({ data: { id } });
      toast.success(`Duplicated as ${c.code}`);
      qc.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const doBulk = async (patch: any) => {
    if (!selected.size) return;
    try {
      await bulk({ data: { ids: Array.from(selected), patch } });
      toast.success(`Updated ${selected.size}`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const exportCsv = () => {
    const rows = filtered.map((r: any) => ({
      code: r.code, status: r.status, pickup_at: r.pickup_at, customer: r.customer?.full_name ?? "",
      phone: r.customer?.phone ?? "", driver: r.driver?.full_name ?? "", category: r.category?.code ?? "",
      pickup: r.pickup_location, dropoff: r.dropoff_location, distance_km: r.distance_km,
      total_fare: r.total_fare, priority: r.is_priority, tags: (r.tags ?? []).join("|"),
      created_at: r.created_at,
    }));
    downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported ${rows.length} rows`);
  };

  return (
    <div>
      <PageHeader
        title={ar ? "الحجوزات والعملاء" : "Bookings & Customers"}
        description={ar ? "إدارة الحجوزات والعملاء في مكان واحد" : "Bookings and customers, unified"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 me-1" />CSV</Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" />{t("new_booking")}</Button>
            <UnifiedBookingDialog open={open} onOpenChange={setOpen}
              onCreated={() => { qc.invalidateQueries({ queryKey: ["bookings"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); }} />

          </div>
        }
      />

      <Tabs defaultValue="bookings" className="mb-4">
        <TabsList>
          <TabsTrigger value="bookings"><CalendarCheck className="h-4 w-4 me-2" />{ar ? "الحجوزات" : "Bookings"}</TabsTrigger>
          <TabsTrigger value="customers"><Users className="h-4 w-4 me-2" />{ar ? "العملاء" : "Customers"}</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <CustomersListPanel />
        </TabsContent>
        <TabsContent value="bookings" className="mt-4">


      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "ابحث بالرمز، العميل، الهاتف، العنوان…" : "Search code, customer, phone, address…"} className="ps-9 w-80" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل الحالات" : "All statuses"}</SelectItem>
            {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={priorityOnly} onCheckedChange={(v) => setPriorityOnly(!!v)} />{ar ? "الأولوية فقط" : "Priority only"}</label>
        <div className="text-sm text-muted-foreground">{filtered.length} {ar ? "من" : "of"} {(bookings.data ?? []).length}</div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 p-2 text-sm">
          <span className="font-medium">{selected.size} {ar ? "محدد" : "selected"}</span>
          <Select onValueChange={(v) => doBulk({ status: v })}>
            <SelectTrigger className="w-44 h-8"><SelectValue placeholder={ar ? "تعيين حالة…" : "Set status…"} /></SelectTrigger>
            <SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => doBulk({ is_priority: true })}><Star className="h-3.5 w-3.5 me-1" />{ar ? "تعليم كأولوية" : "Mark priority"}</Button>
          <Button size="sm" variant="outline" onClick={() => doBulk({ is_priority: false })}><StarOff className="h-3.5 w-3.5 me-1" />{ar ? "إزالة الأولوية" : "Clear priority"}</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>{ar ? "مسح" : "Clear"}</Button>
        </div>
      )}

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-2 w-8"><Checkbox checked={selected.size > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} /></th>
              <th className="p-2 text-start">{ar ? "الرمز" : "Code"}</th>
              <th className="p-2 text-start">{ar ? "العميل" : "Customer"}</th>
              <th className="p-2 text-start">{ar ? "السائق" : "Driver"}</th>
              <th className="p-2 text-start">{ar ? "من ← إلى" : "Pickup → Dropoff"}</th>
              <th className="p-2 text-start">{ar ? "الموعد" : "When"}</th>
              <th className="p-2 text-end">{ar ? "الأجرة" : "Fare"}</th>
              <th className="p-2 text-start">{ar ? "الحالة" : "Status"}</th>
              <th className="p-2 text-end">{ar ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} className="border-t border-border/60 hover:bg-muted/20">
                <td className="p-2"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} /></td>
                <td className="p-2">
                  <button onClick={() => setDetailId(r.id)} className="font-mono text-xs hover:text-gold flex items-center gap-1">
                    {r.is_priority && <Star className="h-3 w-3 fill-gold text-gold" />}
                    {r.code}
                  </button>
                  {r.tags?.length > 0 && <div className="mt-0.5 flex flex-wrap gap-1">{r.tags.map((tg: string) => <Badge key={tg} variant="outline" className="text-[10px] px-1 py-0">{tg}</Badge>)}</div>}
                </td>
                <td className="p-2">{r.customer?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{r.customer?.phone}</div></td>
                <td className="p-2">{r.driver?.full_name ?? "—"}</td>
                <td className="p-2 max-w-xs truncate"><span className="truncate">{r.pickup_location}</span><div className="text-xs text-muted-foreground truncate">→ {r.dropoff_location}</div></td>
                <td className="p-2 text-xs">{new Date(r.pickup_at).toLocaleString(ar ? "ar" : "en")}</td>
                <td className="p-2 text-end font-mono">{Number(r.total_fare || 0).toFixed(2)}</td>
                <td className="p-2"><StatusBadge value={r.status} /></td>
                <td className="p-2">
                  <div className="flex items-center gap-1 justify-end">
                    <WhatsAppSendMenu phone={r.customer?.phone} bookingId={r.id} customerId={r.customer?.id}
                      vars={{ code: r.code, customer_name: r.customer?.full_name, pickup: r.pickup_location, dropoff: r.dropoff_location, pickup_at: new Date(r.pickup_at).toLocaleString(), driver_name: r.driver?.full_name ?? "", total: Number(r.total_fare || 0).toFixed(2) }} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={ar ? "تكرار" : "Duplicate"} onClick={() => duplicate(r.id)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={ar ? "أولوية" : "Priority"} onClick={() => togglePriority(r)}>
                      {r.is_priority ? <Star className="h-4 w-4 fill-gold text-gold" /> : <StarOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={ar ? "المخطط الزمني" : "Timeline"} onClick={() => setDetailId(r.id)}><ListTree className="h-4 w-4" /></Button>
                    <a href={`/admin/bookings/${r.id}/print`} target="_blank" rel="noopener" title={ar ? "طباعة" : "Print"} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"><Printer className="h-4 w-4" /></a>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{bookings.isLoading ? (ar ? "جارٍ التحميل…" : "Loading…") : (ar ? "لا توجد حجوزات مطابقة." : "No bookings match.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
        </TabsContent>
      </Tabs>

      <BookingDetailDialog bookingId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </div>
  );
}

function BookingDetailDialog({ bookingId, onOpenChange }: { bookingId: string | null; onOpenChange: (o: boolean) => void }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const STATUS_LABELS = ar ? STATUS_LABELS_AR : STATUS_LABELS_EN;
  const qc = useQueryClient();
  const cancelFn = useServerFn(cancelBooking);
  const addNote = useServerFn(addBookingNote);
  const schedRem = useServerFn(scheduleBookingReminder);

  const q = useQuery({
    queryKey: ["booking-detail", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("bookings")
      .select("*, customer:customers(id, full_name, phone), driver:drivers(full_name, phone), vehicle:vehicles(plate_number, make, model), category:vehicle_categories(code)")
      .eq("id", bookingId!).maybeSingle()).data,
  });
  const notes = useQuery({
    queryKey: ["booking-notes", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("booking_notes").select("*").eq("booking_id", bookingId!).order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
  });
  const reminders = useQuery({
    queryKey: ["booking-reminders", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("booking_reminders").select("*").eq("booking_id", bookingId!).order("remind_at")).data ?? [],
  });
  const waHistory = useQuery({
    queryKey: ["booking-wa", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("whatsapp_messages").select("*").eq("booking_id", bookingId!).order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const b = q.data;
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonCat, setReasonCat] = useState<string>("customer_request");
  const [remAt, setRemAt] = useState("");
  const [remNote, setRemNote] = useState("");

  const submitNote = async () => {
    if (!note.trim() || !b) return;
    try { await addNote({ data: { booking_id: b.id, body: note } }); setNote(""); qc.invalidateQueries({ queryKey: ["booking-notes", bookingId] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const addTag = async () => {
    if (!tag.trim() || !b) return;
    const tags = Array.from(new Set([...(b.tags ?? []), tag.trim()]));
    const { error } = await supabase.from("bookings").update({ tags }).eq("id", b.id);
    if (error) toast.error(error.message); else { setTag(""); qc.invalidateQueries({ queryKey: ["booking-detail", bookingId] }); qc.invalidateQueries({ queryKey: ["bookings"] }); }
  };
  const removeTag = async (tg: string) => {
    if (!b) return;
    const tags = (b.tags ?? []).filter((x: string) => x !== tg);
    const { error } = await supabase.from("bookings").update({ tags }).eq("id", b.id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["booking-detail", bookingId] }); qc.invalidateQueries({ queryKey: ["bookings"] }); }
  };
  const doCancel = async () => {
    if (!reason.trim() || !b) return;
    try {
      await cancelFn({ data: { id: b.id, reason, category: reasonCat } });
      toast.success(ar ? "تم الإلغاء" : "Cancelled");
      setCancelOpen(false); setReason("");
      qc.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e: any) { toast.error(e.message); }
  };
  const doReminder = async () => {
    if (!remAt || !b) return;
    try {
      await schedRem({ data: { booking_id: b.id, remind_at: new Date(remAt).toISOString(), note: remNote || null } });
      toast.success(ar ? "تمت جدولة التذكير" : "Reminder scheduled"); setRemAt(""); setRemNote("");
      qc.invalidateQueries({ queryKey: ["booking-reminders", bookingId] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={!!bookingId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            {b?.is_priority && <Star className="h-5 w-5 fill-gold text-gold" />}
            {ar ? "حجز" : "Booking"} <span className="font-mono text-base">{b?.code}</span>
            {b && <StatusBadge value={b.status} />}
          </DialogTitle>
        </DialogHeader>
        {b && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "العميل" : "Customer"}</div><div>{b.customer?.full_name ?? "—"}</div><div className="text-xs text-muted-foreground">{b.customer?.phone}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "السائق" : "Driver"}</div><div>{b.driver?.full_name ?? "—"}</div><div className="text-xs text-muted-foreground">{b.driver?.phone}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "نقطة الانطلاق" : "Pickup"}</div><div>{b.pickup_location}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "الوجهة" : "Dropoff"}</div><div>{b.dropoff_location}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "المركبة" : "Vehicle"}</div><div>{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model} · ${b.vehicle.plate_number}` : "—"}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "الفئة" : "Category"}</div><div>{b.category?.code ? catLabel(b.category.code, locale) : "—"}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "المسافة" : "Distance"}</div><div>{Number(b.distance_km || 0).toFixed(1)} {ar ? "كم" : "km"}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "الإجمالي" : "Total"}</div><div className="font-display text-lg">{Number(b.total_fare || 0).toFixed(2)}</div></div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{ar ? "الوسوم" : "Tags"}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(b.tags ?? []).map((tg: string) => (
                    <Badge key={tg} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tg)}>{tg} ×</Badge>
                  ))}
                </div>
                <div className="flex gap-2"><Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={ar ? "إضافة وسم" : "add tag"} className="h-8" onKeyDown={(e) => e.key === "Enter" && addTag()} /><Button size="sm" variant="outline" onClick={addTag}>{ar ? "إضافة" : "Add"}</Button></div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={b.status} onValueChange={async (v) => {
                  const { error } = await supabase.from("bookings").update({ status: v as any }).eq("id", b.id);
                  if (error) toast.error(error.message); else { toast.success(ar ? "تم تحديث الحالة" : "Status updated"); qc.invalidateQueries({ queryKey: ["bookings"] }); qc.invalidateQueries({ queryKey: ["booking-detail", b.id] }); qc.invalidateQueries({ queryKey: ["activity", "booking", b.id] }); }
                }}>
                  <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}><XCircle className="h-4 w-4 me-1" />{ar ? "إلغاء" : "Cancel"}</Button>
                <a href={`/admin/bookings/${b.id}/print`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"><Printer className="h-4 w-4" />{ar ? "طباعة" : "Print"}</a>
                <WhatsAppSendMenu phone={b.customer?.phone} bookingId={b.id} customerId={b.customer?.id}
                  vars={{ code: b.code, customer_name: b.customer?.full_name, pickup: b.pickup_location, dropoff: b.dropoff_location, pickup_at: new Date(b.pickup_at).toLocaleString(), driver_name: b.driver?.full_name ?? "", total: Number(b.total_fare || 0).toFixed(2) }} />
              </div>

              {b.cancellation_reason && <div className="rounded-lg border border-destructive/40 p-3 text-sm bg-destructive/5"><div className="text-[10px] uppercase tracking-wider text-destructive mb-1">{ar ? "الإلغاء" : "Cancellation"} ({(ar && b.cancellation_category ? (CANCEL_CAT_AR[b.cancellation_category] ?? b.cancellation_category) : (b.cancellation_category ?? "—"))})</div>{b.cancellation_reason}</div>}

              {cancelOpen && (
                <div className="rounded-lg border border-destructive/40 p-3 space-y-2 bg-destructive/5">
                  <Label className="text-xs">{ar ? "سبب الإلغاء" : "Cancellation reason"}</Label>
                  <Select value={reasonCat} onValueChange={setReasonCat}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{CANCEL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{ar ? (CANCEL_CAT_AR[c] ?? c) : c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                  <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ar ? "التفاصيل…" : "Details…"} />
                  <div className="flex gap-2 justify-end"><Button size="sm" variant="ghost" onClick={() => setCancelOpen(false)}>{ar ? "إغلاق" : "Close"}</Button><Button size="sm" variant="destructive" onClick={doCancel}>{ar ? "تأكيد الإلغاء" : "Confirm cancel"}</Button></div>
                </div>
              )}
            </div>

            <div>
              <Tabs defaultValue="timeline">
                <TabsList>
                  <TabsTrigger value="timeline">{ar ? "المخطط الزمني" : "Timeline"}</TabsTrigger>
                  <TabsTrigger value="notes">{ar ? "ملاحظات" : "Notes"} ({notes.data?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="reminders">{ar ? "التذكيرات" : "Reminders"}</TabsTrigger>
                  <TabsTrigger value="whatsapp">{ar ? "واتساب" : "WhatsApp"} ({waHistory.data?.length ?? 0})</TabsTrigger>
                </TabsList>
                <TabsContent value="timeline"><ActivityTimeline entityType="booking" entityId={b.id} /></TabsContent>
                <TabsContent value="notes" className="space-y-2">
                  <div className="space-y-2">
                    <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={ar ? "أضف ملاحظة داخلية…" : "Add an internal note…"} />
                    <Button size="sm" onClick={submitNote} disabled={!note.trim()}>{ar ? "إضافة ملاحظة" : "Add note"}</Button>
                  </div>
                  <div className="space-y-2 mt-3">
                    {(notes.data ?? []).map((n: any) => (
                      <div key={n.id} className="rounded-md border p-2 text-sm">
                        <div className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString(ar ? "ar" : "en")}{n.pinned && (ar ? " · مثبت" : " · pinned")}</div>
                        <div className="whitespace-pre-line">{n.body}</div>
                      </div>
                    ))}
                    {!notes.data?.length && <div className="text-xs text-muted-foreground">{ar ? "لا توجد ملاحظات بعد." : "No notes yet."}</div>}
                  </div>
                </TabsContent>
                <TabsContent value="reminders" className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="datetime-local" value={remAt} onChange={(e) => setRemAt(e.target.value)} />
                    <Input value={remNote} onChange={(e) => setRemNote(e.target.value)} placeholder={ar ? "ملاحظة (اختياري)" : "Note (optional)"} />
                  </div>
                  <Button size="sm" onClick={doReminder} disabled={!remAt}>{ar ? "جدولة التذكير" : "Schedule reminder"}</Button>
                  <div className="space-y-1 mt-2">
                    {(reminders.data ?? []).map((r: any) => (
                      <div key={r.id} className="text-xs flex justify-between rounded border p-2"><span>{new Date(r.remind_at).toLocaleString(ar ? "ar" : "en")} · {r.channel} · {r.status}</span><span className="text-muted-foreground">{r.note}</span></div>
                    ))}
                    {!reminders.data?.length && <div className="text-xs text-muted-foreground">{ar ? "لا توجد تذكيرات." : "No reminders."}</div>}
                  </div>
                </TabsContent>
                <TabsContent value="whatsapp" className="space-y-2">
                  {(waHistory.data ?? []).map((m: any) => (
                    <div key={m.id} className="rounded-md border p-2 text-xs">
                      <div className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString(ar ? "ar" : "en")} · {m.template_code ?? (ar ? "مخصص" : "custom")} · {m.locale}</div>
                      <div className="whitespace-pre-line mt-1">{m.body}</div>
                    </div>
                  ))}
                  {!waHistory.data?.length && <div className="text-xs text-muted-foreground">{ar ? "لا توجد رسائل واتساب بعد." : "No WhatsApp messages yet."}</div>}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewBookingDialog({ customers, cats, drivers, onDone }: { customers: any[]; cats: any[]; drivers: any[]; onDone: () => void }) {
  const { t, locale } = useI18n();
  const [form, setForm] = useState({
    customer_id: "", category_id: "", driver_id: "",
    pickup_location: "", dropoff_location: "",
    distance_km: "10", duration_min: "20", waiting_min: "0", airport_fee: "0",
    pickup_at: "", source: "whatsapp", notes: "",
  });

  const cat = cats.find((c) => c.id === form.category_id);
  const distanceKm = Number(form.distance_km || 0);
  const durationMin = Number(form.duration_min || 0);
  const waitingMin = Number(form.waiting_min || 0);
  const airportFee = Number(form.airport_fee || 0);
  const baseFare = Number(cat?.base_fare ?? 0);
  const distanceFare = distanceKm * Number(cat?.price_per_km ?? 0);
  const timeFare = durationMin * Number(cat?.price_per_min ?? 0);
  const waitingFare = waitingMin * 0.5;
  const pickupDate = form.pickup_at ? new Date(form.pickup_at) : new Date();
  const isNight = pickupDate.getHours() >= 22 || pickupDate.getHours() < 6;
  const subtotal = baseFare + distanceFare + timeFare + waitingFare + airportFee;
  const night = isNight ? subtotal * 0.15 : 0;
  const totalFare = subtotal + night;

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        customer_id: form.customer_id,
        category_id: form.category_id || null,
        driver_id: form.driver_id || null,
        pickup_location: form.pickup_location,
        dropoff_location: form.dropoff_location,
        pickup_at: form.pickup_at ? new Date(form.pickup_at).toISOString() : new Date().toISOString(),
        distance_km: distanceKm, duration_min: durationMin, waiting_min: waitingMin,
        base_fare: baseFare, distance_fare: distanceFare, time_fare: timeFare, waiting_fare: waitingFare,
        airport_fee: airportFee, night_surcharge: night, total_fare: totalFare,
        status: form.driver_id ? "assigned" : "pending",
        source: form.source, notes: form.notes || null,
      };
      const { error } = await supabase.from("bookings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(locale === "ar" ? "تم إنشاء الحجز" : "Booking created"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{t("new_booking")}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("customer")}</Label>
          <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t("category")}</Label>
          <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{catLabel(c.code, locale)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2"><Label>{t("pickup")}</Label><Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} /></div>
        <div className="space-y-1 md:col-span-2"><Label>{t("dropoff")}</Label><Input value={form.dropoff_location} onChange={(e) => setForm({ ...form, dropoff_location: e.target.value })} /></div>
        <div className="space-y-1"><Label>{locale === "ar" ? "موعد الانطلاق" : "Pickup at"}</Label><Input type="datetime-local" value={form.pickup_at} onChange={(e) => setForm({ ...form, pickup_at: e.target.value })} /></div>
        <div className="space-y-1"><Label>{locale === "ar" ? "المصدر" : "Source"}</Label>
          <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["whatsapp", "phone", "email", "walk_in", "website", "corporate"].map((s) => <SelectItem key={s} value={s}>{locale === "ar" ? ({whatsapp:"واتساب",phone:"هاتف",email:"بريد",walk_in:"حضور",website:"موقع",corporate:"شركات"} as any)[s] ?? s : s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>{t("distance_km")}</Label><Input type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} /></div>
        <div className="space-y-1"><Label>{t("duration_min")}</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
        <div className="space-y-1"><Label>{locale === "ar" ? "دقائق الانتظار" : "Waiting min"}</Label><Input type="number" value={form.waiting_min} onChange={(e) => setForm({ ...form, waiting_min: e.target.value })} /></div>
        <div className="space-y-1"><Label>{locale === "ar" ? "رسوم المطار" : "Airport fee"}</Label><Input type="number" value={form.airport_fee} onChange={(e) => setForm({ ...form, airport_fee: e.target.value })} /></div>
        <div className="space-y-1 md:col-span-2">
          <Label>{t("assign_driver")}</Label>
          <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2"><Label>{locale === "ar" ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <div className="rounded-lg border p-3 bg-muted/40 text-sm space-y-1">
        <div className="flex justify-between"><span>{locale === "ar" ? "الأساسي" : "Base"}</span><span>{baseFare.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{locale === "ar" ? "المسافة" : "Distance"}</span><span>{distanceFare.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{locale === "ar" ? "الوقت" : "Time"}</span><span>{timeFare.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{locale === "ar" ? "الانتظار" : "Waiting"}</span><span>{waitingFare.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{locale === "ar" ? "المطار" : "Airport"}</span><span>{airportFee.toFixed(2)}</span></div>
        {isNight && <div className="flex justify-between text-warning"><span>{locale === "ar" ? "رسوم ليلية (١٥٪)" : "Night surcharge (15%)"}</span><span>{night.toFixed(2)}</span></div>}
        <div className="flex justify-between font-bold pt-1 border-t"><span>{t("estimated_fare")}</span><span>{totalFare.toFixed(2)}</span></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onDone()}>{t("cancel")}</Button>
        <Button disabled={!form.customer_id || !form.pickup_location || !form.dropoff_location || create.isPending} onClick={() => create.mutate()}>
          <UserPlus2 className="h-4 w-4 me-1" /> {t("book_now")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
