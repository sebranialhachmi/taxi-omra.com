import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, IdCard, Car, ShieldCheck, ClipboardCheck, Wrench, CalendarCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/reminders")({ component: RemindersPage });

// Reminder windows (days). Spec: warn 90/60/30/14/7/1 days before expiry.
const WINDOWS_EN = [
  { key: "expired", label: "Expired", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  { key: "7", label: "≤ 7 days", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  { key: "30", label: "≤ 30 days", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { key: "90", label: "≤ 90 days", cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
];
const WINDOWS_AR = [
  { key: "expired", label: "منتهية", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  { key: "7", label: "خلال 7 أيام", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  { key: "30", label: "خلال 30 يوم", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { key: "90", label: "خلال 90 يوم", cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
];

function bucket(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const days = (new Date(dateStr).getTime() - Date.now()) / 86400_000;
  if (days < 0) return "expired";
  if (days <= 7) return "7";
  if (days <= 30) return "30";
  if (days <= 90) return "90";
  return null;
}

type Item = {
  id: string; kind: string; icon: any; title: string; subtitle?: string;
  date: string; bucket: string; href?: any;
};

function RemindersPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const WINDOWS = ar ? WINDOWS_AR : WINDOWS_EN;
  const [tab, setTab] = useState<string>("all");

  const drivers = useQuery({
    queryKey: ["reminders-drivers"],
    queryFn: async () => (await supabase.from("drivers").select("id, full_name, license_expiry, id_expiry, passport_expiry, visa_expiry").eq("is_active", true)).data ?? [],
  });
  const vehicles = useQuery({
    queryKey: ["reminders-vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("id, plate_number, make, model, insurance_expiry, inspection_expiry, registration_expiry, next_service_at, next_service_km, current_odometer_km")).data ?? [],
  });
  const maintenance = useQuery({
    queryKey: ["reminders-maintenance"],
    queryFn: async () => (await supabase.from("vehicle_maintenance").select("id, vehicle_id, description, scheduled_at, status").in("status", ["scheduled", "in_progress"])).data ?? [],
  });
  const bookings = useQuery({
    queryKey: ["reminders-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("id, code, pickup_at, pickup_location, dropoff_location, customer:customers(full_name)")
      .in("status", ["pending", "confirmed", "assigned"])
      .gte("pickup_at", new Date().toISOString())
      .lte("pickup_at", new Date(Date.now() + 7 * 86400_000).toISOString())
      .order("pickup_at")).data ?? [],
  });

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    (drivers.data ?? []).forEach((d: any) => {
      const push = (kind: string, date: string | null, label: string) => {
        const b = bucket(date);
        if (b) out.push({ id: `${d.id}-${kind}`, kind, icon: IdCard, title: d.full_name, subtitle: label, date: date!, bucket: b,
          href: { to: "/admin/drivers/$id" as const, params: { id: d.id } } });
      };
      push("license", d.license_expiry, "License expiry");
      push("id", d.id_expiry, "National ID expiry");
      push("passport", d.passport_expiry, "Passport expiry");
      push("visa", d.visa_expiry, "Visa expiry");
    });
    (vehicles.data ?? []).forEach((v: any) => {
      const label = `${v.make ?? ""} ${v.model ?? ""} · ${v.plate_number ?? ""}`.trim();
      const push = (kind: string, date: string | null, sub: string) => {
        const b = bucket(date);
        if (b) out.push({ id: `${v.id}-${kind}`, kind, icon: Car, title: label, subtitle: sub, date: date!, bucket: b,
          href: { to: "/admin/fleet/$id" as const, params: { id: v.id } } });
      };
      push("insurance", v.insurance_expiry, "Insurance expiry");
      push("inspection", v.inspection_expiry, "Inspection expiry");
      push("registration", v.registration_expiry, "Registration expiry");
      // Service reminder: next_service_km within 500 km OR next_service_at in <30d
      if (v.next_service_at) push("service", v.next_service_at, "Service due");
      if (v.next_service_km && v.current_odometer_km && v.next_service_km - v.current_odometer_km <= 500) {
        out.push({ id: `${v.id}-service-km`, kind: "service", icon: Wrench, title: label, subtitle: `Service due at ${v.next_service_km} km (now ${v.current_odometer_km})`, date: new Date().toISOString(), bucket: "7", href: { to: "/admin/fleet/$id" as const, params: { id: v.id } } });
      }
    });
    (maintenance.data ?? []).forEach((m: any) => {
      const b = bucket(m.scheduled_at);
      if (b) out.push({ id: `maint-${m.id}`, kind: "maintenance", icon: Wrench, title: m.description ?? "Maintenance", subtitle: `Scheduled ${new Date(m.scheduled_at).toLocaleDateString()}`, date: m.scheduled_at, bucket: b, href: { to: "/admin/maintenance" as const } });
    });
    (bookings.data ?? []).forEach((bk: any) => {
      const b = bucket(bk.pickup_at);
      if (b) out.push({ id: `bk-${bk.id}`, kind: "booking", icon: CalendarCheck,
        title: `${bk.code ?? ""} — ${bk.customer?.full_name ?? ""}`,
        subtitle: `${bk.pickup_location ?? ""} → ${bk.dropoff_location ?? ""}`,
        date: bk.pickup_at, bucket: b, href: { to: "/admin/bookings" as const } });
    });
    return out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [drivers.data, vehicles.data, maintenance.data, bookings.data]);

  const filtered = items.filter((i) => tab === "all" || i.kind === tab);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    WINDOWS.forEach((w) => (c[w.key] = 0));
    items.forEach((i) => (c[i.bucket] = (c[i.bucket] ?? 0) + 1));
    return c;
  }, [items]);

  const kindIcon: Record<string, any> = { license: IdCard, id: IdCard, passport: IdCard, visa: IdCard, insurance: ShieldCheck, inspection: ClipboardCheck, registration: ClipboardCheck, service: Wrench, maintenance: Wrench, booking: CalendarCheck };

  return (
    <div>
      <PageHeader
        title={locale === "ar" ? "التنبيهات والتذكيرات" : "Reminders"}
        description={locale === "ar" ? "انتهاء الوثائق والتأمين وحجوزات قريبة" : "Expiring documents, insurance, inspection, service, and upcoming bookings"}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {WINDOWS.map((w) => (
          <Card key={w.key} className={`p-4 border ${w.cls}`}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider">{w.label}</div>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="font-display text-3xl mt-2">{counts[w.key] ?? 0}</div>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">{ar ? `الكل (${items.length})` : `All (${items.length})`}</TabsTrigger>
          <TabsTrigger value="license">{ar ? "الرخص" : "Licenses"}</TabsTrigger>
          <TabsTrigger value="insurance">{ar ? "التأمين" : "Insurance"}</TabsTrigger>
          <TabsTrigger value="inspection">{ar ? "الفحص" : "Inspection"}</TabsTrigger>
          <TabsTrigger value="registration">{ar ? "الاستمارة" : "Registration"}</TabsTrigger>
          <TabsTrigger value="service">{ar ? "الخدمة" : "Service"}</TabsTrigger>
          <TabsTrigger value="maintenance">{ar ? "الصيانة" : "Maintenance"}</TabsTrigger>
          <TabsTrigger value="booking">{ar ? "الحجوزات" : "Bookings"}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground border rounded-lg">
            {ar ? "لا توجد تنبيهات" : "Nothing needs attention. Nice."}
          </div>
        )}
        {filtered.map((i) => {
          const Icon = kindIcon[i.kind] ?? AlertTriangle;
          const w = WINDOWS.find((x) => x.key === i.bucket)!;
          const days = Math.ceil((new Date(i.date).getTime() - Date.now()) / 86400_000);
          return (
            <Link key={i.id} to={i.href?.to} params={i.href?.params} className="block">
              <Card className={`p-3 hover:border-gold/50 transition border ${w.cls} border-l-4`}>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                  </div>
                  <div className="text-end">
                    <Badge variant="outline" className="text-[10px]">{w.label}</Badge>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {ar ? (days < 0 ? `متأخر ${Math.abs(days)} يوم` : `خلال ${days} يوم`) : (days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`)}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
