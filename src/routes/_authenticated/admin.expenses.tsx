import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, TrendingDown, Receipt as ReceiptIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { fmtMoney, EXPENSE_CATEGORIES, downloadCSV } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/admin/expenses")({ component: Expenses });

function Expenses() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [form, setForm] = useState({
    category: "fuel", amount: "", supplier: "", vehicle_id: "", driver_id: "",
    receipt_url: "", expense_date: new Date().toISOString().slice(0, 10), notes: "",
  });

  const q = useQuery({
    queryKey: ["expenses"],
    queryFn: async () =>
      (await supabase.from("expenses").select("*, vehicle:vehicles(plate_number), driver:drivers(full_name)").order("expense_date", { ascending: false }).limit(500)).data ?? [],
  });

  const vehicles = useQuery({
    queryKey: ["expenses-vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("id, plate_number, make, model").order("plate_number")).data ?? [],
  });

  const drivers = useQuery({
    queryKey: ["expenses-drivers"],
    queryFn: async () => (await supabase.from("drivers").select("id, full_name").order("full_name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses").insert({
        category: form.category as any,
        amount: Number(form.amount),
        supplier: form.supplier || null,
        vehicle_id: form.vehicle_id || null,
        driver_id: form.driver_id || null,
        receipt_url: form.receipt_url || null,
        expense_date: form.expense_date,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تم الحفظ" : "Created"); setOpen(false); setForm({ ...form, amount: "", supplier: "", notes: "", receipt_url: "" }); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const CAT_LABEL_AR: Record<string, string> = {
    fuel: "وقود", maintenance: "صيانة", insurance: "تأمين", tolls: "رسوم مرور", parking: "مواقف",
    fines: "مخالفات", salaries: "رواتب", commission: "عمولات", office: "مكتب", marketing: "تسويق",
    utilities: "خدمات عامة", rent: "إيجار", tax: "ضرائب", supplies: "لوازم", other: "أخرى",
    vehicle_purchase: "شراء مركبة", software: "برمجيات", cleaning: "تنظيف",
  };
  const catLabel = (c: string) => ar ? (CAT_LABEL_AR[c] ?? c.replace(/_/g, " ")) : c.replace(/_/g, " ");

  const rows = (q.data ?? []).filter((r: any) => category === "all" || r.category === category);
  const totalMonth = rows.filter((r: any) => new Date(r.expense_date) >= new Date(Date.now() - 30 * 864e5)).reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalAll = rows.reduce((a, b: any) => a + Number(b.amount || 0), 0);

  const cols: Column<any>[] = [
    { key: "reference", header: "#", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "expense_date", header: ar ? "التاريخ" : "Date", render: (r) => new Date(r.expense_date).toLocaleDateString(ar ? "ar" : "en") },
    { key: "category", header: ar ? "الفئة" : "Category", render: (r) => <span className="capitalize">{catLabel(r.category)}</span> },
    { key: "supplier", header: ar ? "المورد" : "Supplier", render: (r) => r.supplier ?? "—" },
    { key: "vehicle", header: ar ? "المركبة" : "Vehicle", render: (r) => r.vehicle?.plate_number ?? "—" },
    { key: "driver", header: ar ? "السائق" : "Driver", render: (r) => r.driver?.full_name ?? "—" },
    { key: "amount", header: ar ? "المبلغ" : "Amount", render: (r) => <span className="font-display text-warning">{fmtMoney(r.amount, r.currency, locale)}</span> },
    { key: "receipt", header: ar ? "إيصال" : "Receipt", render: (r) => r.receipt_url ? <a href={r.receipt_url} target="_blank" rel="noreferrer" className="text-gold hover:underline text-xs">{ar ? "عرض" : "View"}</a> : "—" },
  ];


  const exportCSV = () => downloadCSV(`expenses-${new Date().toISOString().slice(0, 10)}.csv`,
    rows.map((r: any) => ({
      reference: r.reference, date: r.expense_date, category: r.category, supplier: r.supplier ?? "",
      vehicle: r.vehicle?.plate_number ?? "", driver: r.driver?.full_name ?? "", amount: r.amount, notes: r.notes ?? "",
    })));

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={ar ? "المصروفات" : "Expenses"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={exportCSV}><Download className="h-4 w-4 me-1.5" />CSV</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="h-4 w-4 me-1" />{ar ? "جديد" : "New"}</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{ar ? "مصروف جديد" : "New expense"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{ar ? "الفئة" : "Category"}</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{catLabel(c)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{ar ? "المبلغ" : "Amount"}</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>{ar ? "المورد" : "Supplier"}</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
                  <div><Label>{ar ? "التاريخ" : "Date"}</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
                  <div>
                    <Label>{ar ? "المركبة" : "Vehicle"}</Label>
                    <Select value={form.vehicle_id || "none"} onValueChange={(v) => setForm({ ...form, vehicle_id: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {(vehicles.data ?? []).map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate_number} · {v.make} {v.model}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{ar ? "السائق" : "Driver"}</Label>
                    <Select value={form.driver_id || "none"} onValueChange={(v) => setForm({ ...form, driver_id: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {(drivers.data ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>{ar ? "رابط الإيصال" : "Receipt URL"}</Label><Input value={form.receipt_url} onChange={(e) => setForm({ ...form, receipt_url: e.target.value })} placeholder="https://…" /></div>
                  <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button disabled={!form.amount} onClick={() => create.mutate()}>{ar ? "حفظ" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <StatCard label={ar ? "مصروفات 30 يوم" : "Last 30 days"} value={fmtMoney(totalMonth, "SAR", locale)} icon={TrendingDown} tone="warning" />
        <StatCard label={ar ? "الإجمالي المعروض" : "Filtered total"} value={fmtMoney(totalAll, "SAR", locale)} icon={ReceiptIcon} tone="primary" />
        <StatCard label={ar ? "عدد السجلات" : "Records"} value={String(rows.length)} icon={ReceiptIcon} tone="chart2" />
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-56 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل الفئات" : "All categories"}</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{catLabel(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={rows} columns={cols} loading={q.isLoading} />
    </div>
  );
}
