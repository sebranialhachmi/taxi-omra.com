import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminGet, adminSave, EDITABLE_TABLES, type EditableTable } from "@/lib/admin.functions";
import { TABLE_CONFIG } from "@/lib/admin-fields";
import { FieldInput, fromForm, toForm, type FormState } from "@/components/admin/FieldInput";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/c/$table/$id")({
  beforeLoad: ({ params }) => {
    if (!(EDITABLE_TABLES as readonly string[]).includes(params.table)) throw notFound();
  },
  component: EditPage,
});

function EditPage() {
  const { table: t, id: rawId } = Route.useParams();
  const table = t as EditableTable;
  const cfg = TABLE_CONFIG[table];
  const isNew = rawId === "new";
  const id = isNew ? undefined : Number(rawId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: row, isLoading } = useQuery({
    queryKey: ["admin", "row", table, rawId],
    queryFn: () => adminGet({ data: { table, id: id! } }),
    enabled: !isNew,
  });
  const [form, setForm] = useState<FormState | null>(isNew ? toForm(cfg, null) : null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (row) setForm(toForm(cfg, row)); }, [row, cfg]);

  if (isLoading || !form) return <p>جارٍ التحميل…</p>;
  if (!isNew && !row) return <p>العنصر غير موجود</p>;

  const basic = cfg.fields.filter((f) => !f.advanced);
  const advanced = cfg.fields.filter((f) => f.advanced);

  const save = async () => {
    setSaving(true);
    try {
      const values = fromForm(cfg, form);
      await adminSave({ data: { table, id, values } });
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/c/$table", params: { table } });
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string) => (v: any) => setForm((f) => ({ ...(f as FormState), [k]: v }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{isNew ? "جديد" : "تعديل"} — {cfg.label}</h1>
        <Link to="/admin/c/$table" params={{ table }} className="text-sm underline">رجوع للقائمة</Link>
      </div>
      <div className="space-y-5 rounded-xl border bg-background p-4 md:p-6">
        {basic.map((f) => <FieldInput key={f.key} field={f} value={form[f.key]} onChange={set(f.key)} />)}
      </div>
      {advanced.length > 0 && (
        <details className="rounded-xl border bg-background p-4 md:p-6">
          <summary className="cursor-pointer font-medium">إعدادات متقدمة وSEO</summary>
          <div className="mt-4 space-y-5">
            {advanced.map((f) => <FieldInput key={f.key} field={f} value={form[f.key]} onChange={set(f.key)} />)}
          </div>
        </details>
      )}
      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 p-3 backdrop-blur md:-mx-6">
        <Button onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</Button>
        <Button variant="outline" asChild><Link to="/admin/c/$table" params={{ table }}>إلغاء</Link></Button>
      </div>
    </div>
  );
}
