import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/errors")({ component: ErrorsPage });

function ErrorsPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["error-logs", level, status, search],
    queryFn: async () => {
      let query = supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (level !== "all") query = query.eq("level", level);
      if (status === "open") query = query.eq("resolved", false);
      if (status === "resolved") query = query.eq("resolved", true);
      if (search) query = query.ilike("message", `%${search}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  const resolve = async (id: string, resolved: boolean) => {
    const { error } = await supabase.from("error_logs").update({ resolved }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(resolved ? (ar ? "تم الحل" : "Marked resolved") : (ar ? "أُعيد فتحه" : "Reopened"));
    qc.invalidateQueries({ queryKey: ["error-logs"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف هذا السجل؟" : "Delete this error log?")) return;
    const { error } = await supabase.from("error_logs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["error-logs"] });
  };

  const clearAll = async () => {
    if (!confirm(ar ? "حذف جميع السجلات المعروضة؟" : "Delete all shown logs?")) return;
    const ids = (q.data ?? []).map((r: any) => r.id);
    if (!ids.length) return;
    const { error } = await supabase.from("error_logs").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(ar ? `تم حذف ${ids.length}` : `Deleted ${ids.length}`);
    qc.invalidateQueries({ queryKey: ["error-logs"] });
  };

  const resolveAll = async () => {
    const ids = (q.data ?? []).filter((r: any) => !r.resolved).map((r: any) => r.id);
    if (!ids.length) return;
    const { error } = await supabase.from("error_logs").update({ resolved: true }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(ar ? `تم حل ${ids.length}` : `Resolved ${ids.length}`);
    qc.invalidateQueries({ queryKey: ["error-logs"] });
  };

  const cols: Column<any>[] = [
    { key: "when", header: ar ? "التاريخ" : "When", render: (r) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString(ar ? "ar" : "en")}</span> },
    { key: "level", header: ar ? "المستوى" : "Level", render: (r) => (
      <Badge variant={r.level === "fatal" || r.level === "error" ? "destructive" : "secondary"} className="text-[10px]">{r.level}</Badge>
    )},
    { key: "source", header: ar ? "المصدر" : "Src", render: (r) => <span className="text-xs">{r.source}</span> },
    { key: "message", header: ar ? "الرسالة" : "Message", render: (r) => (
      <div className="max-w-xl">
        <div className="text-sm font-medium truncate">{r.message}</div>
        {r.url && <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><ExternalLink className="h-3 w-3" /> {r.url}</div>}
      </div>
    )},
    { key: "status", header: ar ? "الحالة" : "Status", render: (r) => r.resolved
      ? <Badge className="bg-emerald-600 hover:bg-emerald-600">{ar ? "محلول" : "Resolved"}</Badge>
      : <Badge variant="outline">{ar ? "مفتوح" : "Open"}</Badge>
    },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => resolve(r.id, !r.resolved)} title={r.resolved ? (ar ? "إعادة فتح" : "Reopen") : (ar ? "تحديد كمحلول" : "Mark resolved")}>
          <CheckCircle2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => del(r.id)} title={ar ? "حذف" : "Delete"}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title={ar ? "سجلات الأخطاء" : "Error Logs"}
        description={ar ? "أخطاء التنفيذ الفعلية المُلتقطة تلقائيًا من متصفحات الزوار والخادم (فشل الشبكة، استثناءات JS، أخطاء API). تساعدك على اكتشاف المشاكل قبل الشكاوى. ليست بيانات تجريبية." : "Real runtime errors auto-captured from visitor browsers and the server (network failures, JS exceptions, API errors). Helps you catch issues before customer complaints. Not demo data."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resolveAll}>{ar ? "حل الكل" : "Resolve all"}</Button>
            <Button variant="outline" size="sm" onClick={clearAll}>{ar ? "حذف الكل" : "Clear all"}</Button>
          </div>
        }
      />
      <div className="flex gap-2 flex-wrap mb-4">
        <Input placeholder={ar ? "بحث بالرسالة…" : "Search message…"} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل المستويات" : "All levels"}</SelectItem>
            <SelectItem value="error">{ar ? "خطأ" : "Error"}</SelectItem>
            <SelectItem value="fatal">{ar ? "حرج" : "Fatal"}</SelectItem>
            <SelectItem value="warn">{ar ? "تحذير" : "Warn"}</SelectItem>
            <SelectItem value="info">{ar ? "معلومة" : "Info"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{ar ? "مفتوح" : "Open"}</SelectItem>
            <SelectItem value="resolved">{ar ? "محلول" : "Resolved"}</SelectItem>
            <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable data={q.data ?? []} columns={cols} loading={q.isLoading} />
    </div>
  );
}
