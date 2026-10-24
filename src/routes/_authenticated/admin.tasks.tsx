import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Flag, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/tasks")({ component: TasksPage });

const STATUSES = ["open", "in_progress", "blocked", "done", "cancelled"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/15 text-blue-600",
  high: "bg-orange-500/15 text-orange-600",
  urgent: "bg-destructive/15 text-destructive",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-primary/15 text-primary",
  in_progress: "bg-yellow-500/15 text-yellow-700",
  blocked: "bg-destructive/15 text-destructive",
  done: "bg-green-600/15 text-green-700",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABEL_AR: Record<string, string> = { open: "مفتوح", in_progress: "قيد التنفيذ", blocked: "معلّق", done: "مكتمل", cancelled: "ملغى" };
const PRIORITY_LABEL_AR: Record<string, string> = { low: "منخفض", normal: "عادي", high: "مرتفع", urgent: "عاجل" };

function TasksPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const statusLabel = (v: string) => ar ? (STATUS_LABEL_AR[v] ?? v) : v.replace("_", " ");
  const priorityLabel = (v: string) => ar ? (PRIORITY_LABEL_AR[v] ?? v) : v;

  const q = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await (supabase.from as any)("tasks").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const staff = useQuery({
    queryKey: ["staff-lookup"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").order("full_name")).data ?? [],
  });
  const staffMap = useMemo(() => {
    const m: Record<string, string> = {};
    (staff.data ?? []).forEach((p: any) => (m[p.id] = p.full_name ?? p.email));
    return m;
  }, [staff.data]);

  const filtered = useMemo(() => {
    const rows = (q.data ?? []) as any[];
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "active" && (r.status === "done" || r.status === "cancelled")) return false;
      if (statusFilter !== "all" && statusFilter !== "active" && r.status !== statusFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (assigneeFilter === "me") { /* handled outside */ }
      if (assigneeFilter !== "all" && assigneeFilter !== "me" && r.assignee_id !== assigneeFilter) return false;
      if (!s) return true;
      const hay = [r.title, r.description, (r.tags ?? []).join(" ")].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [q.data, search, statusFilter, priorityFilter, assigneeFilter]);

  const update = async (id: string, patch: Record<string, any>) => {
    const { error } = await (supabase.from as any)("tasks").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };
  const del = async (id: string) => {
    if (!confirm(ar ? "حذف المهمة؟" : "Delete task?")) return;
    const { error } = await (supabase.from as any)("tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const badge = (v: string, map: Record<string, string>, label: string) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[v]}`}>{label}</span>
  );

  const overdue = (r: any) => r.due_at && new Date(r.due_at).getTime() < Date.now() && r.status !== "done" && r.status !== "cancelled";

  const cols: Column<any>[] = [
    { key: "title", header: ar ? "المهمة" : "Task", render: (r) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{r.title}</div>
        {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
      </div>
    ) },
    { key: "priority", header: ar ? "الأولوية" : "Priority", render: (r) => badge(r.priority, PRIORITY_COLOR, priorityLabel(r.priority)) },
    { key: "status", header: ar ? "الحالة" : "Status", render: (r) => badge(r.status, STATUS_COLOR, statusLabel(r.status)) },
    { key: "assignee", header: ar ? "المكلَّف" : "Assignee", render: (r) => <span className="text-xs">{r.assignee_id ? staffMap[r.assignee_id] ?? "—" : "—"}</span> },
    { key: "due", header: ar ? "الاستحقاق" : "Due", render: (r) => r.due_at ? (
      <span className={`text-xs ${overdue(r) ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
        <Clock className="inline h-3 w-3 me-1" />{new Date(r.due_at).toLocaleDateString(ar ? "ar" : "en")}
      </span>
    ) : <span className="text-xs text-muted-foreground">—</span> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-1">
        {r.status !== "done" && <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); update(r.id, { status: "done" }); }}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>}
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); del(r.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  const counts = {
    all: (q.data ?? []).length,
    active: (q.data ?? []).filter((r: any) => r.status !== "done" && r.status !== "cancelled").length,
    overdue: (q.data ?? []).filter(overdue).length,
    done: (q.data ?? []).filter((r: any) => r.status === "done").length,
  };
  const countLabels: Record<string, string> = ar
    ? { all: "الإجمالي", active: "نشطة", overdue: "متأخرة", done: "مكتملة" }
    : { all: "Total", active: "Active", overdue: "Overdue", done: "Done" };

  return (
    <div>
      <PageHeader
        title={ar ? "المهام" : "Tasks"}
        description={ar ? "متابعة مهام الفريق الداخلية" : "Internal task tracker for operations staff"}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{ar ? "مهمة جديدة" : "New task"}</Button></DialogTrigger>
            <NewTaskDialog ar={ar} staff={staff.data ?? []} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["tasks"] }); }} />
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["all","active","overdue","done"] as const).map((k) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{countLabels[k]}</div>
            <div className={`font-display text-3xl mt-1 ${k === "overdue" && counts.overdue > 0 ? "text-destructive" : ""}`}>{counts[k]}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="active">{ar ? "نشطة" : "Active"}</TabsTrigger>
            <TabsTrigger value="open">{statusLabel("open")}</TabsTrigger>
            <TabsTrigger value="in_progress">{statusLabel("in_progress")}</TabsTrigger>
            <TabsTrigger value="blocked">{statusLabel("blocked")}</TabsTrigger>
            <TabsTrigger value="done">{statusLabel("done")}</TabsTrigger>
            <TabsTrigger value="all">{ar ? "الكل" : "All"}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "بحث في المهام…" : "Search tasks…"} className="ps-9" />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل الأولويات" : "All priorities"}</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{priorityLabel(p)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "كل المكلَّفين" : "All assignees"}</SelectItem>
            {(staff.data ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filtered} columns={cols} loading={q.isLoading} onRowClick={(r) => setSelected(r)} />

      <TaskDetailDialog ar={ar} task={selected} onClose={() => setSelected(null)} staff={staff.data ?? []} staffMap={staffMap} onChange={() => qc.invalidateQueries({ queryKey: ["tasks"] })} statusLabel={statusLabel} priorityLabel={priorityLabel} />
    </div>
  );
}


function NewTaskDialog({ ar, staff, onDone }: { ar: boolean; staff: any[]; onDone: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", priority: "normal", status: "open" as any,
    assignee_id: user?.id ?? "", due_at: "",
  });
  const save = async () => {
    if (!form.title.trim()) return toast.error(ar ? "العنوان مطلوب" : "Title required");
    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      status: form.status,
      assignee_id: form.assignee_id || null,
      created_by: user?.id ?? null,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
    };
    const { error } = await (supabase.from as any)("tasks").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(ar ? "تم إنشاء المهمة" : "Task created");
    onDone();
  };
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{ar ? "مهمة جديدة" : "New task"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "العنوان" : "Title"}</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الوصف" : "Description"}</label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الأولوية" : "Priority"}</label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{ar ? (PRIORITY_LABEL_AR[p] ?? p) : p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "المكلَّف" : "Assignee"}</label>
            <Select value={form.assignee_id || "unassigned"} onValueChange={(v) => setForm({ ...form, assignee_id: v === "unassigned" ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{ar ? "غير محدد" : "Unassigned"}</SelectItem>
                {staff.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "تاريخ الاستحقاق" : "Due date"}</label>
          <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
        </div>
      </div>
      <DialogFooter><Button onClick={save}>{ar ? "إنشاء" : "Create"}</Button></DialogFooter>
    </DialogContent>
  );
}

function TaskDetailDialog({ ar, task, onClose, staff, staffMap, onChange, statusLabel, priorityLabel }: { ar: boolean; task: any; onClose: () => void; staff: any[]; staffMap: Record<string, string>; onChange: () => void; statusLabel: (v: string) => string; priorityLabel: (v: string) => string }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const comments = useQuery({
    queryKey: ["task-comments", task?.id],
    queryFn: async () => task ? (await (supabase.from as any)("task_comments").select("*").eq("task_id", task.id).order("created_at")).data ?? [] : [],
    enabled: !!task,
  });

  if (!task) return null;

  const update = async (patch: Record<string, any>) => {
    const { error } = await (supabase.from as any)("tasks").update(patch).eq("id", task.id);
    if (error) return toast.error(error.message);
    onChange();
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    const { error } = await (supabase.from as any)("task_comments").insert({ task_id: task.id, author_id: user?.id, body: comment.trim() });
    if (error) return toast.error(error.message);
    setComment("");
    comments.refetch();
  };

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{task.title}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_COLOR[task.priority]}`}><Flag className="h-3 w-3 me-1" />{priorityLabel(task.priority)}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {task.description && <div className="text-sm whitespace-pre-line rounded-lg border bg-muted/30 p-3">{task.description}</div>}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الحالة" : "Status"}</label>
              <Select defaultValue={task.status} onValueChange={(v) => update({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الأولوية" : "Priority"}</label>
              <Select defaultValue={task.priority} onValueChange={(v) => update({ priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{priorityLabel(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "المكلَّف" : "Assignee"}</label>
              <Select defaultValue={task.assignee_id ?? "unassigned"} onValueChange={(v) => update({ assignee_id: v === "unassigned" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{ar ? "غير محدد" : "Unassigned"}</SelectItem>
                  {staff.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "تاريخ الاستحقاق" : "Due date"}</label>
            <Input type="datetime-local" defaultValue={task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : ""}
              onBlur={(e) => update({ due_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </div>

          <div className="border-t pt-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><MessageSquare className="h-3 w-3" />{ar ? "التعليقات" : "Comments"} ({comments.data?.length ?? 0})</div>
            <div className="space-y-2 max-h-64 overflow-auto mb-2">
              {(comments.data ?? []).map((c: any) => (
                <div key={c.id} className="rounded-lg border bg-muted/30 p-2 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{staffMap[c.author_id] ?? (ar ? "موظف" : "Staff")}</span>
                    <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="whitespace-pre-line">{c.body}</div>
                </div>
              ))}
              {(comments.data ?? []).length === 0 && <div className="text-xs text-muted-foreground text-center py-3">{ar ? "لا توجد تعليقات بعد" : "No comments yet"}</div>}
            </div>
            <div className="flex gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={ar ? "أضف تعليقاً…" : "Add a comment…"} onKeyDown={(e) => e.key === "Enter" && addComment()} />
              <Button onClick={addComment} disabled={!comment.trim()}>{ar ? "إرسال" : "Send"}</Button>
            </div>
          </div>

          {(task.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

