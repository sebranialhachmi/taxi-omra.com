import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { fmtMoney, PAYMENT_METHODS, PAYMENT_STATUSES, downloadCSV } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/admin/payments")({ component: Payments });

function Payments() {
  const { locale, t } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [form, setForm] = useState({
    booking_id: "", amount: "", vat_amount: "0", discount_amount: "0",
    method: "cash", status: "paid", reference_number: "", notes: "",
  });

  const q = useQuery({
    queryKey: ["payments"],
    queryFn: async () =>
      (await supabase.from("payments")
        .select("*, booking:bookings(code, total_fare, customer_id), customer:customers(full_name), driver:drivers(full_name)")
        .order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const openBookings = useQuery({
    queryKey: ["payments-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("id, code, total_fare, customer_id, customer:customers(full_name)").in("status", ["completed", "on_trip", "assigned"]).order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const b: any = (openBookings.data ?? []).find((x: any) => x.id === form.booking_id);
      const amount = Number(form.amount);
      const paid_amount = form.status === "paid" ? amount : (form.status === "partially_paid" ? amount : 0);
      const { error } = await supabase.from("payments").insert({
        booking_id: form.booking_id,
        customer_id: b?.customer_id ?? null,
        amount,
        paid_amount,
        vat_amount: Number(form.vat_amount || 0),
        discount_amount: Number(form.discount_amount || 0),
        method: form.method as any,
        status: form.status as any,
        reference_number: form.reference_number || null,
        notes: form.notes || null,
        paid_at: form.status === "paid" ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Recorded"); setOpen(false); qc.invalidateQueries({ queryKey: ["payments"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = (q.data ?? []).filter((r: any) => {
    if (status !== "all" && r.status !== status) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.payment_number?.toLowerCase().includes(s)
        || r.booking?.code?.toLowerCase().includes(s)
        || r.customer?.full_name?.toLowerCase().includes(s)
        || r.reference_number?.toLowerCase().includes(s);
    }
    return true;
  });

  const cols: Column<any>[] = [
    { key: "payment_number", header: "#", render: (r) => <span className="font-mono text-xs">{r.payment_number ?? "—"}</span> },
    { key: "created_at", header: ar ? "التاريخ" : "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: "booking", header: ar ? "الحجز" : "Booking", render: (r) => <span className="font-mono text-xs">{r.booking?.code ?? "—"}</span> },
    { key: "customer", header: ar ? "العميل" : "Customer", render: (r) => r.customer?.full_name ?? "—" },
    { key: "amount", header: ar ? "المبلغ" : "Amount", render: (r) => <span className="font-display">{fmtMoney(r.amount, r.currency ?? "SAR", locale)}</span> },
    { key: "paid", header: ar ? "المدفوع" : "Paid", render: (r) => fmtMoney(r.paid_amount, r.currency ?? "SAR", locale) },
    { key: "method", header: ar ? "الطريقة" : "Method", render: (r) => <span className="capitalize">{r.method.replace(/_/g, " ")}</span> },
    { key: "reference", header: "Ref", render: (r) => <span className="text-xs text-muted-foreground">{r.reference_number ?? "—"}</span> },
    { key: "status", header: t("status"), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const exportCSV = () => downloadCSV(`payments-${new Date().toISOString().slice(0, 10)}.csv`,
    rows.map((r: any) => ({
      payment_number: r.payment_number, date: r.created_at, booking: r.booking?.code ?? "",
      customer: r.customer?.full_name ?? "", amount: r.amount, paid: r.paid_amount, vat: r.vat_amount,
      discount: r.discount_amount, method: r.method, reference: r.reference_number ?? "", status: r.status,
    })));

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={t("payments")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={exportCSV}><Download className="h-4 w-4 me-1.5" />CSV</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="h-4 w-4 me-1" />{ar ? "دفعة" : "New payment"}</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{ar ? "تسجيل دفعة" : "Record payment"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>{ar ? "الحجز" : "Booking"}</Label>
                    <Select value={form.booking_id} onValueChange={(v) => {
                      const b: any = (openBookings.data ?? []).find((x: any) => x.id === v);
                      setForm({ ...form, booking_id: v, amount: b ? String(b.total_fare) : "" });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select booking" /></SelectTrigger>
                      <SelectContent>
                        {(openBookings.data ?? []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.code} · {b.customer?.full_name ?? "—"} · {fmtMoney(b.total_fare, "SAR", locale)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{ar ? "المبلغ" : "Amount"}</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>VAT</Label><Input type="number" step="0.01" value={form.vat_amount} onChange={(e) => setForm({ ...form, vat_amount: e.target.value })} /></div>
                  <div><Label>{ar ? "الخصم" : "Discount"}</Label><Input type="number" step="0.01" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} /></div>
                  <div><Label>{ar ? "المرجع" : "Reference"}</Label><Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></div>
                  <div>
                    <Label>{ar ? "الطريقة" : "Method"}</Label>
                    <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{ar ? "الحالة" : "Status"}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button disabled={!form.booking_id || !form.amount} onClick={() => create.mutate()}>{ar ? "حفظ" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={ar ? "بحث…" : "Search…"} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 rounded-full" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل الحالات" : "All statuses"}</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={rows} columns={cols} loading={q.isLoading}
        actions={(r) => (
          <Select value={r.status} onValueChange={async (v) => {
            const patch: any = { status: v };
            if (v === "paid") { patch.paid_at = new Date().toISOString(); patch.paid_amount = r.amount; }
            const { error } = await supabase.from("payments").update(patch).eq("id", r.id);
            if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["payments"] });
          }}>
            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
