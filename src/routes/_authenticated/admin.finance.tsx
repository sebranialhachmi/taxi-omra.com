import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportMenu } from "@/components/ExportMenu";
import { PermissionGate, useHasPermission } from "@/lib/rbac";
import { useI18n } from "@/lib/i18n";
import { rangeFromKey, fetchRevenueRaw, groupBy, timeSeries, computeKPIs, money, num } from "@/lib/analytics";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Wallet, Receipt, Undo2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/finance")({ component: Finance });

const COLORS = ["#c9a961", "#8b7d5b", "#4b5563", "#111827", "#6b7280", "#d1a35c", "#e5c78e", "#9e803a"];

function Finance() {
  const { locale } = useI18n();
  const gate = useHasPermission("finance.view");
  const [rangeKey, setRangeKey] = useState<"7d"|"30d"|"90d"|"365d"|"mtd"|"ytd">("30d");
  const [unit, setUnit] = useState<"day"|"week"|"month">("day");
  const range = useMemo(() => rangeFromKey(rangeKey), [rangeKey]);

  const bookings = useQuery({
    queryKey: ["finance-bookings", rangeKey],
    queryFn: () => fetchRevenueRaw(range),
    enabled: gate.allowed,
  });
  const payments = useQuery({
    queryKey: ["finance-payments", rangeKey],
    queryFn: async () => (await supabase.from("payments").select("*").gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())).data ?? [],
    enabled: gate.allowed,
  });
  const invoices = useQuery({
    queryKey: ["finance-invoices", rangeKey],
    queryFn: async () => (await supabase.from("invoices").select("*").gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())).data ?? [],
    enabled: gate.allowed,
  });
  const expenses = useQuery({
    queryKey: ["finance-expenses", rangeKey],
    queryFn: async () => (await supabase.from("expenses").select("*").gte("expense_date", range.start.toISOString().slice(0,10)).lte("expense_date", range.end.toISOString().slice(0,10))).data ?? [],
    enabled: gate.allowed,
  });
  const refunds = useQuery({
    queryKey: ["finance-refunds", rangeKey],
    queryFn: async () => (await supabase.from("refunds").select("*").gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())).data ?? [],
    enabled: gate.allowed,
  });

  const rows = bookings.data ?? [];
  const kpi = useMemo(() => computeKPIs(rows), [rows]);

  const series = useMemo(() => timeSeries(rows.filter((r: any) => r.status === "completed"), range, unit), [rows, range, unit]);
  const byCity = useMemo(() => groupBy(rows, (r: any) => r.customer?.city, (r: any) => r.status === "completed" ? r.total_fare : 0).slice(0, 15), [rows]);
  const byRoute = useMemo(() => groupBy(rows, (r: any) => r.route?.name, (r: any) => r.status === "completed" ? r.total_fare : 0).slice(0, 15), [rows]);
  const byAirport = useMemo(() => groupBy(rows.filter((r: any) => r.route?.from_airport || r.route?.to_airport), (r: any) => r.route?.from_airport || r.route?.to_airport, (r: any) => r.status === "completed" ? r.total_fare : 0), [rows]);
  const byService = useMemo(() => groupBy(rows, (r: any) => r.category?.name, (r: any) => r.status === "completed" ? r.total_fare : 0), [rows]);
  const byVehicle = useMemo(() => groupBy(rows, (r: any) => r.vehicle?.plate_number ?? r.vehicle?.model, (r: any) => r.status === "completed" ? r.total_fare : 0).slice(0, 15), [rows]);
  const byDriver = useMemo(() => groupBy(rows, (r: any) => r.driver?.full_name, (r: any) => r.status === "completed" ? r.total_fare : 0).slice(0, 15), [rows]);
  const byCorporate = useMemo(() => groupBy(rows.filter((r: any) => r.customer?.corporate?.company_name), (r: any) => r.customer?.corporate?.company_name, (r: any) => r.status === "completed" ? r.total_fare : 0), [rows]);

  const totalExpenses = (expenses.data ?? []).reduce((s: number, e: any) => s + num(e.amount), 0);
  const outstandingInvoices = (invoices.data ?? []).filter((i: any) => ["issued","overdue","partially_paid"].includes(i.status)).reduce((s: number, i: any) => s + (num(i.total_amount) - num(i.paid_amount)), 0);
  const totalRefunds = (refunds.data ?? []).reduce((s: number, r: any) => s + num(r.amount), 0);

  const expenseByCategory = useMemo(() => groupBy(expenses.data ?? [], (e: any) => e.category, (e: any) => e.amount), [expenses.data]);
  const paymentByMethod = useMemo(() => groupBy(payments.data ?? [], (p: any) => p.method, (p: any) => p.amount), [payments.data]);

  const fmt = (n: number) => money(locale, n);

  if (!gate.loading && !gate.allowed) return <div className="p-8 text-center text-muted-foreground">Not authorized</div>;

  const dimCols = [
    { key: "key", label: locale === "ar" ? "الاسم" : "Name" },
    { key: "count", label: locale === "ar" ? "الرحلات" : "Trips" },
    { key: "total", label: locale === "ar" ? "الإيراد" : "Revenue" },
  ];

  return (
    <div>
      <PageHeader
        title={locale === "ar" ? "الإدارة المالية" : "Finance Overview"}
        description={locale === "ar" ? "الإيرادات والمصروفات والفواتير والمدفوعات" : "Revenue, expenses, invoices, payments and payroll"}
        actions={
          <div className="flex items-center gap-2">
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
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label={locale === "ar" ? "الإيراد" : "Revenue"} value={fmt(kpi.revenue)} icon={TrendingUp} tone="primary" />
        <StatCard label={locale === "ar" ? "متوسط الحجز" : "Avg. Booking"} value={fmt(kpi.avg)} icon={DollarSign} />
        <StatCard label={locale === "ar" ? "المصروفات" : "Expenses"} value={fmt(totalExpenses)} icon={Wallet} tone="warning" />
        <StatCard label={locale === "ar" ? "فواتير مستحقة" : "Outstanding"} value={fmt(outstandingInvoices)} icon={Receipt} />
        <StatCard label={locale === "ar" ? "المرتجعات" : "Refunds"} value={fmt(totalRefunds)} icon={Undo2} tone="warning" />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{locale === "ar" ? "اتجاه الإيراد" : "Revenue trend"}</CardTitle>
          <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="key" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} name={locale === "ar" ? "الإيراد" : "Revenue"} />
              <Line type="monotone" dataKey="trips" stroke="#4b5563" strokeWidth={2} name={locale === "ar" ? "الرحلات" : "Trips"} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="city">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="city">City</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="airport">Airport</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="corporate">Corporate</TabsTrigger>
          <TabsTrigger value="method">Payment method</TabsTrigger>
          <TabsTrigger value="expense">Expense category</TabsTrigger>
        </TabsList>

        {[
          { v: "city", data: byCity, title: "Revenue by city" },
          { v: "route", data: byRoute, title: "Revenue by route" },
          { v: "airport", data: byAirport, title: "Revenue by airport" },
          { v: "service", data: byService, title: "Revenue by service" },
          { v: "vehicle", data: byVehicle, title: "Revenue by vehicle" },
          { v: "driver", data: byDriver, title: "Revenue by driver" },
          { v: "corporate", data: byCorporate, title: "Revenue by corporate account" },
          { v: "method", data: paymentByMethod, title: "Payments by method" },
          { v: "expense", data: expenseByCategory, title: "Expenses by category" },
        ].map(({ v, data, title }) => (
          <TabsContent key={v} value={v}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <ExportMenu module="finance" filename={`finance-${v}-${rangeKey}`} title={title} rows={data} columns={dimCols} />
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-72">
                    <ResponsiveContainer>
                      <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 60 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="key" type="category" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#c9a961" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={data.slice(0, 8)} dataKey="total" nameKey="key" outerRadius={90} label={(e: any) => e.key}>
                          {data.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{locale === "ar" ? "الاسم" : "Name"}</TableHead>
                        <TableHead className="text-end">{locale === "ar" ? "الرحلات" : "Trips"}</TableHead>
                        <TableHead className="text-end">{locale === "ar" ? "الإيراد" : "Revenue"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell>{r.key}</TableCell>
                          <TableCell className="text-end">{r.count}</TableCell>
                          <TableCell className="text-end font-mono">{fmt(r.total)}</TableCell>
                        </TableRow>
                      ))}
                      {!data.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
