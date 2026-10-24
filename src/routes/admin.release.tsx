import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminReleaseRunNow, adminReleaseSaveSettings, adminReleaseStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/release")({ component: ReleasePage });

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" }) : "—");

function ReleasePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "release"], queryFn: () => adminReleaseStatus() });
  const [enabled, setEnabled] = useState(true);
  const [everyDays, setEveryDays] = useState("3");
  const [batch, setBatch] = useState("2");
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState<Awaited<ReturnType<typeof adminReleaseRunNow>> | null>(null);
  useEffect(() => {
    if (!data) return;
    setEnabled(data.settings.enabled);
    setEveryDays(String(data.settings.everyDays));
    setBatch(String(data.settings.batch));
  }, [data]);

  if (!data) return <p>جارٍ التحميل…</p>;
  const auto = data.queue.filter((q) => !q.manual);
  const manual = data.queue.filter((q) => q.manual);

  const save = async () => {
    try {
      await adminReleaseSaveSettings({ data: { enabled, everyDays: Number(everyDays), batch: Number(batch) } });
      toast.success("تم حفظ إعدادات النشر");
      qc.invalidateQueries({ queryKey: ["admin", "release"] });
    } catch (e: any) { toast.error(e?.message ?? "تعذر الحفظ"); }
  };
  const runNow = async () => {
    if (!confirm("نشر الدفعة التالية الآن؟")) return;
    setBusy(true);
    try {
      const r = await adminReleaseRunNow();
      setLastRun(r);
      toast.success(r.released.length ? `تم نشر ${r.released.length}` : "لا يوجد ما هو جاهز للنشر");
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e?.message ?? "تعذر التنفيذ"); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">جدول النشر والفهرسة</h1>
      <p className="text-sm text-muted-foreground">
        الصفحات والمقالات المخفية عن جوجل تُفتح تباعًا حسب الأولوية بعد التأكد أنها جاهزة (عنوان ووصف وطول المحتوى). عند النشر تدخل الصفحة خريطة الموقع
        فيكتشفها جوجل، ويُبلَّغ Bing وYandex فورًا عبر IndexNow. الصفحة الرئيسية وتاكسي جدة وتاكسي مطار جدة مفتوحة منذ البداية.
      </p>

      <section className="space-y-4 rounded-xl border bg-background p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2"><Switch checked={enabled} onCheckedChange={setEnabled} /> النشر التلقائي {enabled ? "مفعّل" : "متوقف"}</label>
          <label className="flex items-center gap-2 text-sm">كل <Input className="w-20" type="number" min={1} max={30} dir="ltr" value={everyDays} onChange={(e) => setEveryDays(e.target.value)} /> يوم</label>
          <label className="flex items-center gap-2 text-sm">ينشر <Input className="w-20" type="number" min={1} max={10} dir="ltr" value={batch} onChange={(e) => setBatch(e.target.value)} /> عنصر</label>
          <Button onClick={save}>حفظ</Button>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">آخر نشر</div><div className="font-medium">{fmt(data.settings.lastAt)}</div></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">النشر القادم</div><div className="font-medium">{enabled ? (data.settings.nextAt ? fmt(data.settings.nextAt) : "عند أول فحص") : "متوقف"}</div></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">منشور لجوجل</div><div className="font-medium">{data.releasedCount.pages} صفحة · {data.releasedCount.posts} مقال</div></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">في الانتظار</div><div className="font-medium">{auto.length} تلقائي · {manual.length} يدوي</div></div>
        </div>
        <Button variant="outline" onClick={runNow} disabled={busy}>نشر الدفعة التالية الآن</Button>
        {lastRun && (
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            {lastRun.released.length > 0 ? (
              <>
                <div className="mb-1 font-medium">تم نشر هذه الروابط. الصقيها في «فحص عنوان URL» في Search Console واضغطي «طلب الفهرسة» لتسريع جوجل:</div>
                <ul className="list-inside list-disc" dir="ltr">{lastRun.released.flatMap((r) => r.urls).map((u) => <li key={u}>{u}</li>)}</ul>
              </>
            ) : <div>لا شيء للنشر ({lastRun.reason}).</div>}
            {lastRun.skipped.length > 0 && <div className="mt-2 text-muted-foreground">تخطّى لأنها غير جاهزة: {lastRun.skipped.map((s) => s.slug).join("، ")}</div>}
          </div>
        )}
      </section>

      <section className="overflow-x-auto rounded-xl border bg-background">
        <h2 className="p-4 font-semibold">طابور النشر التلقائي ({auto.length})</h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right"><tr><th className="p-3">الترتيب</th><th className="p-3">النوع</th><th className="p-3">العنوان</th><th className="p-3">الأولوية</th><th className="p-3">الجاهزية</th></tr></thead>
          <tbody>
            {auto.map((q, i) => (
              <tr key={`${q.table}-${q.id}`} className="border-t align-top">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{q.table === "posts" ? "مقال" : "صفحة"}</td>
                <td className="p-3"><Link to="/admin/c/$table/$id" params={{ table: q.table, id: String(q.id) }} className="hover:underline">{q.title}</Link></td>
                <td className="p-3" dir="ltr">{q.priority}</td>
                <td className="p-3">{q.ready ? <span className="text-green-700">جاهز ✓</span> : <span className="text-amber-700">⚠ {q.problems.slice(0, 3).join(" · ")}</span>}</td>
              </tr>
            ))}
            {auto.length === 0 && <tr><td className="p-4 text-muted-foreground" colSpan={5}>لا شيء في الطابور.</td></tr>}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-muted-foreground">
        {manual.length} صفحة تحمل أولوية 900 فأكثر ولا تُنشر تلقائيًا (صفحات مسارات قالبية). افتحيها يدويًا من «الصفحات» بعد إضافة معلومات حقيقية فيها.
      </p>
    </div>
  );
}
