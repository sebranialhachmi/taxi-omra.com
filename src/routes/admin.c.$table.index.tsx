import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminDelete, adminList, EDITABLE_TABLES, type EditableTable } from "@/lib/admin.functions";
import { TABLE_CONFIG } from "@/lib/admin-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/c/$table/")({
  beforeLoad: ({ params }) => {
    if (!(EDITABLE_TABLES as readonly string[]).includes(params.table)) throw notFound();
  },
  component: ListPage,
});

const show = (v: unknown) => (v === true ? "✓" : v === false ? "—" : v == null ? "" : String(v));

function ListPage() {
  const table = Route.useParams().table as EditableTable;
  const cfg = TABLE_CONFIG[table];
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin", "list", table], queryFn: () => adminList({ data: { table } }) });
  const del = useMutation({
    mutationFn: (id: number) => adminDelete({ data: { table, id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin", "list", table] }); },
    onError: (e: any) => toast.error(e?.message ?? "تعذر الحذف"),
  });

  const rows = (data ?? []).filter((r: any) => {
    if (type && r.page_type !== type) return false;
    if (!q.trim()) return true;
    const hay = [r[cfg.title], r.slug, r.title_en, r.code, r.to_ar, r.from_en].join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  const types = table === "pages" ? Array.from(new Set((data ?? []).map((r: any) => r.page_type))) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{cfg.label} <span className="text-base text-muted-foreground">({rows.length})</span></h1>
        <Button asChild><Link to="/admin/c/$table/$id" params={{ table, id: "new" }}>+ جديد</Link></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        {types.length > 1 && (
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">كل الأنواع</option>
            {types.map((t) => <option key={t as string} value={t as string}>{t as string}</option>)}
          </select>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right">
            <tr>
              <th className="p-3">العنوان</th>
              {cfg.columns.map(([, h]) => <th key={h} className="p-3">{h}</th>)}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={cfg.columns.length + 2}>جارٍ التحميل…</td></tr>}
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <Link to="/admin/c/$table/$id" params={{ table, id: String(r.id) }} className="font-medium hover:underline">
                    {r[cfg.title] || r.title_en || r.slug || r.code || `#${r.id}`}
                  </Link>
                </td>
                {cfg.columns.map(([k, h]) => <td key={h} className="p-3" dir="auto">{show(r[k])}</td>)}
                <td className="p-3 text-left">
                  <button className="text-destructive hover:underline"
                    onClick={() => { if (confirm("حذف هذا العنصر نهائيًا؟")) del.mutate(r.id); }}>حذف</button>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && <tr><td className="p-4 text-muted-foreground" colSpan={cfg.columns.length + 2}>لا توجد عناصر</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
