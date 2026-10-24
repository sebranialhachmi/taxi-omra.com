import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { opsSnapshot } from "@/lib/ops.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Database, HardDrive, ShieldCheck, MessageCircle, Bot } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/operations")({ component: OpsPage });

const ICONS: Record<string, any> = {
  Database, Storage: HardDrive, Auth: ShieldCheck, "WhatsApp templates": MessageCircle, "AI Gateway": Bot,
};

const SERVICE_LABELS_AR: Record<string, string> = {
  Database: "قاعدة البيانات",
  Storage: "التخزين",
  Auth: "المصادقة",
  "WhatsApp templates": "قوالب واتساب",
  "AI Gateway": "بوابة الذكاء الاصطناعي",
};

const COUNTER_LABELS_AR: Record<string, string> = {
  users: "المستخدمون",
  bookings: "الحجوزات",
  customers: "العملاء",
  drivers: "السائقون",
  vehicles: "المركبات",
  invoices: "الفواتير",
  payments: "المدفوعات",
  expenses: "المصروفات",
  routes: "الرحلات",
  cms_pages: "صفحات المحتوى",
  blog_posts: "المدونات",
  faqs: "الأسئلة الشائعة",
  media: "الوسائط",
};

function StatusBadge({ status, ar }: { status: "ok" | "warn" | "down"; ar: boolean }) {
  if (status === "ok") return <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1"><CheckCircle2 className="h-3 w-3" /> {ar ? "يعمل" : "Operational"}</Badge>;
  if (status === "warn") return <Badge className="bg-amber-500 hover:bg-amber-500 text-black gap-1"><AlertTriangle className="h-3 w-3" /> {ar ? "متدهور" : "Degraded"}</Badge>;
  return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {ar ? "متوقف" : "Down"}</Badge>;
}

function bytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function OpsPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const fn = useServerFn(opsSnapshot);
  const q = useQuery({
    queryKey: ["ops-snapshot"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader
          title={ar ? "العمليات" : "Operations"}
          description={ar ? "حالة النظام المباشرة وفحوصات الخدمات وسعة المنصة. يُحدَّث تلقائياً كل 30 ثانية." : "Live system health, service checks, and platform capacity. Auto-refreshes every 30 seconds."}
        />
        <Button variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`h-4 w-4 me-2 ${q.isFetching ? "animate-spin" : ""}`} /> {ar ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {q.error && (
        <Card className="p-4 mb-6 border-destructive text-destructive text-sm">
          {(q.error as Error).message}
        </Card>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ar ? "الخدمات" : "Services"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data?.services ?? []).map((s) => {
            const Icon = ICONS[s.name] ?? Database;
            const label = ar ? (SERVICE_LABELS_AR[s.name] ?? s.name) : s.name;
            return (
              <Card key={s.name} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{label}</div>
                    {s.detail && <div className="text-xs text-muted-foreground">{s.detail}</div>}
                  </div>
                </div>
                <StatusBadge status={s.status} ar={ar} />
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ar ? "المنصة" : "Platform"}</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {Object.entries(q.data?.counters ?? {}).map(([k, v]) => (
            <Card key={k} className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? (COUNTER_LABELS_AR[k] ?? k.replace(/_/g, " ")) : k.replace(/_/g, " ")}</div>
              <div className="text-2xl font-semibold mt-1">{v as number}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{ar ? "التخزين" : "Storage"}</h2>
        <Card className="p-4 grid grid-cols-2 gap-6 max-w-md">
          <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الملفات" : "Files"}</div><div className="text-2xl font-semibold">{q.data?.storage.files ?? 0}</div></div>
          <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الحجم" : "Size"}</div><div className="text-2xl font-semibold">{bytes(q.data?.storage.bytes ?? 0)}</div></div>
        </Card>
      </section>

      {q.data?.captured_at && <p className="text-xs text-muted-foreground mt-6">{ar ? "آخر فحص" : "Last check"}: {new Date(q.data.captured_at).toLocaleString(ar ? "ar" : "en")}</p>}
    </div>
  );
}
