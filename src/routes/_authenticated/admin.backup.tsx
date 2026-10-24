import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { exportAllData, importAllData } from "@/lib/ops.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, Database, ShieldCheck, HardDrive, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/backup")({ component: BackupPage });

function BackupPage() {
  const expFn = useServerFn(exportAllData);
  const impFn = useServerFn(importAllData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const exp = useMutation({
    mutationFn: () => expFn(),
    onSuccess: (res: any) => {
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `omra-taxi-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل النسخة الاحتياطية");
    },
    onError: (e: any) => toast.error(e?.message ?? "فشل التصدير"),
  });

  const imp = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      return impFn({ data: { json: text, mode: "upsert" } });
    },
    onSuccess: (res: any) => {
      const total = (res.report ?? []).reduce((s: number, r: any) => s + (r.inserted ?? 0), 0);
      const errs = (res.report ?? []).filter((r: any) => r.error);
      toast.success(`تمت الاستعادة: ${total} صف`);
      if (errs.length) toast.warning(`${errs.length} جدول به أخطاء — راجع السجلات`);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: any) => toast.error(e?.message ?? "فشل الاستيراد"),
  });

  return (
    <div dir="rtl">
      <PageHeader title="النسخ الاحتياطي والاستعادة" description="تصدير كامل لبيانات الموقع وإمكانية استعادتها من ملف نسخة سابقة." />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-5">
          <Database className="h-6 w-6 text-emerald-600 mb-3" />
          <h3 className="font-semibold">قاعدة البيانات</h3>
          <p className="text-sm text-muted-foreground mt-1">نسخ احتياطي يومي تلقائي مُدار من Lovable Cloud مع استعادة إلى نقطة زمنية عند الطلب.</p>
        </Card>
        <Card className="p-5">
          <HardDrive className="h-6 w-6 text-emerald-600 mb-3" />
          <h3 className="font-semibold">تخزين الملفات</h3>
          <p className="text-sm text-muted-foreground mt-1">جميع المستندات والوسائط محفوظة في حاويات مشفّرة مع نسخ متعددة.</p>
        </Card>
        <Card className="p-5">
          <ShieldCheck className="h-6 w-6 text-emerald-600 mb-3" />
          <h3 className="font-semibold">التحكم بالوصول</h3>
          <p className="text-sm text-muted-foreground mt-1">أمان مستوى الصفوف (RLS) يضمن أن كل قراءة وكتابة محصورة بالأدوار المخوّلة.</p>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <h3 className="font-semibold text-lg">تنزيل نسخة كاملة من الموقع</h3>
            <p className="text-sm text-muted-foreground mt-1">
              يتضمّن الحجوزات، العملاء، السائقين، الأسطول، الفواتير، المدفوعات، المصاريف، المحتوى (CMS)، المدوّنة، الأسئلة الشائعة، الإعدادات وقوالب واتساب — حتى 50,000 صف لكل جدول.
            </p>
          </div>
          <Button onClick={() => exp.mutate()} disabled={exp.isPending} size="lg" className="gap-2">
            {exp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exp.isPending ? "جارٍ التحضير…" : "تنزيل النسخة (JSON)"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-amber-300/60">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">رفع واستعادة نسخة احتياطية</h3>
            <p className="text-sm text-muted-foreground mt-1">
              اختر ملف <code>.json</code> تم تصديره من هذا النظام. ستتم إعادة إدخال الصفوف عبر Upsert بناءً على المفتاح الأساسي — الصفوف الحالية بنفس الـID ستُحدَّث. يُفضّل تنزيل نسخة حالية أولاً قبل الاستعادة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="max-w-sm"
          />
          <Button
            onClick={() => selectedFile && imp.mutate(selectedFile)}
            disabled={!selectedFile || imp.isPending}
            variant="default"
            size="lg"
            className="gap-2"
          >
            {imp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {imp.isPending ? "جارٍ الاستعادة…" : "رفع واستعادة"}
          </Button>
        </div>

        {imp.data && (
          <div className="mt-6 border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-2">الجدول</th>
                  <th className="text-right p-2">الصفوف</th>
                  <th className="text-right p-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(imp.data as any).report.map((r: any) => (
                  <tr key={r.table} className="border-t">
                    <td className="p-2 font-mono text-xs">{r.table}</td>
                    <td className="p-2">{r.inserted}</td>
                    <td className="p-2">{r.error ? <span className="text-red-600">{r.error}</span> : <span className="text-emerald-600">تم</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
