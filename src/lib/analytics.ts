// Analytics aggregation helpers — plain client-side supabase queries
// with grouping done in JS. All queries respect RLS (authenticated user).
import { supabase } from "@/integrations/supabase/client";

export type DateRange = { start: Date; end: Date };

export const rangeFromKey = (key: "7d" | "30d" | "90d" | "365d" | "mtd" | "ytd"): DateRange => {
  const end = new Date();
  const start = new Date();
  switch (key) {
    case "7d": start.setDate(start.getDate() - 7); break;
    case "30d": start.setDate(start.getDate() - 30); break;
    case "90d": start.setDate(start.getDate() - 90); break;
    case "365d": start.setDate(start.getDate() - 365); break;
    case "mtd": start.setDate(1); start.setHours(0,0,0,0); break;
    case "ytd": start.setMonth(0,1); start.setHours(0,0,0,0); break;
  }
  return { start, end };
};

export const num = (v: any) => Number(v ?? 0);
export const money = (locale: string, n: number, ccy = "SAR") =>
  new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n || 0);

export async function fetchRevenueRaw(range: DateRange) {
  const { data } = await supabase
    .from("bookings")
    .select("id, total_fare, status, pickup_at, created_at, completed_at, route_id, driver_id, vehicle_id, category_id, source, customer_id, route:routes(name, from_city, to_city, from_airport, to_airport), category:vehicle_categories(name), driver:drivers(full_name), vehicle:vehicles(plate_number, model), customer:customers(full_name, city, corporate_account_id, corporate:corporate_accounts(company_name))")
    .gte("created_at", range.start.toISOString())
    .lte("created_at", range.end.toISOString());
  return data ?? [];
}

export function groupBy<T>(rows: T[], key: (r: T) => string | null | undefined, value: (r: T) => number) {
  const map = new Map<string, { key: string; total: number; count: number }>();
  for (const r of rows) {
    const k = key(r) ?? "—";
    const bucket = map.get(k) ?? { key: k, total: 0, count: 0 };
    bucket.total += num(value(r));
    bucket.count += 1;
    map.set(k, bucket);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function timeSeries(rows: any[], range: DateRange, unit: "day" | "week" | "month" = "day") {
  const map = new Map<string, { key: string; revenue: number; trips: number }>();
  const start = new Date(range.start); start.setHours(0,0,0,0);
  const end = new Date(range.end); end.setHours(23,59,59,999);
  const step = (d: Date) => {
    if (unit === "day") d.setDate(d.getDate() + 1);
    else if (unit === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  };
  const keyOf = (d: Date) => {
    if (unit === "day") return d.toISOString().slice(0, 10);
    if (unit === "month") return d.toISOString().slice(0, 7);
    // week: YYYY-Www
    const s = new Date(d); s.setDate(s.getDate() - s.getDay());
    return s.toISOString().slice(0, 10);
  };
  for (const d = new Date(start); d <= end; step(d)) map.set(keyOf(new Date(d)), { key: keyOf(new Date(d)), revenue: 0, trips: 0 });
  for (const b of rows) {
    const d = new Date(b.created_at); if (d < start || d > end) continue;
    const k = keyOf(d);
    const bucket = map.get(k); if (!bucket) continue;
    bucket.revenue += num(b.total_fare);
    bucket.trips += 1;
  }
  return Array.from(map.values());
}

// KPIs computation
export function computeKPIs(rows: any[]) {
  const completed = rows.filter((r) => r.status === "completed");
  const cancelled = rows.filter((r) => r.status === "cancelled");
  const noshow = rows.filter((r) => r.status === "no_show");
  const revenue = completed.reduce((s, r) => s + num(r.total_fare), 0);
  const avg = completed.length ? revenue / completed.length : 0;
  return {
    total: rows.length,
    completed: completed.length,
    cancelled: cancelled.length,
    noshow: noshow.length,
    revenue,
    avg,
    conversionRate: rows.length ? (completed.length / rows.length) * 100 : 0,
    cancellationRate: rows.length ? (cancelled.length / rows.length) * 100 : 0,
    noshowRate: rows.length ? (noshow.length / rows.length) * 100 : 0,
  };
}
