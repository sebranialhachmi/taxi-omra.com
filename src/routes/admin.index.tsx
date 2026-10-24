import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminList, adminListMessages } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Count({ table, label }: { table: "pages" | "posts" | "faqs" | "prices"; label: string }) {
  const { data } = useQuery({ queryKey: ["admin", "list", table], queryFn: () => adminList({ data: { table } }) });
  return (
    <Link to="/admin/c/$table" params={{ table }} className="rounded-xl border bg-background p-4 hover:border-primary">
      <div className="text-3xl font-semibold">{data ? data.length : "…"}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Link>
  );
}

function Dashboard() {
  const { data: messages } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => adminListMessages() });
  const unread = messages?.filter((m: any) => !m.is_read).length ?? 0;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">أهلًا بك</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Count table="prices" label="أسعار" />
        <Count table="pages" label="صفحات" />
        <Count table="posts" label="مقالات" />
        <Count table="faqs" label="أسئلة شائعة" />
      </div>
      <Link to="/admin/messages" className="block rounded-xl border bg-background p-4 hover:border-primary">
        <div className="text-3xl font-semibold">{unread}</div>
        <div className="text-sm text-muted-foreground">رسائل جديدة غير مقروءة</div>
      </Link>
      <p className="text-sm text-muted-foreground">
        الحجز يتم عبر واتساب، وما يصل من نماذج الموقع يظهر في «الرسائل». عدّل الأسعار من «الأسعار» وتظهر في الموقع مباشرة.
      </p>
    </div>
  );
}
