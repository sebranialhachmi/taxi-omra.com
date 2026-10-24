import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { ExpiryPill, daysUntil } from "@/components/ExpiryPill";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wrench, AlertTriangle, DollarSign, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/maintenance")({ component: Maintenance });

function Maintenance() {
  const { locale } = useI18n();
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");

  const records = useQuery({
    queryKey: ["maint-records"],
    queryFn: async () => (await supabase.from("vehicle_maintenance").select("*, vehicle:vehicles(id, plate_number, make, model)").order("service_date", { ascending: false }).limit(500)).data ?? [],
  });
  const dueSoon = useQuery({
    queryKey: ["maint-due"],
    queryFn: async () => (await supabase.from("vehicles").select("id, plate_number, make, model, next_maintenance_date, current_mileage, next_maintenance_mileage").not("next_maintenance_date","is",null).order("next_maintenance_date")).data ?? [],
  });

  const filtered = useMemo(() => {
    const list = records.data ?? [];
    return list.filter((r: any) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(`${r.vehicle?.plate_number ?? ""} ${r.vehicle?.make ?? ""} ${r.vehicle?.model ?? ""} ${r.description ?? ""} ${r.vendor ?? ""}`.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [records.data, kind, search]);

  const totalCost = filtered.reduce((s: number, m: any) => s + Number(m.cost ?? 0), 0);
  const thisMonth = filtered.filter((m: any) => new Date(m.service_date).getMonth() === new Date().getMonth() && new Date(m.service_date).getFullYear() === new Date().getFullYear());
  const monthCost = thisMonth.reduce((s: number, m: any) => s + Number(m.cost ?? 0), 0);
  const alerts = (dueSoon.data ?? []).filter((v: any) => daysUntil(v.next_maintenance_date)! <= 14).length;

  const ar = locale === "ar";
  const KIND_AR: Record<string, string> = { oil_change: "تغيير زيت", tire: "إطارات", brake: "فرامل", battery: "بطارية", inspection: "فحص", repair: "إصلاح", service: "صيانة", other: "أخرى" };
  const kindLabel = (k: string) => (ar ? KIND_AR[k] ?? k : k.replace(/_/g, " "));

  const columns: Column<any>[] = [
    { key: "service_date", header: ar ? "التاريخ" : "Date", render: (r) => new Date(r.service_date).toLocaleDateString(ar ? "ar" : "en") },
    { key: "vehicle", header: ar ? "المركبة" : "Vehicle", render: (r) => r.vehicle ? (
      <Link to={"/admin/fleet/$id" as any} params={{ id: r.vehicle.id } as any} className="hover:text-gold">
        <div className="font-mono text-sm">{r.vehicle.plate_number}</div>
        <div className="text-xs text-muted-foreground">{r.vehicle.make} {r.vehicle.model}</div>
      </Link>
    ) : "—" },
    { key: "kind", header: ar ? "النوع" : "Kind", render: (r) => kindLabel(r.kind) },
    { key: "description", header: ar ? "الوصف" : "Description", render: (r) => r.description ?? "—" },
    { key: "vendor", header: ar ? "الجهة" : "Vendor", render: (r) => r.vendor ?? "—" },
    { key: "mileage", header: ar ? "الممشى" : "Mileage", render: (r) => r.mileage ? <span className="tabular-nums">{Number(r.mileage).toLocaleString()}</span> : "—" },
    { key: "cost", header: ar ? "التكلفة" : "Cost", render: (r) => <span className="tabular-nums font-medium">{Number(r.cost ?? 0).toFixed(2)}</span> },
    { key: "next_due_date", header: ar ? "التالي" : "Next due", render: (r) => <ExpiryPill date={r.next_due_date} /> },
  ];

  const KINDS = ["oil_change","tire","brake","battery","inspection","repair","service","other"];

  return (
    <div>
      <PageHeader title={ar ? "الصيانة" : "Maintenance"} description={ar ? "سجل الصيانة والتنبيهات القادمة" : "Service history and upcoming maintenance"} />

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <StatCard label={ar ? "السجلات" : "Records"} value={records.data?.length ?? 0} icon={Wrench} />
        <StatCard label={ar ? "مستحقة قريباً" : "Due soon"} value={alerts} icon={AlertTriangle} tone="warning" />
        <StatCard label={ar ? "هذا الشهر" : "This month"} value={monthCost.toFixed(2)} icon={DollarSign} />
        <StatCard label={ar ? "إجمالي التكلفة" : "Total cost"} value={totalCost.toFixed(2)} icon={DollarSign} tone="chart2" />
      </div>

      {alerts > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning-foreground" />{ar ? "مركبات تحتاج صيانة" : "Vehicles needing service"}</div>
            <div className="flex flex-wrap gap-2">
              {(dueSoon.data ?? []).filter((v: any) => daysUntil(v.next_maintenance_date)! <= 14).map((v: any) => (
                <Link key={v.id} to={"/admin/fleet/$id" as any} params={{ id: v.id } as any} className="inline-flex items-center gap-2 rounded-md border border-warning/30 bg-background/50 px-2.5 py-1.5 text-xs hover:bg-muted/40">
                  <span className="font-mono">{v.plate_number}</span>
                  <span className="text-muted-foreground">{v.make} {v.model}</span>
                  <ExpiryPill date={v.next_maintenance_date} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={ar ? "بحث في اللوحة أو الوصف أو الجهة…" : "Search plate, description, vendor…"} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-72" />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل الأنواع" : "All kinds"}</SelectItem>
            {KINDS.map(k => <SelectItem key={k} value={k}>{kindLabel(k)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filtered} columns={columns} loading={records.isLoading} />
    </div>
  );
}
