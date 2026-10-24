import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { fmtMoney, PAYMENT_METHODS } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/admin/refunds")({ component: Refunds });

function Refunds() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    payment_id: "", amount: "", refund_type: "full", method: "cash", reason: "", notes: "",
  });

  const q = useQuery({
    queryKey: ["refunds"],
    queryFn: async () => (await supabase.from("refunds").select("*, payment:payments(payment_number, amount, customer:customers(full_name))").order("refund_date", { ascending: false })).data ?? [],
  });

  const payments = useQuery({
    queryKey: ["refund-payments"],
    queryFn: async () => (await supabase.from("payments").select("id, payment_number, amount, paid_amount, customer:customers(full_name)").in("status", ["paid", "partially_paid"]).order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("refunds").insert({
        payment_id: form.payment_id,
        amount: Number(form.amount),
        refund_type: form.refund_type as any,
        method: form.method as any,
        reason: form.reason || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تمت معالجة الاسترداد" : "Refund processed"); setOpen(false); qc.invalidateQueries({ queryKey: ["refunds"] }); qc.invalidateQueries({ queryKey: ["payments"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const TYPE_LABEL: Record<string, string> = ar ? { full: "كامل", partial: "جزئي" } : { full: "Full", partial: "Partial" };
  const METHOD_LABEL: Record<string, string> = ar
    ? { cash: "نقدًا", card: "بطاقة", bank_transfer: "تحويل بنكي", stc_pay: "STC Pay", apple_pay: "Apple Pay", mada: "مدى", visa: "فيزا", mastercard: "ماستركارد", online: "أونلاين", wallet: "محفظة" }
    : {};

  const cols: Column<any>[] = [
    { key: "reference", header: "#", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "refund_date", header: ar ? "التاريخ" : "Date", render: (r) => new Date(r.refund_date).toLocaleDateString(ar ? "ar" : "en") },
    { key: "payment", header: ar ? "الدفعة" : "Payment", render: (r) => <span className="font-mono text-xs">{r.payment?.payment_number ?? "—"}</span> },
    { key: "customer", header: ar ? "العميل" : "Customer", render: (r) => r.payment?.customer?.full_name ?? "—" },
    { key: "refund_type", header: ar ? "النوع" : "Type", render: (r) => <span className="capitalize">{TYPE_LABEL[r.refund_type] ?? r.refund_type}</span> },
    { key: "amount", header: ar ? "المبلغ" : "Amount", render: (r) => <span className="font-display text-warning">{fmtMoney(r.amount, "SAR", locale)}</span> },
    { key: "method", header: ar ? "الطريقة" : "Method", render: (r) => METHOD_LABEL[r.method] ?? r.method },
    { key: "reason", header: ar ? "السبب" : "Reason", render: (r) => <span className="text-xs text-muted-foreground line-clamp-1">{r.reason ?? "—"}</span> },
  ];


  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={ar ? "المرتجعات" : "Refunds"}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="h-4 w-4 me-1" />{ar ? "مرتجع" : "New refund"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Undo2 className="h-5 w-5 text-warning" />{ar ? "معالجة مرتجع" : "Process refund"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>{ar ? "الدفعة" : "Payment"}</Label>
                  <Select value={form.payment_id} onValueChange={(v) => {
                    const p: any = (payments.data ?? []).find((x: any) => x.id === v);
                    setForm({ ...form, payment_id: v, amount: p ? String(p.paid_amount || p.amount) : "" });
                  }}>
                    <SelectTrigger><SelectValue placeholder={ar ? "اختر الدفعة" : "Select payment"} /></SelectTrigger>
                    <SelectContent>
                      {(payments.data ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.payment_number} · {p.customer?.full_name ?? "—"} · {fmtMoney(p.amount, "SAR", locale)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{ar ? "النوع" : "Type"}</Label>
                    <Select value={form.refund_type} onValueChange={(v) => setForm({ ...form, refund_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="full">{TYPE_LABEL.full}</SelectItem><SelectItem value="partial">{TYPE_LABEL.partial}</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>{ar ? "المبلغ" : "Amount"}</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                </div>
                <div>
                  <Label>{ar ? "طريقة الاسترداد" : "Method"}</Label>
                  <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m] ?? m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div><Label>{ar ? "السبب" : "Reason"}</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
                <div><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                <Button disabled={!form.payment_id || !form.amount} onClick={() => create.mutate()}>{ar ? "معالجة" : "Process"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
