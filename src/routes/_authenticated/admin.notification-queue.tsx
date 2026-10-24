import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCcw, XCircle, RotateCcw } from "lucide-react";
import { listNotificationQueue, retryNotification, cancelNotification } from "@/lib/notifications.functions";
import { useHasPermission } from "@/lib/rbac";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/notification-queue")({ component: QueuePage });

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-blue-500/10 text-blue-600",
  sending: "bg-yellow-500/10 text-yellow-600",
  sent: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
  cancelled: "bg-muted text-muted-foreground",
};

function QueuePage() {
  const { locale } = useI18n();
  const gate = useHasPermission("notifications.view");
  const list = useServerFn(listNotificationQueue);
  const retry = useServerFn(retryNotification);
  const cancel = useServerFn(cancelNotification);
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");

  const q = useQuery({
    queryKey: ["nq", status, channel],
    enabled: gate.allowed,
    queryFn: () => list({ data: {
      status: status === "all" ? undefined : status as any,
      channel: channel === "all" ? undefined : channel as any,
      limit: 200,
    } }),
    refetchInterval: 15_000,
  });

  const retryM = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: () => { toast.success("Requeued"); qc.invalidateQueries({ queryKey: ["nq"] }); },
  });
  const cancelM = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => { toast.success("Cancelled"); qc.invalidateQueries({ queryKey: ["nq"] }); },
  });

  const cols: Column<any>[] = [
    { key: "created_at", header: "Queued", render: (r) => <span className="text-xs">{new Date(r.created_at).toLocaleString()}</span> },
    { key: "channel", header: "Channel", render: (r) => <Badge variant="outline">{r.channel}</Badge> },
    { key: "template", header: "Template", render: (r) => r.template ?? "—" },
    { key: "recipient", header: "Recipient", render: (r) => <span className="font-mono text-xs">{r.recipient}</span> },
    { key: "status", header: "Status", render: (r) => <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</span> },
    { key: "attempts", header: "Attempts", render: (r) => <span className="text-xs">{r.attempts}/{r.max_attempts}</span> },
    { key: "scheduled_for", header: "Next attempt", render: (r) => <span className="text-xs">{new Date(r.scheduled_for).toLocaleString()}</span> },
    { key: "last_error", header: "Last error", render: (r) => r.last_error ? <span className="text-xs text-red-600 truncate block max-w-xs">{r.last_error}</span> : "—" },
    {
      key: "id", header: "Actions", render: (r) => (
        <div className="flex gap-1">
          {(r.status === "failed" || r.status === "cancelled") && (
            <Button size="sm" variant="ghost" onClick={() => retryM.mutate(r.id)}><RotateCcw className="h-3.5 w-3.5" /></Button>
          )}
          {(r.status === "queued" || r.status === "failed") && (
            <Button size="sm" variant="ghost" onClick={() => cancelM.mutate(r.id)}><XCircle className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      ),
    },
  ];

  if (!gate.loading && !gate.allowed) return <div className="p-8 text-center text-muted-foreground">Not authorized</div>;

  const summary = (q.data ?? []).reduce((acc: any, r: any) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {});

  return (
    <div>
      <PageHeader
        title={locale === "ar" ? "قائمة الإشعارات" : "Notification Queue"}
        description={locale === "ar" ? "WhatsApp، البريد، الرسائل النصية — قائمة انتظار مع إعادة المحاولة" : "WhatsApp, email, SMS delivery queue with retry and backoff"}
        actions={<Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["nq"] })}><RefreshCcw className="h-4 w-4 me-2" />Refresh</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {["queued", "sending", "sent", "failed", "cancelled"].map((s) => (
          <Card key={s}><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground capitalize">{s}</div>
            <div className="text-2xl font-display">{summary[s] ?? 0}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 flex items-center gap-3">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">{q.data?.length ?? 0} rows · auto-refresh 15s</div>
        </CardContent>
      </Card>

      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
