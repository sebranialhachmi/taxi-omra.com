import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/finance-settings")({ component: FinanceSettings });

function FinanceSettings() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["finance-settings"],
    queryFn: async () => (await supabase.from("finance_settings").select("*").maybeSingle()).data,
  });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  if (!f) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const save = async () => {
    const { error } = await supabase.from("finance_settings").update({
      company_name: f.company_name,
      company_address: f.company_address,
      company_phone: f.company_phone,
      company_email: f.company_email,
      vat_number: f.vat_number,
      vat_rate: Number(f.vat_rate),
      currency: f.currency,
      invoice_footer: f.invoice_footer,
      default_commission_rate: Number(f.default_commission_rate),
    }).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); qc.invalidateQueries({ queryKey: ["finance-settings"] });
  };

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={ar ? "إعدادات المالية" : "Finance Settings"}
        description={ar ? "بيانات الشركة وضريبة القيمة المضافة والعمولة الافتراضية" : "Company info, VAT rate, and default commission"}
      />
      <Card className="max-w-3xl rounded-2xl border-border/70">
        <CardContent className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>{ar ? "اسم الشركة" : "Company name"}</Label><Input value={f.company_name ?? ""} onChange={(e) => setF({ ...f, company_name: e.target.value })} /></div>
          <div className="col-span-2"><Label>{ar ? "العنوان" : "Address"}</Label><Textarea rows={2} value={f.company_address ?? ""} onChange={(e) => setF({ ...f, company_address: e.target.value })} /></div>
          <div><Label>{ar ? "الهاتف" : "Phone"}</Label><Input value={f.company_phone ?? ""} onChange={(e) => setF({ ...f, company_phone: e.target.value })} /></div>
          <div><Label>{ar ? "البريد" : "Email"}</Label><Input type="email" value={f.company_email ?? ""} onChange={(e) => setF({ ...f, company_email: e.target.value })} /></div>
          <div><Label>{ar ? "الرقم الضريبي" : "VAT number"}</Label><Input value={f.vat_number ?? ""} onChange={(e) => setF({ ...f, vat_number: e.target.value })} /></div>
          <div><Label>{ar ? "نسبة الضريبة %" : "VAT rate %"}</Label><Input type="number" step="0.01" value={f.vat_rate} onChange={(e) => setF({ ...f, vat_rate: e.target.value })} /></div>
          <div><Label>{ar ? "العملة" : "Currency"}</Label><Input value={f.currency ?? ""} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
          <div><Label>{ar ? "نسبة العمولة الافتراضية %" : "Default commission %"}</Label><Input type="number" step="0.01" value={f.default_commission_rate} onChange={(e) => setF({ ...f, default_commission_rate: e.target.value })} /></div>
          <div className="col-span-2"><Label>{ar ? "تذييل الفاتورة" : "Invoice footer"}</Label><Textarea rows={3} value={f.invoice_footer ?? ""} onChange={(e) => setF({ ...f, invoice_footer: e.target.value })} /></div>
          <div className="col-span-2 flex justify-end"><Button onClick={save}>{ar ? "حفظ" : "Save"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
