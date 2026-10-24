import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/notifications")({ component: Notifs });

function Notifs() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const q = useQuery({ queryKey: ["notifs"], queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  const cols: Column<any>[] = [
    { key: "title", header: ar ? "العنوان" : "Title" },
    { key: "body", header: ar ? "المحتوى" : "Body" },
    { key: "type", header: ar ? "النوع" : "Type", render: (r) => r.type ? <Badge variant="outline">{r.type}</Badge> : "—" },
    { key: "is_read", header: ar ? "مقروء" : "Read", render: (r) => r.is_read ? "✓" : "—" },
    { key: "created_at", header: ar ? "التاريخ" : "Date", render: (r) => new Date(r.created_at).toLocaleString(ar ? "ar" : "en") },
  ];
  return (
    <div>
      <PageHeader title={t("notifications")} description={ar ? "آخر 100 إشعار" : "Latest 100 notifications"} />
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
