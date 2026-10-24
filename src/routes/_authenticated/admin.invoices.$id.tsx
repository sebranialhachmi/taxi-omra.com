import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Printer, Download, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { fmtMoney } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_authenticated/admin/invoices/$id")({ component: InvoiceDetail });

function InvoiceDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/invoices/$id" });
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [qr, setQr] = useState<string>("");

  const q = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const [inv, settings] = await Promise.all([
        supabase.from("invoices").select("*, customer:customers(full_name, phone, email, address, vat_number), booking:bookings(code, pickup_location, dropoff_location, pickup_at, distance_km, waiting_min, base_fare, distance_fare, time_fare, waiting_fare, night_surcharge, airport_fee, total_fare), corporate:corporate_accounts(company_name, contact_person, contact_email, billing_address, vat_number)").eq("id", id).maybeSingle(),
        supabase.from("finance_settings").select("*").limit(1).maybeSingle(),
      ]);
      return { invoice: inv.data, settings: settings.data };
    },
  });

  useEffect(() => {
    if (!q.data?.invoice) return;
    const inv = q.data.invoice;
    const payload = `${inv.invoice_number}|${inv.total_amount}|${inv.currency}|${inv.issue_date}`;
    QRCode.toDataURL(payload, { width: 160, margin: 1 }).then(setQr).catch(() => {});
  }, [q.data]);

  if (q.isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const inv: any = q.data?.invoice;
  if (!inv) return <div className="p-8 text-muted-foreground">Not found</div>;
  const s: any = q.data?.settings ?? {};
  const b: any = inv.booking ?? {};
  const c: any = inv.corporate ?? inv.customer ?? {};

  const fmt = (n: number) => fmtMoney(n, inv.currency, locale);

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "فاتورة" : "Invoice"}
        title={inv.invoice_number}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/admin/invoices"><ArrowLeft className="h-4 w-4 me-1.5" />{ar ? "رجوع" : "Back"}</Link></Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}><Printer className="h-4 w-4 me-1.5" />{ar ? "طباعة" : "Print"}</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => { window.print(); }}><Download className="h-4 w-4 me-1.5" />PDF</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => {
              if (!c.email && !c.contact_email) return toast.error("No email");
              const to = c.contact_email ?? c.email;
              window.location.href = `mailto:${to}?subject=Invoice ${inv.invoice_number}&body=Please find your invoice.`;
            }}><Mail className="h-4 w-4 me-1.5" />{ar ? "إرسال" : "Email"}</Button>
          </div>
        }
      />

      <Card className="max-w-4xl mx-auto rounded-2xl border-border/70 print:border-0 print:shadow-none">
        <CardContent className="p-8 md:p-12 print:p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-start gap-4">
              <img src={SITE.logo} alt={SITE.brand.en} className="h-14 w-auto object-contain" />
              <div>
                <div className="font-display text-3xl mb-1">{s.company_name || `${SITE.brand.en}`}</div>
                <div className="text-sm text-muted-foreground whitespace-pre-line">{s.company_address}</div>
                <div className="text-sm text-muted-foreground">{s.company_phone} · {s.company_email}</div>
                {s.vat_number && <div className="text-xs text-muted-foreground mt-1">VAT: {s.vat_number}</div>}
              </div>
            </div>
            <div className="text-end">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-1">{ar ? "فاتورة ضريبية" : "Tax Invoice"}</div>
              <div className="font-mono text-lg">{inv.invoice_number}</div>
              <div className="mt-2"><StatusBadge value={inv.status} /></div>
              {qr && <img src={qr} alt="QR" className="mt-3 h-24 w-24 ms-auto" />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-border/60">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{ar ? "إلى" : "Bill To"}</div>
              <div className="font-medium">{c.company_name ?? c.full_name ?? "—"}</div>
              {c.contact_person && <div className="text-sm text-muted-foreground">{c.contact_person}</div>}
              <div className="text-sm text-muted-foreground">{c.billing_address ?? c.address ?? ""}</div>
              <div className="text-sm text-muted-foreground">{c.contact_email ?? c.email ?? ""} · {c.contact_phone ?? c.phone ?? ""}</div>
              {c.vat_number && <div className="text-xs text-muted-foreground mt-1">VAT: {c.vat_number}</div>}
            </div>
            <div className="text-end">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{ar ? "التواريخ" : "Dates"}</div>
              <div className="text-sm"><span className="text-muted-foreground">{ar ? "الإصدار" : "Issued"}:</span> {new Date(inv.issue_date).toLocaleDateString()}</div>
              {inv.due_date && <div className="text-sm"><span className="text-muted-foreground">{ar ? "الاستحقاق" : "Due"}:</span> {new Date(inv.due_date).toLocaleDateString()}</div>}
              {b.code && <div className="text-sm mt-2"><span className="text-muted-foreground">{ar ? "الحجز" : "Booking"}:</span> <span className="font-mono">{b.code}</span></div>}
            </div>
          </div>

          {b.pickup_location && (
            <div className="mb-8">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">{ar ? "تفاصيل الرحلة" : "Trip Details"}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">{ar ? "من" : "Pickup"}:</span> {b.pickup_location}</div>
                <div><span className="text-muted-foreground">{ar ? "إلى" : "Dropoff"}:</span> {b.dropoff_location}</div>
                <div><span className="text-muted-foreground">{ar ? "المسافة" : "Distance"}:</span> {b.distance_km ? `${b.distance_km} km` : "—"}</div>
                <div><span className="text-muted-foreground">{ar ? "الانتظار" : "Waiting"}:</span> {b.waiting_min ?? 0} min</div>
              </div>
            </div>
          )}

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-start py-2 font-medium">{ar ? "البند" : "Description"}</th>
                <th className="text-end py-2 font-medium">{ar ? "المبلغ" : "Amount"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {b.base_fare > 0 && <tr><td className="py-2">{ar ? "الأجرة الأساسية" : "Base fare"}</td><td className="text-end font-mono">{fmt(b.base_fare)}</td></tr>}
              {b.distance_fare > 0 && <tr><td className="py-2">{ar ? "أجرة المسافة" : "Distance fare"}</td><td className="text-end font-mono">{fmt(b.distance_fare)}</td></tr>}
              {b.time_fare > 0 && <tr><td className="py-2">{ar ? "أجرة الوقت" : "Time fare"}</td><td className="text-end font-mono">{fmt(b.time_fare)}</td></tr>}
              {b.waiting_fare > 0 && <tr><td className="py-2">{ar ? "أجرة الانتظار" : "Waiting fare"}</td><td className="text-end font-mono">{fmt(b.waiting_fare)}</td></tr>}
              {b.night_surcharge > 0 && <tr><td className="py-2">{ar ? "رسوم ليلية" : "Night surcharge"}</td><td className="text-end font-mono">{fmt(b.night_surcharge)}</td></tr>}
              {b.airport_fee > 0 && <tr><td className="py-2">{ar ? "رسوم المطار" : "Airport fee"}</td><td className="text-end font-mono">{fmt(b.airport_fee)}</td></tr>}
              {!b.pickup_location && <tr><td className="py-2">{ar ? "خدمات" : "Services"}</td><td className="text-end font-mono">{fmt(inv.subtotal)}</td></tr>}
            </tbody>
          </table>

          <div className="ms-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "المجموع الفرعي" : "Subtotal"}</span><span className="font-mono">{fmt(inv.subtotal)}</span></div>
            {inv.discount_amount > 0 && <div className="flex justify-between text-warning"><span>{ar ? "الخصم" : "Discount"}</span><span className="font-mono">- {fmt(inv.discount_amount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">{ar ? `ضريبة القيمة المضافة (${s.vat_rate ?? 15}%)` : `VAT (${s.vat_rate ?? 15}%)`}</span><span className="font-mono">{fmt(inv.vat_amount)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/60 font-display text-lg"><span>{ar ? "الإجمالي" : "Total"}</span><span>{fmt(inv.total_amount)}</span></div>
            {inv.paid_amount > 0 && <div className="flex justify-between text-success"><span>{ar ? "المدفوع" : "Paid"}</span><span className="font-mono">{fmt(inv.paid_amount)}</span></div>}
            {inv.total_amount - inv.paid_amount > 0 && <div className="flex justify-between font-medium"><span>{ar ? "المتبقي" : "Balance Due"}</span><span className="font-mono">{fmt(inv.total_amount - inv.paid_amount)}</span></div>}
          </div>

          {s.invoice_footer && <div className="mt-10 pt-6 border-t border-border/60 text-xs text-muted-foreground text-center whitespace-pre-line">{s.invoice_footer}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
