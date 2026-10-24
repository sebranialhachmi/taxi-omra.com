import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { CalendarCheck, DollarSign, Users, Car, Clock, ListChecks, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Area, AreaChart,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";

  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();
      const [tripsToday, activeTrips, pending, availDrivers, customers, revenueRes, weekly] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["assigned", "en_route", "on_trip"]),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("drivers").select("id", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "paid").gte("created_at", iso),
        supabase.from("bookings").select("created_at, total_fare").gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()),
      ]);
      const revenueToday = (revenueRes.data ?? []).reduce((a, b: any) => a + Number(b.amount || 0), 0);
      const byDay = new Map<string, { trips: number; revenue: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        byDay.set(d.toISOString().slice(0, 10), { trips: 0, revenue: 0 });
      }
      (weekly.data ?? []).forEach((row: any) => {
        const k = new Date(row.created_at).toISOString().slice(0, 10);
        const cur = byDay.get(k); if (cur) { cur.trips += 1; cur.revenue += Number(row.total_fare || 0); }
      });
      const chart = Array.from(byDay.entries()).map(([day, v]) => ({ day: day.slice(5), ...v }));
      return {
        tripsToday: tripsToday.count ?? 0, activeTrips: activeTrips.count ?? 0,
        pending: pending.count ?? 0, availDrivers: availDrivers.count ?? 0,
        customers: customers.count ?? 0, revenueToday, chart,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: async () => (await supabase.from("bookings")
      .select("id, code, status, total_fare, pickup_location, dropoff_location, created_at")
      .order("created_at", { ascending: false }).limit(8)).data ?? [],
  });

  const s = stats.data;
  const fmt = (n: number) => new Intl.NumberFormat(ar ? "ar" : "en", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "لوحة الإدارة" : "Overview"}
        title={t("dashboard")}
        description={ar ? "نظرة عامة على أداء اليوم" : "Today's operational overview"}
        actions={<Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/admin/bookings">{ar ? "كل الحجوزات" : "All bookings"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></Link></Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {stats.isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : (
          <>
            <StatCard label={t("trips_today")} value={s?.tripsToday ?? 0} icon={CalendarCheck} tone="primary" />
            <StatCard label={t("revenue")} value={s ? fmt(s.revenueToday) : "—"} icon={DollarSign} tone="success" />
            <StatCard label={t("active_trips")} value={s?.activeTrips ?? 0} icon={Clock} tone="chart2" />
            <StatCard label={t("pending_bookings")} value={s?.pending ?? 0} icon={ListChecks} tone="warning" />
            <StatCard label={t("available_drivers")} value={s?.availDrivers ?? 0} icon={Car} tone="primary" />
            <StatCard label={t("total_customers")} value={s?.customers ?? 0} icon={Users} tone="chart2" />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3 mt-6">
        <Card className="xl:col-span-2 rounded-2xl border-border/70">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-1">{ar ? "٧ أيام" : "7 days"}</div>
              <CardTitle className="font-display text-xl">{ar ? "الرحلات" : "Trips"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s?.chart ?? []} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
                <Bar dataKey="trips" fill="var(--color-gold)" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-1">{ar ? "أسبوعي" : "Weekly"}</div>
              <CardTitle className="font-display text-xl">{ar ? "الإيرادات" : "Revenue"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s?.chart ?? []} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-gold)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl border-border/70">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-1">{ar ? "أحدث" : "Latest"}</div>
            <CardTitle className="font-display text-xl">{ar ? "آخر الحجوزات" : "Recent bookings"}</CardTitle>
          </div>
          <Button asChild size="sm" variant="ghost" className="rounded-full text-muted-foreground"><Link to="/admin/bookings">{ar ? "الكل" : "View all"} <ArrowRight className="h-4 w-4 ms-1.5 rtl:rotate-180" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                <TableHead className="text-[10px] uppercase tracking-wider">{t("code")}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t("pickup")}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t("dropoff")}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t("fare")}</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recent.data ?? []).map((b: any) => (
                <TableRow key={b.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">{b.code}</TableCell>
                  <TableCell className="max-w-40 truncate text-sm">{b.pickup_location}</TableCell>
                  <TableCell className="max-w-40 truncate text-sm">{b.dropoff_location}</TableCell>
                  <TableCell className="font-display text-base">{b.total_fare ? fmt(Number(b.total_fare)) : "—"}</TableCell>
                  <TableCell><StatusBadge value={b.status} /></TableCell>
                </TableRow>
              ))}
              {(recent.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">{t("no_data")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
