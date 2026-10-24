import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExportMenu } from "@/components/ExportMenu";
import { useI18n } from "@/lib/i18n";
import { useHasPermission } from "@/lib/rbac";
import { rangeFromKey, num, money } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: Reports });

type Col = { key: string; label: string; label_ar?: string; render?: (r: any) => string };
type ReportDef = {
  key: string;
  label: string;
  label_ar: string;
  category: string;
  table?: string;
  select?: string;
  dateColumn?: string;
  columns: Col[];
  extra?: (row: any) => Record<string, any>;
};

const REPORTS: ReportDef[] = [
  { key: "bookings", label: "Bookings", label_ar: "الحجوزات", category: "Operations", table: "bookings",
    select: "code, status, pickup_at, pickup_location, dropoff_location, total_fare, source, customer:customers(full_name), driver:drivers(full_name)",
    dateColumn: "created_at",
    columns: [
      { key: "code", label: "Code", label_ar: "الرمز" },
      { key: "status", label: "Status", label_ar: "الحالة" },
      { key: "customer.full_name", label: "Customer", label_ar: "العميل" },
      { key: "driver.full_name", label: "Driver", label_ar: "السائق" },
      { key: "pickup_at", label: "Pickup", label_ar: "الاستلام" },
      { key: "pickup_location", label: "From", label_ar: "من" },
      { key: "dropoff_location", label: "To", label_ar: "إلى" },
      { key: "total_fare", label: "Fare", label_ar: "السعر" },
      { key: "source", label: "Source", label_ar: "المصدر" },
    ]},
  { key: "customers", label: "Customers", label_ar: "العملاء", category: "Operations", table: "customers",
    select: "full_name, phone_primary, email, status, city, total_trips, total_spent, last_booking_at",
    dateColumn: "created_at",
    columns: [
      { key: "full_name", label: "Name", label_ar: "الاسم" }, { key: "phone_primary", label: "Phone", label_ar: "الهاتف" }, { key: "email", label: "Email", label_ar: "البريد" },
      { key: "status", label: "Status", label_ar: "الحالة" }, { key: "city", label: "City", label_ar: "المدينة" }, { key: "total_trips", label: "Trips", label_ar: "الرحلات" }, { key: "total_spent", label: "Spent", label_ar: "الإنفاق" }, { key: "last_booking_at", label: "Last", label_ar: "آخر حجز" },
    ]},
  { key: "drivers", label: "Drivers", label_ar: "السائقون", category: "Operations", table: "drivers",
    select: "full_name, phone, status, total_trips, completed_trips, total_earnings, rating, license_expiry",
    dateColumn: "created_at",
    columns: [
      { key: "full_name", label: "Name", label_ar: "الاسم" }, { key: "phone", label: "Phone", label_ar: "الهاتف" }, { key: "status", label: "Status", label_ar: "الحالة" },
      { key: "total_trips", label: "Trips", label_ar: "الرحلات" }, { key: "completed_trips", label: "Completed", label_ar: "المكتملة" }, { key: "total_earnings", label: "Earnings", label_ar: "الأرباح" },
      { key: "rating", label: "Rating", label_ar: "التقييم" }, { key: "license_expiry", label: "License Exp", label_ar: "انتهاء الرخصة" },
    ]},
  { key: "fleet", label: "Fleet", label_ar: "الأسطول", category: "Operations", table: "vehicles",
    select: "plate_number, model, year, status, category:vehicle_categories(name), insurance_expiry, inspection_expiry, odometer",
    dateColumn: "created_at",
    columns: [
      { key: "plate_number", label: "Plate", label_ar: "اللوحة" }, { key: "model", label: "Model", label_ar: "الطراز" }, { key: "year", label: "Year", label_ar: "السنة" }, { key: "status", label: "Status", label_ar: "الحالة" },
      { key: "category.name", label: "Category", label_ar: "الفئة" }, { key: "insurance_expiry", label: "Insurance", label_ar: "التأمين" }, { key: "inspection_expiry", label: "Inspection", label_ar: "الفحص" }, { key: "odometer", label: "Odometer", label_ar: "العداد" },
    ]},
  { key: "routes", label: "Routes", label_ar: "الرحلات", category: "Catalog", table: "routes",
    select: "name, slug, from_city, to_city, distance_km, base_price, is_active, is_featured",
    dateColumn: "created_at",
    columns: [
      { key: "name", label: "Route", label_ar: "الرحلة" }, { key: "slug", label: "Slug", label_ar: "الرابط" }, { key: "from_city", label: "From", label_ar: "من" }, { key: "to_city", label: "To", label_ar: "إلى" },
      { key: "distance_km", label: "km", label_ar: "كم" }, { key: "base_price", label: "Base", label_ar: "السعر" }, { key: "is_active", label: "Active", label_ar: "مفعّل" }, { key: "is_featured", label: "Featured", label_ar: "مميز" },
    ]},

  { key: "finance", label: "Finance summary", label_ar: "ملخص المالية", category: "Finance", table: "invoices",
    select: "invoice_number, total_amount, paid_amount, status, issue_date, due_date, customer:customers(full_name)",
    dateColumn: "issue_date",
    columns: [
      { key: "invoice_number", label: "Invoice", label_ar: "الفاتورة" }, { key: "customer.full_name", label: "Customer", label_ar: "العميل" }, { key: "total_amount", label: "Total", label_ar: "الإجمالي" },
      { key: "paid_amount", label: "Paid", label_ar: "المدفوع" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "issue_date", label: "Issued", label_ar: "الإصدار" }, { key: "due_date", label: "Due", label_ar: "الاستحقاق" },
    ]},
  { key: "expenses", label: "Expenses", label_ar: "المصروفات", category: "Finance", table: "expenses",
    select: "reference, category, amount, supplier, expense_date, vehicle:vehicles(plate_number), driver:drivers(full_name)",
    dateColumn: "expense_date",
    columns: [
      { key: "reference", label: "Ref", label_ar: "المرجع" }, { key: "category", label: "Category", label_ar: "الفئة" }, { key: "amount", label: "Amount", label_ar: "المبلغ" }, { key: "supplier", label: "Supplier", label_ar: "المورّد" },
      { key: "expense_date", label: "Date", label_ar: "التاريخ" }, { key: "vehicle.plate_number", label: "Vehicle", label_ar: "المركبة" }, { key: "driver.full_name", label: "Driver", label_ar: "السائق" },
    ]},
  { key: "invoices", label: "Invoices", label_ar: "الفواتير", category: "Finance", table: "invoices",
    select: "invoice_number, total_amount, paid_amount, status, issue_date, due_date, customer:customers(full_name)",
    dateColumn: "issue_date",
    columns: [
      { key: "invoice_number", label: "Invoice", label_ar: "الفاتورة" }, { key: "customer.full_name", label: "Customer", label_ar: "العميل" }, { key: "total_amount", label: "Total", label_ar: "الإجمالي" },
      { key: "paid_amount", label: "Paid", label_ar: "المدفوع" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "issue_date", label: "Issued", label_ar: "الإصدار" }, { key: "due_date", label: "Due", label_ar: "الاستحقاق" },
    ]},
  { key: "payments", label: "Payments", label_ar: "المدفوعات", category: "Finance", table: "payments",
    select: "payment_number, amount, method, status, paid_at, reference_number, customer:customers(full_name)",
    dateColumn: "created_at",
    columns: [
      { key: "payment_number", label: "Payment", label_ar: "الدفعة" }, { key: "customer.full_name", label: "Customer", label_ar: "العميل" }, { key: "amount", label: "Amount", label_ar: "المبلغ" },
      { key: "method", label: "Method", label_ar: "الطريقة" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "paid_at", label: "Paid", label_ar: "تاريخ الدفع" }, { key: "reference_number", label: "Ref", label_ar: "المرجع" },
    ]},
  { key: "corporate", label: "Corporate accounts", label_ar: "الحسابات المؤسسية", category: "Finance", table: "corporate_accounts",
    select: "company_name, contact_email, credit_limit, current_balance, status, vat_number", dateColumn: "created_at",
    columns: [
      { key: "company_name", label: "Company", label_ar: "الشركة" }, { key: "contact_email", label: "Email", label_ar: "البريد" }, { key: "credit_limit", label: "Credit", label_ar: "حد الائتمان" },
      { key: "current_balance", label: "Balance", label_ar: "الرصيد" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "vat_number", label: "VAT", label_ar: "الرقم الضريبي" },
    ]},

  { key: "marketing", label: "Marketing campaigns", label_ar: "الحملات التسويقية", category: "Marketing", table: "marketing_campaigns",
    select: "name, channel, status, start_date, end_date, budget, spent", dateColumn: "created_at",
    columns: [
      { key: "name", label: "Name", label_ar: "الاسم" }, { key: "channel", label: "Channel", label_ar: "القناة" }, { key: "status", label: "Status", label_ar: "الحالة" },
      { key: "start_date", label: "Start", label_ar: "البداية" }, { key: "end_date", label: "End", label_ar: "النهاية" }, { key: "budget", label: "Budget", label_ar: "الميزانية" }, { key: "spent", label: "Spent", label_ar: "المصروف" },
    ]},
  { key: "whatsapp", label: "WhatsApp messages", label_ar: "رسائل واتساب", category: "Marketing", table: "whatsapp_messages",
    select: "direction, phone, template, status, sent_at, booking_id", dateColumn: "created_at",
    columns: [
      { key: "direction", label: "Direction", label_ar: "الاتجاه" }, { key: "phone", label: "Phone", label_ar: "الهاتف" }, { key: "template", label: "Template", label_ar: "القالب" },
      { key: "status", label: "Status", label_ar: "الحالة" }, { key: "sent_at", label: "Sent", label_ar: "أُرسلت" }, { key: "booking_id", label: "Booking", label_ar: "الحجز" },
    ]},
  { key: "contacts", label: "Contact requests", label_ar: "طلبات التواصل", category: "Marketing", table: "contact_submissions",
    select: "name, email, phone, subject, status, priority, assigned_to", dateColumn: "created_at",
    columns: [
      { key: "name", label: "Name", label_ar: "الاسم" }, { key: "email", label: "Email", label_ar: "البريد" }, { key: "phone", label: "Phone", label_ar: "الهاتف" },
      { key: "subject", label: "Subject", label_ar: "الموضوع" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "priority", label: "Priority", label_ar: "الأولوية" },
    ]},

  { key: "seo", label: "SEO audit", label_ar: "تدقيق السيو", category: "SEO", table: "seo_meta",
    select: "path, title, description, canonical_url, robots, updated_at", dateColumn: "created_at",
    columns: [
      { key: "path", label: "Path", label_ar: "المسار" }, { key: "title", label: "Title", label_ar: "العنوان" }, { key: "description", label: "Description", label_ar: "الوصف" },
      { key: "canonical_url", label: "Canonical", label_ar: "الرابط الأساسي" }, { key: "robots", label: "Robots", label_ar: "الفهرسة" },
    ]},
  { key: "redirects", label: "SEO redirects", label_ar: "التحويلات", category: "SEO", table: "seo_redirects",
    select: "source_path, target_path, status_code, is_active", dateColumn: "created_at",
    columns: [
      { key: "source_path", label: "From", label_ar: "من" }, { key: "target_path", label: "To", label_ar: "إلى" },
      { key: "status_code", label: "Code", label_ar: "الرمز" }, { key: "is_active", label: "Active", label_ar: "مفعّل" },
    ]},
  { key: "cms", label: "CMS pages", label_ar: "صفحات المحتوى", category: "CMS", table: "cms_pages",
    select: "slug, page_type, title_en, title_ar, status, published_at", dateColumn: "created_at",
    columns: [
      { key: "slug", label: "Slug", label_ar: "الرابط" }, { key: "page_type", label: "Type", label_ar: "النوع" }, { key: "title_en", label: "Title EN", label_ar: "العنوان EN" },
      { key: "title_ar", label: "Title AR", label_ar: "العنوان AR" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "published_at", label: "Published", label_ar: "النشر" },
    ]},
  { key: "blog", label: "Blog posts", label_ar: "المدونة", category: "CMS", table: "blog_posts",
    select: "slug, title_en, title_ar, status, published_at, reading_time_min", dateColumn: "created_at",
    columns: [
      { key: "slug", label: "Slug", label_ar: "الرابط" }, { key: "title_en", label: "Title EN", label_ar: "العنوان EN" },
      { key: "title_ar", label: "Title AR", label_ar: "العنوان AR" }, { key: "status", label: "Status", label_ar: "الحالة" }, { key: "published_at", label: "Published", label_ar: "النشر" },
    ]},
  { key: "faqs", label: "FAQs", label_ar: "الأسئلة الشائعة", category: "CMS", table: "faqs",
    select: "question_en, question_ar, category, is_active, sort_order", dateColumn: "created_at",
    columns: [
      { key: "question_en", label: "Question EN", label_ar: "السؤال EN" }, { key: "question_ar", label: "Question AR", label_ar: "السؤال AR" },
      { key: "category", label: "Category", label_ar: "الفئة" }, { key: "is_active", label: "Active", label_ar: "مفعّل" },
    ]},

  { key: "users", label: "Users", label_ar: "المستخدمون", category: "System", table: "profiles",
    select: "email, full_name, phone, created_at", dateColumn: "created_at",
    columns: [{ key: "email", label: "Email", label_ar: "البريد" }, { key: "full_name", label: "Name", label_ar: "الاسم" }, { key: "phone", label: "Phone", label_ar: "الهاتف" }, { key: "created_at", label: "Joined", label_ar: "الانضمام" }] },
  { key: "activity", label: "Activity logs", label_ar: "سجل النشاط", category: "System", table: "activity_events",
    select: "entity_type, entity_id, event_type, from_value, to_value, message, actor_id, created_at", dateColumn: "created_at",
    columns: [
      { key: "created_at", label: "When", label_ar: "التاريخ" }, { key: "entity_type", label: "Entity", label_ar: "الكيان" }, { key: "event_type", label: "Event", label_ar: "الحدث" },
      { key: "from_value", label: "From", label_ar: "من" }, { key: "to_value", label: "To", label_ar: "إلى" }, { key: "message", label: "Message", label_ar: "الرسالة" },
    ]},
  { key: "errors", label: "Error logs", label_ar: "سجل الأخطاء", category: "System", table: "error_logs",
    select: "level, message, source, url, resolved, created_at", dateColumn: "created_at",
    columns: [
      { key: "created_at", label: "When", label_ar: "التاريخ" }, { key: "level", label: "Level", label_ar: "المستوى" }, { key: "source", label: "Source", label_ar: "المصدر" },
      { key: "message", label: "Message", label_ar: "الرسالة" }, { key: "url", label: "URL", label_ar: "الرابط" }, { key: "resolved", label: "Resolved", label_ar: "محلول" },
    ]},
];

