import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListMessages, adminMessageAction } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/messages")({ component: Messages });

function Messages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => adminListMessages() });
  const act = useMutation({
    mutationFn: (v: { id: number; action: "read" | "unread" | "delete" }) => adminMessageAction({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">الرسائل</h1>
      {isLoading && <p>جارٍ التحميل…</p>}
      {data?.length === 0 && <p className="text-muted-foreground">لا توجد رسائل بعد.</p>}
      <div className="space-y-3">
        {data?.map((m: any) => (
          <div key={m.id} className={`rounded-xl border bg-background p-4 ${m.is_read ? "" : "border-primary"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="font-medium">{m.name} <span className="text-muted-foreground" dir="ltr">{m.phone ?? ""} {m.email ?? ""}</span></div>
              <div className="text-xs text-muted-foreground" dir="ltr">{new Date(m.created_at).toLocaleString()} · {m.source}</div>
            </div>
            {m.subject ? <div className="mt-1 font-medium">{m.subject}</div> : null}
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm" dir="auto">{m.message}</pre>
            <div className="mt-3 flex gap-2">
              {m.phone ? <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${String(m.phone).replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">واتساب</a></Button> : null}
              <Button size="sm" variant="outline" onClick={() => act.mutate({ id: m.id, action: m.is_read ? "unread" : "read" })}>{m.is_read ? "تعليم كغير مقروءة" : "تعليم كمقروءة"}</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("حذف الرسالة؟")) act.mutate({ id: m.id, action: "delete" }); }}>حذف</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
