import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MapPin, Clock, User2, Car, Star, RefreshCw, Search, ArrowRight, CheckCircle2, XCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/dispatch")({ component: DispatchPage });

type Booking = {
  id: string; code: string | null; status: string;
  pickup_location: string | null; dropoff_location: string | null;
  pickup_at: string | null; total_fare: number | null; distance_km: number | null;
  is_priority: boolean | null;
  customer: { id: string; full_name: string | null; phone: string | null } | null;
  driver: { id: string; full_name: string | null } | null;
  vehicle: { id: string; plate_number: string | null } | null;
  category: { id: string; code: string | null } | null;
};

const dayBounds = (offset = 0) => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset);
  const end = new Date(d); end.setDate(end.getDate() + 1);
  return { start: d.toISOString(), end: end.toISOString() };
};

function DispatchPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [tab, setTab] = useState<"queue" | "today" | "upcoming" | "live">("queue");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState("");

  const bookings = useQuery({
    queryKey: ["dispatch-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, code, status, pickup_location, dropoff_location, pickup_at, total_fare, distance_km, is_priority, customer:customers(id, full_name, phone), driver:drivers(id, full_name), vehicle:vehicles(id, plate_number), category:vehicle_categories(id, code)")
        .in("status", ["pending", "confirmed", "assigned", "en_route", "on_trip", "picked_up"])
        .order("is_priority", { ascending: false })
        .order("pickup_at", { ascending: true, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
    refetchInterval: 15000,
  });

  const drivers = useQuery({
    queryKey: ["dispatch-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, full_name, status, phone, vehicle:vehicles(id, plate_number)")
        .eq("is_active", true)
        .order("status")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const today = dayBounds(0);
  const filtered = useMemo(() => {
    const rows = bookings.data ?? [];
    if (tab === "queue") return rows.filter(b => !b.driver && ["pending", "confirmed"].includes(b.status));
    if (tab === "today") return rows.filter(b => b.pickup_at && b.pickup_at >= today.start && b.pickup_at < today.end);
    if (tab === "upcoming") return rows.filter(b => b.pickup_at && b.pickup_at >= today.end);
    return rows.filter(b => ["assigned", "en_route", "on_trip", "picked_up"].includes(b.status));
  }, [bookings.data, tab, today.start, today.end]);

  const selected = filtered.find(b => b.id === selectedId) ?? (bookings.data ?? []).find(b => b.id === selectedId);

  const assign = useMutation({
    mutationFn: async ({ bookingId, driverId, vehicleId }: { bookingId: string; driverId: string; vehicleId: string | null }) => {
      const patch: any = { driver_id: driverId, vehicle_id: vehicleId, status: "assigned" };
      const { error } = await supabase.from("bookings").update(patch).eq("id", bookingId);
      if (error) throw error;
      await supabase.from("drivers").update({ status: "on_trip" }).eq("id", driverId);
    },
    onSuccess: () => {
      toast.success(ar ? "تم تعيين السائق" : "Driver assigned");
      qc.invalidateQueries({ queryKey: ["dispatch-bookings"] });
      qc.invalidateQueries({ queryKey: ["dispatch-drivers"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status, freeDriverId }: { id: string; status: string; freeDriverId?: string | null }) => {
      const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", id);
      if (error) throw error;
      if (freeDriverId && (status === "completed" || status === "cancelled" || status === "no_show")) {
        await supabase.from("drivers").update({ status: "available" }).eq("id", freeDriverId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dispatch-bookings"] });
      qc.invalidateQueries({ queryKey: ["dispatch-drivers"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const availableDrivers = (drivers.data ?? []).filter((d: any) => {
    if (driverSearch && !d.full_name?.toLowerCase().includes(driverSearch.toLowerCase())) return false;
    if (selected?.driver?.id === d.id) return true;
    return d.status === "available" || d.status === "offline";
  });

  const queueCount = (bookings.data ?? []).filter(b => !b.driver && ["pending","confirmed"].includes(b.status)).length;

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "غرفة العمليات" : "Operations"}
        title={ar ? "مركز الإرسال" : "Dispatch Center"}
        description={ar ? "متابعة الحجوزات المباشرة وتعيين السائقين" : "Live queue and one-click driver assignment"}
        actions={
          <Button variant="outline" size="sm" onClick={() => { bookings.refetch(); drivers.refetch(); }}>
            <RefreshCw className="h-4 w-4 me-2" />{ar ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelectedId(null); }}>
            <TabsList className="mb-3">
              <TabsTrigger value="queue">{ar ? "الطابور" : "Queue"} <Badge variant="secondary" className="ms-2">{queueCount}</Badge></TabsTrigger>
              <TabsTrigger value="today">{ar ? "اليوم" : "Today"}</TabsTrigger>
              <TabsTrigger value="upcoming">{ar ? "قادم" : "Upcoming"}</TabsTrigger>
              <TabsTrigger value="live">{ar ? "مباشر" : "Live"}</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground text-sm border rounded-lg">
                    {ar ? "لا توجد حجوزات" : "No bookings in this view"}
                  </div>
                )}
                {filtered.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={`text-start rounded-lg border p-3 hover:border-gold/60 transition ${selectedId === b.id ? "border-gold bg-gold/5" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {b.is_priority && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                        <span className="font-mono text-xs">{b.code ?? b.id.slice(0,8)}</span>
                      </div>
                      <StatusBadge value={b.status} />
                    </div>
                    <div className="text-sm font-medium truncate">{b.customer?.full_name ?? "—"}</div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-start gap-1.5"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="truncate">{b.pickup_location ?? "—"}</span></div>
                      <div className="flex items-start gap-1.5 ps-4"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0" /><span className="truncate">{b.dropoff_location ?? "—"}</span></div>
                      {b.pickup_at && <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(b.pickup_at).toLocaleString(ar ? "ar" : "en")}</div>}
                      {b.driver && <div className="flex items-center gap-1.5 text-foreground/80"><User2 className="h-3 w-3" />{b.driver.full_name}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Card className="p-4 h-fit sticky top-4">
          {!selected ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {ar ? "اختر حجزاً لعرض خيارات التعيين" : "Select a booking to assign a driver"}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{ar ? "الحجز" : "Booking"}</div>
                <div className="font-mono text-sm">{selected.code}</div>
                <div className="mt-2"><StatusBadge value={selected.status} /></div>
                <div className="mt-3 text-xs space-y-1">
                  <div><span className="text-muted-foreground">{ar ? "العميل:" : "Customer:"}</span> {selected.customer?.full_name ?? "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "الهاتف:" : "Phone:"}</span> {selected.customer?.phone ?? "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "الفئة:" : "Category:"}</span> {selected.category?.code ?? "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "الأجرة:" : "Fare:"}</span> {Number(selected.total_fare ?? 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selected.status === "assigned" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: selected.id, status: "en_route" })}>{ar ? "في الطريق" : "En route"}</Button>
                )}
                {(selected.status === "en_route" || selected.status === "assigned") && (
                  <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: selected.id, status: "picked_up" })}>{ar ? "تم الاستلام" : "Picked up"}</Button>
                )}
                {(selected.status === "picked_up" || selected.status === "on_trip") && (
                  <Button size="sm" onClick={() => setStatus.mutate({ id: selected.id, status: "completed", freeDriverId: selected.driver?.id })}>
                    <CheckCircle2 className="h-3.5 w-3.5 me-1" />{ar ? "إنهاء" : "Complete"}
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus.mutate({ id: selected.id, status: "no_show", freeDriverId: selected.driver?.id })}>
                  <XCircle className="h-3.5 w-3.5 me-1" />{ar ? "لم يحضر" : "No show"}
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {selected.driver ? (ar ? "إعادة تعيين السائق" : "Reassign driver") : (ar ? "تعيين سائق" : "Assign driver")}
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute inset-y-0 my-auto start-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} placeholder={ar ? "ابحث عن سائق…" : "Search drivers..."} className="ps-7 h-8" />
                </div>
                <div className="max-h-80 overflow-auto space-y-1">
                  {availableDrivers.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">{ar ? "لا يوجد سائقون" : "No drivers"}</div>}
                  {availableDrivers.map((d: any) => {
                    const isCurrent = selected.driver?.id === d.id;
                    return (
                      <div key={d.id} className={`flex items-center justify-between gap-2 p-2 rounded border ${isCurrent ? "border-gold bg-gold/5" : "border-border"}`}>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{d.full_name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <StatusBadge value={d.status} />
                            {d.vehicle?.plate_number && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{d.vehicle.plate_number}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isCurrent ? "secondary" : "default"}
                          disabled={isCurrent || assign.isPending}
                          onClick={() => assign.mutate({ bookingId: selected.id, driverId: d.id, vehicleId: d.vehicle?.id ?? null })}
                        >
                          {isCurrent ? (ar ? "الحالي" : "Current") : (ar ? "تعيين" : "Assign")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
