import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, INVOICE_STATUSES, downloadCSV } from "@/lib/finance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/invoices")({ component: Invoices });

function Invoices() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const q = useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      (await supabase
        .from("invoices")
        .select("*, customer:customers(full_name), booking:bookings(code), corporate:corporate_accounts(company_name)")
        .order("created_at", { ascending: false })
        .limit(500)).data ?? [],
  });

  const rows = (q.data ?? []).filter((r: any) => {
    if (status !== "all" && r.status !== status) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.invoice_number?.toLowerCase().includes(s)
        || r.customer?.full_name?.toLowerCase().includes(s)
        || r.corporate?.company_name?.toLowerCase().includes(s);
    }
    return true;
  });

  const cols: Column<any>[] = [
    { key: "invoice_number", header: "#", render: (r) => <Link to="/admin/invoices/$id" params={{ id: r.id }} className="font-mono text-xs text-gold hover:underline">{r.invoice_number}</Link> },
    { key: "customer", header: ar ? "العميل" : "Customer", render: (r) => r.corporate?.company_name ?? r.customer?.full_name ?? "—" },
    { key: "booking", header: ar ? "الحجز" : "Booking", render: (r) => <span className="font-mono text-xs">{r.booking?.code ?? "—"}</span> },
    { key: "issue_date", header: ar ? "الإصدار" : "Issue", render: (r) => new Date(r.issue_date).toLocaleDateString() },
    { key: "due_date", header: ar ? "الاستحقاق" : "Due", render: (r) => r.due_date ? new Date(r.due_date).toLocaleDateString() : "—" },
    { key: "total", header: ar ? "الإجمالي" : "Total", render: (r) => <span className="font-display">{fmtMoney(r.total_amount, r.currency, locale)}</span> },
    { key: "paid", header: ar ? "المدفوع" : "Paid", render: (r) => fmtMoney(r.paid_amount, r.currency, locale) },
    { key: "status", header: ar ? "الحالة" : "Status", render: (r) => <StatusBadge value={r.status} /> },
  ];

  const exportCSV = () => {
    downloadCSV(`invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((r: any) => ({
        invoice_number: r.invoice_number,
        customer: r.corporate?.company_name ?? r.customer?.full_name ?? "",
        booking: r.booking?.code ?? "",
        issue_date: r.issue_date,
        due_date: r.due_date ?? "",
        subtotal: r.subtotal,
        vat: r.vat_amount,
        discount: r.discount_amount,
        total: r.total_amount,
        paid: r.paid_amount,
        status: r.status,
      })));
    toast.success("Exported");
  };

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "المالية" : "Finance"}
        title={ar ? "الفواتير" : "Invoices"}
        description={ar ? "الفواتير المُصدرة تلقائياً عند اكتمال الحجز" : "Invoices are auto-generated when bookings complete"}
        actions={<Button variant="outline" size="sm" className="rounded-full" onClick={exportCSV}><Download className="h-4 w-4 me-1.5" />CSV</Button>}
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
            {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        data={rows}
        columns={cols}
        loading={q.isLoading}
        onRowClick={(r) => { window.location.href = `/admin/invoices/${r.id}`; }}
        actions={(r) => (
          <Select value={r.status} onValueChange={async (v) => {
            const patch: any = { status: v };
            if (v === "paid") patch.paid_amount = r.total_amount;
            const { error } = await supabase.from("invoices").update(patch).eq("id", r.id);
            if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["invoices"] });
          }}>
            <SelectTrigger className="w-32 h-8" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
            <SelectContent>{INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