// Category order: Operations, Catalog, CMS, Finance, Marketing, SEO, System
const CATEGORIES = ["Operations", "Catalog", "CMS", "Finance", "Marketing", "SEO", "System"];

const CAT_LABEL_AR: Record<string, string> = {
  Operations: "العمليات", Catalog: "الكتالوج", CMS: "المحتوى",
  Finance: "المالية", Marketing: "التسويق", SEO: "السيو", System: "النظام",
};

const getVal = (obj: any, path: string): any => path.split(".").reduce((v, k) => (v == null ? v : v[k]), obj);

function Reports() {
  const { locale } = useI18n();
  const ar = locale === "ar";

  const gate = useHasPermission("reports.view");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [selected, setSelected] = useState<string>("bookings");
  const [rangeKey, setRangeKey] = useState<"7d"|"30d"|"90d"|"365d"|"mtd"|"ytd">("30d");
  const [q, setQ] = useState("");
  const range = useMemo(() => rangeFromKey(rangeKey), [rangeKey]);
  const def = REPORTS.find((r) => r.key === selected)!;


  const query = useQuery({
    queryKey: ["report", selected, rangeKey],
    enabled: gate.allowed,
    queryFn: async () => {
      const b: any = (supabase.from as any)(def.table)
        .select(def.select ?? "*")
        .order(def.dateColumn ?? "created_at", { ascending: false })
        .limit(2000);
      if (def.dateColumn) {
        b.gte(def.dateColumn, range.start.toISOString());
        b.lte(def.dateColumn, range.end.toISOString());
      }
      const { data } = await b;
      return data ?? [];
    },
  });

  const rows = query.data ?? [];
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r: any) => JSON.stringify(r).toLowerCase().includes(s));
  }, [rows, q]);

  const flatRows = filtered.map((r: any) => {
    const out: Record<string, any> = {};
    def.columns.forEach((c) => { out[c.key.replaceAll(".", "_")] = getVal(r, c.key); });
    return out;
  });
  const flatCols = def.columns.map((c) => ({ key: c.key.replaceAll(".", "_"), label: c.label }));

  if (!gate.loading && !gate.allowed) return <div className="p-8 text-center text-muted-foreground">{ar ? "غير مصرح" : "Not authorized"}</div>;

  const RANGE_LABEL: Record<string, string> = ar
    ? { "7d": "آخر 7 أيام", "30d": "آخر 30 يوم", "90d": "آخر 90 يوم", mtd: "منذ بداية الشهر", ytd: "منذ بداية السنة", "365d": "آخر 365 يوم" }
    : { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", mtd: "Month to date", ytd: "Year to date", "365d": "Last 365 days" };

  const reportLabel = (r: ReportDef) => ar ? r.label_ar : r.label;
  const colLabel = (c: Col) => ar && c.label_ar ? c.label_ar : c.label;

  return (
    <div>
      <PageHeader
        title={ar ? "التقارير" : "Reports"}
        description={ar ? `${REPORTS.length} تقرير عبر ${CATEGORIES.length} فئات` : `${REPORTS.length} reports across ${CATEGORIES.length} categories`}
        actions={
          <div className="flex items-center gap-2">
            <Select value={rangeKey} onValueChange={(v: any) => setRangeKey(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["7d","30d","90d","mtd","ytd","365d"] as const).map((k) => <SelectItem key={k} value={k}>{RANGE_LABEL[k]}</SelectItem>)}
              </SelectContent>
            </Select>
            <ExportMenu module="reports" filename={`report-${selected}-${rangeKey}`} title={reportLabel(def)} rows={flatRows} columns={flatCols.map((c) => {
              const src = def.columns.find((x) => x.key.replaceAll(".", "_") === c.key);
              return { key: c.key, label: ar && src?.label_ar ? src.label_ar : c.label };
            })} />
          </div>
        }
      />

      <Tabs value={category} onValueChange={(v) => {
        setCategory(v);
        const first = REPORTS.find((r) => r.category === v);
        if (first) setSelected(first.key);
      }}>
        <TabsList className="mb-4 flex-wrap h-auto">
          {CATEGORIES.map((c) => <TabsTrigger key={c} value={c}>{ar ? (CAT_LABEL_AR[c] ?? c) : c}</TabsTrigger>)}
        </TabsList>
        <div className="flex flex-wrap gap-2 mb-4">
          {REPORTS.filter((r) => r.category === category).map((r) => (
            <button key={r.key} onClick={() => setSelected(r.key)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${selected === r.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-gold"}`}>
              {reportLabel(r)}
            </button>
          ))}
        </div>
      </Tabs>


      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{reportLabel(def)}</CardTitle>
            <div className="text-xs text-muted-foreground mt-1">{filtered.length} {ar ? "سجل" : "rows"} · {ar ? (CAT_LABEL_AR[def.category] ?? def.category) : def.category}</div>
          </div>
          <Input placeholder={ar ? "بحث…" : "Search…"} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {query.error && <div className="text-sm text-destructive mb-3">{(query.error as Error).message}</div>}
          <Table>
            <TableHeader>
              <TableRow>{def.columns.map((c) => <TableHead key={c.key}>{colLabel(c)}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 500).map((r: any, i: number) => (
                <TableRow key={r.id ?? i}>
                  {def.columns.map((c) => {
                    const v = getVal(r, c.key);
                    return <TableCell key={c.key} className="max-w-[220px] truncate">
                      {typeof v === "boolean" ? <Badge variant="outline">{v ? (ar ? "نعم" : "yes") : (ar ? "لا" : "no")}</Badge>
                        : typeof v === "number" && ["amount","total","fare","earnings","spent","paid","budget","credit","balance"].some((k) => c.key.toLowerCase().includes(k)) ? <span className="font-mono">{money(locale, v)}</span>
                        : v instanceof Date ? v.toLocaleString(ar ? "ar" : "en") : (v == null ? "—" : String(v))}
                    </TableCell>;
                  })}
                </TableRow>
              ))}
              {!filtered.length && <TableRow><TableCell colSpan={def.columns.length} className="text-center text-muted-foreground py-8">{query.isLoading ? (ar ? "جارٍ التحميل…" : "Loading…") : (ar ? "لا توجد بيانات في هذه الفترة" : "No data in this range")}</TableCell></TableRow>}
            </TableBody>
          </Table>
          {filtered.length > 500 && <div className="text-center text-xs text-muted-foreground py-3">{ar ? `يعرض أول 500 من ${filtered.length}. صدّر لكامل البيانات.` : `Showing first 500 of ${filtered.length}. Export for full dataset.`}</div>}

        </CardContent>
      </Card>
    </div>
  );
}
