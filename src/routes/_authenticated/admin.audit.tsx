import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExportMenu } from "@/components/ExportMenu";
import { useHasPermission } from "@/lib/rbac";
import { useI18n } from "@/lib/i18n";
import { rangeFromKey } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: Audit });

function Audit() {
  const { t, locale } = useI18n();
  const gate = useHasPermission("audit.view");
  const [rangeKey, setRangeKey] = useState<"7d"|"30d"|"90d"|"365d"|"mtd"|"ytd">("30d");
  const [q, setQ] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [tab, setTab] = useState("activity");
  const range = useMemo(() => rangeFromKey(rangeKey), [rangeKey]);

  const activity = useQuery({
    queryKey: ["activity", rangeKey],
    enabled: gate.allowed && tab === "activity",
    queryFn: async () => (await supabase.from("activity_events")
      .select("*")
      .gte("created_at", range.start.toISOString())
      .lte("created_at", range.end.toISOString())
      .order("created_at", { ascending: false }).limit(1000)).data ?? [],
  });

  const audit = useQuery({
    queryKey: ["audit", rangeKey],
    enabled: gate.allowed && tab === "audit",
    queryFn: async () => (await supabase.from("audit_logs")
      .select("*")
      .gte("created_at", range.start.toISOString())
      .lte("created_at", range.end.toISOString())
      .order("created_at", { ascending: false }).limit(1000)).data ?? [],
  });

  const source = tab === "activity" ? (activity.data ?? []) : (audit.data ?? []);
  const entityKey = tab === "activity" ? "entity_type" : "entity";

  const entities = useMemo(() => Array.from(new Set(source.map((r: any) => r[entityKey]).filter(Boolean))), [source, entityKey]);
  const filtered = useMemo(() => {
    return source.filter((r: any) => {
      if (entityFilter !== "all" && r[entityKey] !== entityFilter) return false;
      if (q.trim() && !JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [source, q, entityFilter, entityKey]);

  const ar = locale === "ar";
  const activityCols: Column<any>[] = [
    { key: "created_at", header: ar ? "التاريخ" : "When", render: (r) => new Date(r.created_at).toLocaleString(ar ? "ar" : "en") },
    { key: "entity_type", header: ar ? "الكيان" : "Entity", render: (r) => <Badge variant="outline">{r.entity_type}</Badge> },
    { key: "event_type", header: ar ? "الحدث" : "Event", render: (r) => <Badge variant="secondary">{r.event_type}</Badge> },
    { key: "from_value", header: ar ? "من" : "From", render: (r) => r.from_value ? <span className="text-xs text-muted-foreground">{r.from_value}</span> : "—" },
    { key: "to_value", header: ar ? "إلى" : "To", render: (r) => r.to_value ? <span className="text-xs">{r.to_value}</span> : "—" },
    { key: "message", header: ar ? "الرسالة" : "Message", render: (r) => <span className="text-xs">{r.message}</span> },
    { key: "actor_id", header: ar ? "المستخدم" : "Actor", render: (r) => <span className="font-mono text-[10px]">{r.actor_id?.slice(0, 8) ?? (ar ? "النظام" : "system")}</span> },
  ];

  const auditCols: Column<any>[] = [
    { key: "created_at", header: ar ? "التاريخ" : "When", render: (r) => new Date(r.created_at).toLocaleString(ar ? "ar" : "en") },
    { key: "action", header: ar ? "الإجراء" : "Action", render: (r) => <Badge variant="outline">{r.action}</Badge> },
    { key: "entity", header: ar ? "الكيان" : "Entity" },
    { key: "entity_id", header: ar ? "السجل" : "Record", render: (r) => <span className="font-mono text-[10px]">{r.entity_id?.slice(0, 8) ?? "—"}</span> },
    { key: "user_id", header: ar ? "المستخدم" : "User", render: (r) => <span className="font-mono text-[10px]">{r.user_id?.slice(0, 8) ?? (ar ? "النظام" : "system")}</span> },
    { key: "metadata", header: ar ? "بيانات إضافية" : "Metadata", render: (r) => <span className="text-[10px] text-muted-foreground max-w-md truncate block">{r.metadata ? JSON.stringify(r.metadata) : "—"}</span> },
  ];

  const exportRows = filtered.map((r: any) => ({
    when: new Date(r.created_at).toISOString(),
    entity: r[entityKey],
    event: r.event_type ?? r.action,
    from: r.from_value,
    to: r.to_value,
    message: r.message,
    actor: r.actor_id ?? r.user_id,
    metadata: r.metadata ? JSON.stringify(r.metadata) : "",
  }));

  if (!gate.loading && !gate.allowed) return <div className="p-8 text-center text-muted-foreground">{ar ? "غير مصرح" : "Not authorized"}</div>;

  return (
    <div>
      <PageHeader
        title={ar ? "سجل التدقيق" : "Audit Log"}
        description={ar ? "سجل تلقائي لكل تغييرات النظام: إنشاء وتعديل الحجوزات، تغيير الحالات، إسناد السائقين والمركبات، تسجيل الدخول وإجراءات المستخدمين. يُستخدم للمحاسبة والمساءلة وتتبّع التلاعب." : "Automatic trail of every system change: bookings created/updated, status changes, driver/vehicle assignments, sign-ins and user actions. Used for accountability and tamper tracking."}
        actions={
          <div className="flex items-center gap-2">
            <Select value={rangeKey} onValueChange={(v: any) => setRangeKey(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{ar ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
                <SelectItem value="30d">{ar ? "آخر 30 يوماً" : "Last 30 days"}</SelectItem>
                <SelectItem value="90d">{ar ? "آخر 90 يوماً" : "Last 90 days"}</SelectItem>
                <SelectItem value="mtd">{ar ? "الشهر حتى تاريخه" : "MTD"}</SelectItem>
                <SelectItem value="ytd">{ar ? "السنة حتى تاريخها" : "YTD"}</SelectItem>
                <SelectItem value="365d">{ar ? "آخر 365 يوماً" : "Last 365 days"}</SelectItem>
              </SelectContent>
            </Select>
            <ExportMenu module="audit" filename={`audit-${tab}-${rangeKey}`} title={tab === "activity" ? (ar ? "أحداث النشاط" : "Activity events") : (ar ? "سجل التدقيق" : "Audit log")} rows={exportRows} columns={[
              { key: "when", label: ar ? "التاريخ" : "When" }, { key: "entity", label: ar ? "الكيان" : "Entity" }, { key: "event", label: ar ? "الحدث" : "Event" },
              { key: "from", label: ar ? "من" : "From" }, { key: "to", label: ar ? "إلى" : "To" }, { key: "message", label: ar ? "الرسالة" : "Message" },
              { key: "actor", label: ar ? "المستخدم" : "Actor" }, { key: "metadata", label: ar ? "بيانات إضافية" : "Metadata" },
            ]} />
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="activity">{ar ? "أحداث النشاط" : "Activity events"}</TabsTrigger>
          <TabsTrigger value="audit">{ar ? "سجل التدقيق" : "Audit log"}</TabsTrigger>
        </TabsList>

        <Card className="mb-4">
          <CardContent className="pt-6 flex flex-wrap items-center gap-3">
            <Input placeholder={ar ? "بحث…" : "Search…"} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder={ar ? "الكيان" : "Entity"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "كل الكيانات" : "All entities"}</SelectItem>
                {entities.map((e) => <SelectItem key={e as string} value={e as string}>{e as string}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">{ar ? `${filtered.length} من ${source.length}` : `${filtered.length} of ${source.length}`}</div>
          </CardContent>
        </Card>

        <TabsContent value="activity">
          <DataTable data={filtered} columns={activityCols} loading={activity.isLoading} />
        </TabsContent>
        <TabsContent value="audit">
          <DataTable data={filtered} columns={auditCols} loading={audit.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
