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
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/admin/corporate")({ component: Corporate });

function Corporate() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: "", contact_person: "", contact_email: "", contact_phone: "",
    billing_address: "", vat_number: "", credit_limit: "0", billing_cycle: "monthly",
    discount_percent: "0", notes: "",
  });

  const q = useQuery({
    queryKey: ["corporate"],
    queryFn: async () => (await supabase.from("corporate_accounts").select("*").order("company_name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("corporate_accounts").insert({
        company_name: form.company_name,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        billing_address: form.billing_address || null,
        vat_number: form.vat_number || null,
        credit_limit: Number(form.credit_limit || 0),
        billing_cycle: form.billing_cycle,
        discount_percent: Number(form.discount_percent || 0),
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Created"); setOpen(false); qc.invalidateQueries({ queryKey: ["corporate"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const cols: Column<any>[] = [
    { key: "code", header: "#", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "company_name", header: ar ? "الشركة" : "Company", render: (r) => <span className="font-medium">{r.company_name}</span> },
    { key: "contact_person", header: ar ? "المسؤول" : "Contact", render: (r) => r.contact_person ?? "—" },
    { key: "credit_limit", header: ar ? "حد الائتمان" : "Credit limit", render: (r) => fmtMoney(r.credit_limit, "SAR", locale) },
    { key: "outstanding_balance", header: ar ? "الرصيد المستحق" : "Outstanding", render: (r) => <span className={Number(r.outstanding_balance) > 0 ? "text-warning font-display" : ""}>{fmtMoney(r.outstanding_balance, "SAR", locale)}</span> },
    { key: "billing_cycle", header: ar ? "الدورة" : "Cycle" },
    { key: "discount_percent", header: "Disc %", render: (r) => `${r.discount_percent}%` },
    { key: "is_active", header: ar ? "نشط" : "Active", render: (r) => (
      <Switch checked={r.is_active} onCheckedChange={async (v) => {
        const { error } = await supabase.from("corporate_accounts").update({ is_active: v }).eq("id", r.id);
        if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["corporate"] });
      }} />
    ) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={ar ? "الحسابات المؤسسية" : "Corporate Accounts"}
        description={ar ? "الشركات ذات الفوترة الشهرية والائتمان" : "Businesses with monthly billing & credit"}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="h-4 w-4 me-1" />{ar ? "جديد" : "New"}</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{ar ? "حساب مؤسسي جديد" : "New corporate account"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>{ar ? "اسم الشركة" : "Company name"}</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                <div><Label>{ar ? "المسؤول" : "Contact person"}</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                <div><Label>{ar ? "الهاتف" : "Phone"}</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
                <div className="col-span-2"><Label>{ar ? "البريد" : "Email"}</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div className="col-span-2"><Label>{ar ? "عنوان الفوترة" : "Billing address"}</Label><Textarea rows={2} value={form.billing_address} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} /></div>
                <div><Label>{ar ? "الرقم الضريبي" : "VAT #"}</Label><Input value={form.vat_number} onChange={(e) => setForm({ ...form, vat_number: e.target.value })} /></div>
                <div><Label>{ar ? "حد الائتمان" : "Credit limit"}</Label><Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} /></div>
                <div><Label>{ar ? "دورة الفوترة" : "Billing cycle"}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}>
                    <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div><Label>{ar ? "خصم %" : "Discount %"}</Label><Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} /></div>
                <div className="col-span-2"><Label>{ar ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                <Button disabled={!form.company_name} onClick={() => create.mutate()}>{ar ? "حفظ" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
