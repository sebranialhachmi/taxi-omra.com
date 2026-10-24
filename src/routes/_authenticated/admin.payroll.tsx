import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Download, Wand2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { fmtMoney, downloadCSV } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/admin/payroll")({ component: Payroll });

function firstOfMonth(offset = 0) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function lastOfMonth(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + offset + 1); d.setDate(0); d.setHours(23, 59, 59);
  return d.toISOString().slice(0, 10);
}

function Payroll() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [gen, setGen] = useState(false);
  const [period, setPeriod] = useState({ start: firstOfMonth(-1), end: lastOfMonth(-1), commission: "20" });

  const q = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => (await supabase.from("driver_payroll").select("*, driver:drivers(full_name)").order("period_end", { ascending: false }).limit(500)).data ?? [],
  });

  const settings = useQuery({
    queryKey: ["finance-settings-basic"],
    queryFn: async () => (await supabase.from("finance_settings").select("*").maybeSingle()).data,
  });

  const generatePayroll = async () => {
    try {
      // Compute per-driver totals from completed bookings in the period
      const { data: bookings, error: berr } = await supabase
        .from("bookings").select("driver_id, total_fare")
        .eq("status", "completed")
        .gte("completed_at", period.start)
        .lte("completed_at", period.end + "T23:59:59");
      if (berr) throw berr;

      const rate = Number(period.commission) || Number(settings.data?.default_commission_rate) || 20;
      const agg = new Map<string, { trips: number; gross: number }>();
      (bookings ?? []).forEach((b: any) => {
        if (!b.driver_id) return;
        const cur = agg.get(b.driver_id) ?? { trips: 0, gross: 0 };
        cur.trips += 1; cur.gross += Number(b.total_fare || 0);
        agg.set(b.driver_id, cur);
      });

      const rows = Array.from(agg.entries()).map(([driver_id, v]) => {
        const commission = +(v.gross * rate / 100).toFixed(2);
        return {
          driver_id,
          period_start: period.start,
          period_end: period.end,
          trip_count: v.trips,
          gross_revenue: v.gross,
          commission_rate: rate,
          commission_amount: commission,
          bonuses: 0,
          deductions: 0,
          net_salary: commission,
          status: "draft" as const,
        };
      });

      if (rows.length === 0) { toast.info("No completed trips in this period"); return; }

      const { error } = await supabase.from("driver_payroll").upsert(rows, { onConflict: "driver_id,period_start,period_end" });
      if (error) throw error;
      toast.success(`Generated ${rows.length} payroll rows`);
      setGen(false);
      qc.invalidateQueries({ queryKey: ["payroll"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const rows = q.data ?? [];
  const cols: Column<any>[] = [
    { key: "period", header: ar ? "الفترة" : "Period", render: (r) => <span className="font-mono text-xs">{r.period_start} → {r.period_end}</span> },
    { key: "driver", header: ar ? "السائق" : "Driver", render: (r) => r.driver?.full_name ?? "—" },
    { key: "trip_count", header: ar ? "رحلات" : "Trips" },
    { key: "gross_revenue", header: ar ? "الإيراد" : "Gross", render: (r) => fmtMoney(r.gross_revenue, "SAR", locale) },
    { key: "commission_amount", header: ar ? "العمولة" : "Commission", render: (r) => `${r.commission_rate}% · ${fmtMoney(r.commission_amount, "SAR", locale)}` },
    { key: "bonuses", header: ar ? "مكافآت" : "Bonus", render: (r) => (
      <Input className="h-8 w-24" type="number" defaultValue={r.bonuses} onBlur={async (e) => {
        const v = Number(e.target.value || 0);
        const net = Number(r.commission_amount) + v - Number(r.deductions || 0);
        await supabase.from("driver_payroll").update({ bonuses: v, net_salary: net }).eq("id", r.id);
        qc.invalidateQueries({ queryKey: ["payroll"] });
      }} />
    ) },
    { key: "deductions", header: ar ? "خصومات" : "Deduct", render: (r) => (
      <Input className="h-8 w-24" type="number" defaultValue={r.deductions} onBlur={async (e) => {
        const v = Number(e.target.value || 0);
        const net = Number(r.commission_amount) + Number(r.bonuses || 0) - v;
        await supabase.from("driver_payroll").update({ deductions: v, net_salary: net }).eq("id", r.id);
        qc.invalidateQueries({ queryKey: ["payroll"] });
      }} />
    ) },
    { key: "net_salary", header: ar ? "الصافي" : "Net", render: (r) => <span className="font-display text-gold">{fmtMoney(r.net_salary, "SAR", locale)}</span> },
    { key: "status", header: ar ? "الحالة" : "Status", render: (r) => <StatusBadge value={r.status} /> },
  ];

  const exportCSV = () => downloadCSV(`payroll-${new Date().toISOString().slice(0, 10)}.csv`,
    rows.map((r: any) => ({
      driver: r.driver?.full_name ?? "", period_start: r.period_start, period_end: r.period_end,
      trips: r.trip_count, gross: r.gross_revenue, commission_rate: r.commission_rate,
      commission: r.commission_amount, bonuses: r.bonuses, deductions: r.deductions,
      net: r.net_salary, status: r.status,
    })));

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={ar ? "رواتب السائقين" : "Driver Payroll"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={exportCSV}><Download className="h-4 w-4 me-1.5" />CSV</Button>
            <Dialog open={gen} onOpenChange={setGen}>
              <DialogTrigger asChild><Button size="sm" className="rounded-full"><Wand2 className="h-4 w-4 me-1.5" />{ar ? "توليد" : "Generate"}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{ar ? "توليد رواتب الفترة" : "Generate payroll"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{ar ? "من" : "From"}</Label><Input type="date" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} /></div>
                  <div><Label>{ar ? "إلى" : "To"}</Label><Input type="date" value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} /></div>
                  <div className="col-span-2"><Label>{ar ? "نسبة العمولة %" : "Commission rate %"}</Label><Input type="number" value={period.commission} onChange={(e) => setPeriod({ ...period, commission: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setGen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button onClick={generatePayroll}>{ar ? "توليد" : "Generate"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <DataTable data={rows} columns={cols} loading={q.isLoading} />
    </div>
  );
}
