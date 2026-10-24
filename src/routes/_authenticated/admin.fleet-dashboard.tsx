import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryPill, daysUntil } from "@/components/ExpiryPill";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Wrench, ShieldAlert, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/fleet-dashboard")({ component: FleetDashboard });

function FleetDashboard() {
  const { locale } = useI18n();
  const vehicles = useQuery({ queryKey: ["fleet-vehicles"], queryFn: async () => (await supabase.from("vehicles").select("id, plate_number, make, model, status, current_mileage, next_maintenance_date, registration_expiry, insurance_expiry, inspection_expiry, category:vehicle_categories(code)")).data ?? [] });
  const drivers = useQuery({ queryKey: ["fleet-drivers"], queryFn: async () => (await supabase.from("drivers").select("id, full_name, status, employment_status, license_expiry, medical_expiry, work_permit_expiry, insurance_expiry, total_trips, total_earnings")).data ?? [] });
  const maint = useQuery({ queryKey: ["fleet-maint-30"], queryFn: async () => (await supabase.from("vehicle_maintenance").select("cost, service_date").gte("service_date", new Date(Date.now() - 30 * 86400_000).toISOString().slice(0,10))).data ?? [] });

  const vList = vehicles.data ?? [];
  const dList = drivers.data ?? [];
  const byStatus = (arr: any[], key = "status") => arr.reduce((acc: any, x: any) => { acc[x[key]] = (acc[x[key]] ?? 0) + 1; return acc; }, {});
  const vs = byStatus(vList);
  const ds = byStatus(dList);
  const monthCost = (maint.data ?? []).reduce((s: number, m: any) => s + Number(m.cost ?? 0), 0);

  const alerting = vList.filter((v: any) => {
    const d = [v.registration_expiry, v.insurance_expiry, v.inspection_expiry].filter(Boolean).map((x: string) => daysUntil(x)!);
    return (v.next_maintenance_date && daysUntil(v.next_maintenance_date)! <= 14) || d.some((n) => n <= 30);
  });
  const driverAlerts = dList.filter((d: any) =>
    [d.license_expiry, d.medical_expiry, d.work_permit_expiry, d.insurance_expiry].filter(Boolean).some((x: string) => daysUntil(x)! <= 30)
  );

  const utilization = vList.length > 0 ? Math.round(((vs["on_trip"] ?? 0) + (vs["assigned"] ?? 0)) / vList.length * 100) : 0;
  const driverUtil = dList.length > 0 ? Math.round(((ds["on_trip"] ?? 0) + (ds["en_route"] ?? 0) + (ds["assigned"] ?? 0)) / dList.length * 100) : 0;

  const ar = locale === "ar";
  return (
    <div>
      <PageHeader eyebrow={ar ? "نظرة عامة" : "Overview"} title={ar ? "لوحة الأسطول" : "Fleet Dashboard"} description={ar ? "حالة السائقين والمركبات في الوقت الحقيقي" : "Real-time driver and vehicle operations"} />

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <StatCard label={ar ? "المركبات" : "Vehicles"} value={vList.length} icon={Car} />
        <StatCard label={ar ? "السائقون" : "Drivers"} value={dList.length} icon={Users} />
        <StatCard label={ar ? "استخدام الأسطول" : "Fleet utilization"} value={`${utilization}%`} icon={TrendingUp} tone="chart2" />
        <StatCard label={ar ? "تكلفة الصيانة (30 يوم)" : "Maint. cost (30d)"} value={monthCost.toFixed(2)} icon={Wrench} tone="warning" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card><CardContent className="p-5">
          <div className="text-[10px] tracking-widest text-muted-foreground mb-3">{ar ? "حالة المركبات" : "Vehicle status"}</div>
          <div className="space-y-2">
            {["active","assigned","on_trip","reserved","maintenance","out_of_service","retired"].map(s => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge value={s} />
                <span className="tabular-nums font-medium">{vs[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-widest text-muted-foreground">{ar ? "حالة السائقين" : "Driver status"}</div>
            <div className="text-[10px] text-muted-foreground">{ar ? `الاستخدام ${driverUtil}%` : `Utilization ${driverUtil}%`}</div>
          </div>
          <div className="space-y-2">
            {["available","assigned","en_route","on_trip","waiting","on_break","vacation","offline","suspended"].map(s => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge value={s} />
                <span className="tabular-nums font-medium">{ds[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-widest text-muted-foreground flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" />{ar ? "تنبيهات المركبات" : "Vehicle alerts"}</div>
            <span className="text-xs text-muted-foreground">{alerting.length}</span>
          </div>
          {alerting.length === 0 ? <div className="text-sm text-muted-foreground py-6 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{ar ? "جميع المركبات مطابقة." : "All vehicles compliant."}</div> :
            <div className="divide-y max-h-80 overflow-y-auto">
              {alerting.slice(0, 20).map((v: any) => (
                <Link key={v.id} to={"/admin/fleet/$id" as any} params={{ id: v.id } as any} className="flex items-center justify-between py-2 hover:bg-muted/30 -mx-2 px-2">
                  <div>
                    <div className="font-mono text-sm">{v.plate_number}</div>
                    <div className="text-xs text-muted-foreground">{v.make} {v.model}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {v.next_maintenance_date && daysUntil(v.next_maintenance_date)! <= 14 && <ExpiryPill date={v.next_maintenance_date} label={ar ? "صيانة" : "Service"} />}
                    {v.registration_expiry && daysUntil(v.registration_expiry)! <= 30 && <ExpiryPill date={v.registration_expiry} label={ar ? "استمارة" : "Reg"} />}
                    {v.insurance_expiry && daysUntil(v.insurance_expiry)! <= 30 && <ExpiryPill date={v.insurance_expiry} label={ar ? "تأمين" : "Ins"} />}
                    {v.inspection_expiry && daysUntil(v.inspection_expiry)! <= 30 && <ExpiryPill date={v.inspection_expiry} label={ar ? "فحص" : "Insp"} />}
                  </div>
                </Link>
              ))}
            </div>
          }
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-widest text-muted-foreground flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" />{ar ? "تنبيهات السائقين" : "Driver alerts"}</div>
            <span className="text-xs text-muted-foreground">{driverAlerts.length}</span>
          </div>
          {driverAlerts.length === 0 ? <div className="text-sm text-muted-foreground py-6 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{ar ? "جميع السائقين مطابقون." : "All drivers compliant."}</div> :
            <div className="divide-y max-h-80 overflow-y-auto">
              {driverAlerts.slice(0, 20).map((d: any) => (
                <Link key={d.id} to={"/admin/drivers/$id" as any} params={{ id: d.id } as any} className="flex items-center justify-between py-2 hover:bg-muted/30 -mx-2 px-2">
                  <div className="text-sm">{d.full_name}</div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                    {d.license_expiry && daysUntil(d.license_expiry)! <= 30 && <ExpiryPill date={d.license_expiry} label={ar ? "رخصة" : "Lic"} />}
                    {d.medical_expiry && daysUntil(d.medical_expiry)! <= 30 && <ExpiryPill date={d.medical_expiry} label={ar ? "طبي" : "Med"} />}
                    {d.work_permit_expiry && daysUntil(d.work_permit_expiry)! <= 30 && <ExpiryPill date={d.work_permit_expiry} label={ar ? "تصريح" : "Permit"} />}
                    {d.insurance_expiry && daysUntil(d.insurance_expiry)! <= 30 && <ExpiryPill date={d.insurance_expiry} label={ar ? "تأمين" : "Ins"} />}
                  </div>
                </Link>
              ))}
            </div>
          }
        </CardContent></Card>
      </div>
    </div>
  );
}
