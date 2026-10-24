import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useHasPermission } from "@/lib/rbac";
import { rangeFromKey, fetchRevenueRaw, groupBy, timeSeries, computeKPIs, money, num } from "@/lib/analytics";
import { ExportMenu } from "@/components/ExportMenu";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Car, TrendingUp, TrendingDown, Percent, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: Analytics });

const COLORS = ["#c9a961", "#8b7d5b", "#4b5563", "#111827", "#6b7280", "#d1a35c", "#e5c78e", "#9e803a"];

function Analytics() {
  const { locale } = useI18n();
  const gate = useHasPermission("analytics.view");
  const [rangeKey, setRangeKey] = useState<"7d"|"30d"|"90d"|"365d"|"mtd"|"ytd">("30d");
  const range = useMemo(() => rangeFromKey(rangeKey), [rangeKey]);

  const bookings = useQuery({
    queryKey: ["analytics-bookings", rangeKey],
    queryFn: () => fetchRevenueRaw(range),
    enabled: gate.allowed,
  });
  const customers = useQuery({
    queryKey: ["analytics-customers"],
    queryFn: async () => (await supabase.from("customers").select("id, full_name, total_trips, total_spent, avg_booking_value, first_booking_at, last_booking_at, status").order("total_spent", { ascending: false })).data ?? [],
    enabled: gate.allowed,
  });
  const drivers = useQuery({
    queryKey: ["analytics-drivers"],
    queryFn: async () => (await supabase.from("drivers").select("id, full_name, total_trips, completed_trips, total_earnings, rating, status").order("total_trips", { ascending: false })).data ?? [],
    enabled: gate.allowed,
  });
  const vehicles = useQuery({
    queryKey: ["analytics-vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("id, plate_number, model, status")).data ?? [],
    enabled: gate.allowed,
  });

  if (!gate.loading && !gate.allowed) return <div className="p-8 text-center text-muted-foreground">Not authorized</div>;

  const rows = bookings.data ?? [];
  const kpi = useMemo(() => computeKPIs(rows), [rows]);
  const dailyKpi = useMemo(() => computeKPIs(rows.filter((r: any) => new Date(r.created_at).toDateString() === new Date().toDateString())), [rows]);

  const daily = useMemo(() => timeSeries(rows, range, "day"), [rows, range]);
  const weekly = useMemo(() => timeSeries(rows, range, "week"), [rows, range]);
  const monthly = useMemo(() => timeSeries(rows, range, "month"), [rows, range]);

  const popularRoutes = useMemo(() => groupBy(rows, (r: any) => r.route?.name, () => 1).slice(0, 10), [rows]);
  const popularCities = useMemo(() => groupBy(rows, (r: any) => r.customer?.city, () => 1).slice(0, 10), [rows]);
  const popularAirports = useMemo(() => groupBy(rows.filter((r: any) => r.route?.from_airport || r.route?.to_airport), (r: any) => r.route?.from_airport || r.route?.to_airport, () => 1), [rows]);
  const popularServices = useMemo(() => groupBy(rows, (r: any) => r.category?.name, () => 1), [rows]);
  const popularVehicles = useMemo(() => groupBy(rows, (r: any) => r.vehicle?.model, () => 1).slice(0, 10), [rows]);
  const bookingSources = useMemo(() => groupBy(rows, (r: any) => r.source ?? "direct", () => 1), [rows]);

  const topCustomers = (customers.data ?? []).slice(0, 10);
  const topDrivers = (drivers.data ?? []).slice(0, 10);
  const repeatRate = (customers.data ?? []).length
    ? ((customers.data ?? []).filter((c: any) => (c.total_trips ?? 0) >= 2).length / (customers.data ?? []).length) * 100
    : 0;

  const activeDrivers = (drivers.data ?? []).filter((d: any) => d.status !== "inactive").length;
  const totalDrivers = (drivers.data ?? []).length;
  const activeVehicles = (vehicles.data ?? []).filter((v: any) => v.status === "active").length;
  const totalVehicles = (vehicles.data ?? []).length;

  const driverUtilization = totalDrivers ? (activeDrivers / totalDrivers) * 100 : 0;
  const fleetUtilization = totalVehicles ? (activeVehicles / totalVehicles) * 100 : 0;

  const ltv = (customers.data ?? []).reduce((s: number, c: any) => s + num(c.total_spent), 0) / Math.max(1, (customers.data ?? []).length);
  const fmt = (n: number) => money(locale, n);

  return (
    <div>
      <PageHeader
        title={locale === "ar" ? "التحليلات التنفيذية" : "Executive Analytics"}
        description={locale === "ar" ? "مؤشرات الأداء الرئيسية وأداء العمليات" : "KPIs, conversion, utilization and top performers"}
        actions={
          <Select value={rangeKey} onValueChange={(v: any) => setRangeKey(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="mtd">Month to date</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="365d">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={locale === "ar" ? "إيراد الفترة" : "Period Revenue"} value={fmt(kpi.revenue)} icon={TrendingUp} tone="primary" />
        <StatCard label={locale === "ar" ? "الرحلات" : "Trips"} value={kpi.total.toString()} icon={Activity} />
        <StatCard label={locale === "ar" ? "متوسط الحجز" : "Avg. Booking"} value={fmt(kpi.avg)} icon={Sparkles} tone="success" />
        <StatCard label={locale === "ar" ? "قيمة العميل" : "Customer LTV"} value={fmt(ltv)} icon={Trophy} />
        <StatCard label={locale === "ar" ? "معدل التحويل" : "Conversion Rate"} value={`${kpi.conversionRate.toFixed(1)}%`} icon={Percent} tone="success" />
        <StatCard label={locale === "ar" ? "معدل الإلغاء" : "Cancellation Rate"} value={`${kpi.cancellationRate.toFixed(1)}%`} icon={TrendingDown} tone="warning" />
        <StatCard label={locale === "ar" ? "معدل عدم الحضور" : "No-Show Rate"} value={`${kpi.noshowRate.toFixed(1)}%`} icon={TrendingDown} tone="warning" />
        <StatCard label={locale === "ar" ? "العملاء المتكررون" : "Repeat Rate"} value={`${repeatRate.toFixed(1)}%`} icon={Users} tone="primary" />
      </div>

      {/* Utilization gauges */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">{locale === "ar" ? "استخدام السائقين" : "Driver utilization"}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-display">{driverUtilization.toFixed(0)}<span className="text-lg text-muted-foreground">%</span></div>
            <div className="text-xs text-muted-foreground mt-1">{activeDrivers} / {totalDrivers} active</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{locale === "ar" ? "استخدام الأسطول" : "Fleet utilization"}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-display">{fleetUtilization.toFixed(0)}<span className="text-lg text-muted-foreground">%</span></div>
            <div className="text-xs text-muted-foreground mt-1">{activeVehicles} / {totalVehicles} active</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{locale === "ar" ? "اليوم" : "Today"}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-display">{dailyKpi.total}</div>
            <div className="text-xs text-muted-foreground mt-1">{fmt(dailyKpi.revenue)} · avg {fmt(dailyKpi.avg)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trend">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="trend">Trends</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="drivers">Top Drivers</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{locale === "ar" ? "يومي" : "Daily"}</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="key" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{locale === "ar" ? "أسبوعي" : "Weekly"}</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <BarChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="key" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#c9a961" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>{locale === "ar" ? "شهري" : "Monthly"}</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="key" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#c9a961" name="Revenue" />
                    <Bar dataKey="trips" fill="#4b5563" name="Trips" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popular">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Popular routes", data: popularRoutes },
              { title: "Popular cities", data: popularCities },
              { title: "Popular airports", data: popularAirports },
              { title: "Popular services", data: popularServices },
              { title: "Popular vehicles", data: popularVehicles },
            ].map((b) => (
              <Card key={b.title}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">{b.title}</CardTitle>
                  <ExportMenu module="analytics" filename={b.title.toLowerCase().replaceAll(" ", "-")} rows={b.data} columns={[{ key: "key", label: "Name" }, { key: "count", label: "Bookings" }]} title={b.title} />
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {b.data.slice(0, 8).map((r, i) => (
                        <TableRow key={r.key}>
                          <TableCell className="w-6 text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="truncate max-w-[280px]">{r.key}</TableCell>
                          <TableCell className="text-end"><Badge variant="secondary">{r.count}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {!b.data.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{locale === "ar" ? "أفضل العملاء" : "Top customers by lifetime value"}</CardTitle>
              <ExportMenu module="analytics" filename="top-customers" rows={topCustomers} columns={[{ key: "full_name", label: "Customer" }, { key: "total_trips", label: "Trips" }, { key: "total_spent", label: "Total Spent" }, { key: "avg_booking_value", label: "Avg Booking" }, { key: "status", label: "Status" }]} title="Top Customers" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Trips</TableHead><TableHead>Total</TableHead><TableHead>Avg</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topCustomers.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>{c.total_trips ?? 0}</TableCell>
                      <TableCell className="font-mono">{fmt(num(c.total_spent))}</TableCell>
                      <TableCell className="font-mono">{fmt(num(c.avg_booking_value))}</TableCell>
                      <TableCell><Badge variant="outline">{c.status ?? "—"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{locale === "ar" ? "أفضل السائقين" : "Top drivers"}</CardTitle>
              <ExportMenu module="analytics" filename="top-drivers" rows={topDrivers} columns={[{ key: "full_name", label: "Driver" }, { key: "total_trips", label: "Trips" }, { key: "completed_trips", label: "Completed" }, { key: "total_earnings", label: "Earnings" }, { key: "rating", label: "Rating" }]} title="Top Drivers" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Trips</TableHead><TableHead>Completed</TableHead><TableHead>Earnings</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topDrivers.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.full_name}</TableCell>
                      <TableCell>{d.total_trips ?? 0}</TableCell>
                      <TableCell>{d.completed_trips ?? 0}</TableCell>
                      <TableCell className="font-mono">{fmt(num(d.total_earnings))}</TableCell>
                      <TableCell>{d.rating ? `★ ${Number(d.rating).toFixed(1)}` : "—"}</TableCell>
                      <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader><CardTitle>{locale === "ar" ? "مصادر الحجز" : "Booking sources"}</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={bookingSources} dataKey="count" nameKey="key" outerRadius={100} label={(e: any) => `${e.key}: ${e.count}`}>
                    {bookingSources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
