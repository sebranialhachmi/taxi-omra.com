import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/calendar")({ component: CalendarPage });

type View = "day" | "week" | "month";

const startOfWeek = (d: Date) => {
  const n = new Date(d); n.setHours(0, 0, 0, 0);
  const dow = n.getDay();
  n.setDate(n.getDate() - dow);
  return n;
};

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const STATUS_AR: Record<string, string> = {
  pending: "قيد الانتظار", confirmed: "مؤكد", assigned: "مُعيَّن", en_route: "في الطريق",
  on_trip: "في رحلة", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر", picked_up: "تم الاستلام",
};

function CalendarPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selected, setSelected] = useState<any>(null);

  const range = useMemo(() => {
    if (view === "day") return { start: anchor, end: addDays(anchor, 1), days: [anchor] };
    if (view === "week") {
      const s = startOfWeek(anchor);
      return { start: s, end: addDays(s, 7), days: Array.from({ length: 7 }, (_, i) => addDays(s, i)) };
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const s = startOfWeek(first);
    const days = Array.from({ length: 42 }, (_, i) => addDays(s, i));
    return { start: s, end: addDays(s, 42), days };
  }, [view, anchor]);

  const bookings = useQuery({
    queryKey: ["calendar-bookings", range.start.toISOString(), range.end.toISOString()],
    queryFn: async () => (await supabase.from("bookings")
      .select("id, code, status, pickup_at, pickup_location, dropoff_location, driver_id, vehicle_id, customer:customers(full_name), driver:drivers(id, full_name), vehicle:vehicles(id, plate_number)")
      .gte("pickup_at", range.start.toISOString())
      .lt("pickup_at", range.end.toISOString())
      .order("pickup_at")).data ?? [],
  });

  const drivers = useQuery({
    queryKey: ["calendar-drivers"],
    queryFn: async () => (await supabase.from("drivers").select("id, full_name, status").eq("is_active", true).order("full_name")).data ?? [],
  });

  const filteredBookings = useMemo(() => {
    return (bookings.data ?? []).filter((b: any) => {
      if (driverFilter === "unassigned" && b.driver_id) return false;
      if (driverFilter !== "all" && driverFilter !== "unassigned" && b.driver_id !== driverFilter) return false;
      if (statusFilter === "active" && ["cancelled", "no_show", "completed"].includes(b.status)) return false;
      if (statusFilter !== "all" && statusFilter !== "active" && b.status !== statusFilter) return false;
      return true;
    });
  }, [bookings.data, driverFilter, statusFilter]);

  const conflicts = useMemo(() => {
    const byDriver: Record<string, any[]> = {};
    filteredBookings.forEach((b: any) => { if (b.driver_id) (byDriver[b.driver_id] ||= []).push(b); });
    const set = new Set<string>();
    Object.values(byDriver).forEach((list) => {
      const sorted = list.slice().sort((a, b) => new Date(a.pickup_at).getTime() - new Date(b.pickup_at).getTime());
      for (let i = 1; i < sorted.length; i++) {
        const gap = new Date(sorted[i].pickup_at).getTime() - new Date(sorted[i - 1].pickup_at).getTime();
        if (gap < 60 * 60_000) { set.add(sorted[i].id); set.add(sorted[i - 1].id); }
      }
    });
    return set;
  }, [filteredBookings]);

  const move = (n: number) => {
    if (view === "day") setAnchor(addDays(anchor, n));
    else if (view === "week") setAnchor(addDays(anchor, 7 * n));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + n, 1));
  };

  const byDay = (day: Date) => filteredBookings.filter((b: any) => sameDay(new Date(b.pickup_at), day));

  const onDrop = async (bookingId: string, driverId: string | null) => {
    const patch: any = driverId ? { driver_id: driverId, status: "assigned" } : { driver_id: null };
    const { error } = await supabase.from("bookings").update(patch).eq("id", bookingId);
    if (error) return toast.error(error.message);
    toast.success(driverId ? (ar ? "تم تعيين السائق" : "Driver assigned") : (ar ? "تمت إزالة السائق" : "Driver removed"));
    qc.invalidateQueries({ queryKey: ["calendar-bookings"] });
  };

  const locStr = ar ? "ar" : "en";
  const label = view === "month"
    ? anchor.toLocaleDateString(locStr, { month: "long", year: "numeric" })
    : view === "week"
      ? `${range.days[0].toLocaleDateString(locStr)} — ${range.days[6].toLocaleDateString(locStr)}`
      : anchor.toLocaleDateString(locStr, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const WEEKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const WEEKDAYS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weekdayShort = ar ? WEEKDAYS_AR : WEEKDAYS_EN;

  return (
    <div>
      <PageHeader
        title={ar ? "تقويم العمليات" : "Operations Calendar"}
        description={ar ? "عرض وتعيين الحجوزات على السائقين بالسحب والإفلات" : "Drag bookings onto drivers to assign. Conflicts highlighted."}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setAnchor(d); }}>{ar ? "اليوم" : "Today"}</Button>
          <Button variant="outline" size="sm" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
          <div className="ms-3 font-display text-lg">{label}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as View)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{ar ? "يوم" : "Day"}</SelectItem>
              <SelectItem value="week">{ar ? "أسبوع" : "Week"}</SelectItem>
              <SelectItem value="month">{ar ? "شهر" : "Month"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "كل السائقين" : "All drivers"}</SelectItem>
              <SelectItem value="unassigned">{ar ? "غير مُعيَّن" : "Unassigned"}</SelectItem>
              {(drivers.data ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{ar ? "النشطة" : "Active"}</SelectItem>
              <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
              {["pending","confirmed","assigned","en_route","on_trip","completed","cancelled","no_show"].map((s) => <SelectItem key={s} value={s}>{ar ? (STATUS_AR[s] ?? s) : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-1 text-sm">
          {weekdayShort.map((d) => <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground text-center pb-1">{d}</div>)}
          {range.days.map((day, idx) => {
            const items = byDay(day);
            const isCurrentMonth = day.getMonth() === anchor.getMonth();
            return (
              <Card key={idx} className={`p-2 min-h-24 ${isCurrentMonth ? "" : "opacity-40"} ${sameDay(day, new Date()) ? "ring-1 ring-gold" : ""}`}>
                <div className="text-xs font-medium mb-1">{day.getDate()}</div>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((b: any) => (
                    <button key={b.id} onClick={() => setSelected(b)} className={`w-full text-start truncate text-[10px] px-1 py-0.5 rounded ${conflicts.has(b.id) ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
                      {new Date(b.pickup_at).toLocaleTimeString(locStr, { hour: "2-digit", minute: "2-digit" })} · {b.customer?.full_name ?? b.code}
                    </button>
                  ))}
                  {items.length > 3 && <div className="text-[10px] text-muted-foreground">+{items.length - 3} {ar ? "المزيد" : "more"}</div>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${range.days.length}, minmax(0,1fr))` }}>
          {range.days.map((day, idx) => {
            const items = byDay(day);
            return (
              <Card key={idx}
                onDragOver={(e) => e.preventDefault()}
                className={`p-3 min-h-[420px] ${sameDay(day, new Date()) ? "ring-1 ring-gold" : ""}`}
              >
                <div className="pb-2 mb-2 border-b flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{day.toLocaleDateString(locStr, { weekday: "short" })}</div>
                    <div className="font-display text-xl">{day.getDate()}</div>
                  </div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((b: any) => (
                    <div key={b.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
                      onClick={() => setSelected(b)}
                      className={`rounded-lg border p-2 text-xs cursor-pointer hover:border-gold/50 ${conflicts.has(b.id) ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px]">{b.code ?? b.id.slice(0, 6)}</span>
                        {conflicts.has(b.id) && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      </div>
                      <div className="font-medium truncate">{b.customer?.full_name ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(b.pickup_at).toLocaleTimeString(locStr, { hour: "2-digit", minute: "2-digit" })}</div>
                      <div className="text-[10px] truncate text-muted-foreground">{b.pickup_location} → {b.dropoff_location}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <StatusBadge value={b.status} />
                        {b.driver ? <span className="text-[10px] text-muted-foreground truncate">{b.driver.full_name}</span> : <Badge variant="outline" className="text-[10px]">{ar ? "غير مُعيَّن" : "Unassigned"}</Badge>}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">{ar ? "لا توجد حجوزات" : "No bookings"}</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{ar ? "اسحب على السائق للتعيين" : "Drag onto driver to assign"}</div>
        <div className="flex flex-wrap gap-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e.dataTransfer.getData("text/plain"), null)}
            className="rounded-full border border-dashed px-3 py-1.5 text-xs hover:border-gold cursor-pointer"
          >{ar ? "إلغاء التعيين" : "Unassign"}</div>
          {(drivers.data ?? []).map((d: any) => (
            <div key={d.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e.dataTransfer.getData("text/plain"), d.id)}
              className="rounded-full border px-3 py-1.5 text-xs hover:border-gold cursor-pointer flex items-center gap-2"
            >
              <span className={`h-2 w-2 rounded-full ${d.status === "available" ? "bg-green-500" : d.status === "on_trip" ? "bg-yellow-500" : "bg-muted-foreground/40"}`} />
              {d.full_name}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader><DialogTitle>{ar ? "حجز" : "Booking"} {selected.code}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">{ar ? "العميل:" : "Customer:"}</span> {selected.customer?.full_name}</div>
                <div><span className="text-muted-foreground">{ar ? "الوقت:" : "When:"}</span> {new Date(selected.pickup_at).toLocaleString(locStr)}</div>
                <div><span className="text-muted-foreground">{ar ? "المسار:" : "Route:"}</span> {selected.pickup_location} → {selected.dropoff_location}</div>
                <div><span className="text-muted-foreground">{ar ? "السائق:" : "Driver:"}</span> {selected.driver?.full_name ?? (ar ? "غير مُعيَّن" : "Unassigned")}</div>
                <div><span className="text-muted-foreground">{ar ? "المركبة:" : "Vehicle:"}</span> {selected.vehicle?.plate_number ?? "—"}</div>
                <div><span className="text-muted-foreground">{ar ? "الحالة:" : "Status:"}</span> <StatusBadge value={selected.status} /></div>
                {conflicts.has(selected.id) && <div className="rounded border border-destructive/40 bg-destructive/5 text-destructive text-xs p-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{ar ? "تعارض: هذا السائق لديه حجز آخر خلال 60 دقيقة" : "Conflict: this driver has another booking within 60 min"}</div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
