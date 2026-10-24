import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminChangePassword, adminGetSettings, adminSaveSettings } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

const FIELDS: Array<[string, string, boolean?]> = [
  ["contact_phone", "رقم الهاتف المعروض (مثل +966551796487)"],
  ["whatsapp_number", "رقم واتساب بدون + (مثل 966551796487)"],
  ["whatsapp_default_message", "رسالة واتساب الافتراضية"],
  ["google_site_verification", "رمز التحقق من Google Search Console"],
  ["bing_site_verification", "رمز التحقق من Bing"],
  ["head_meta_custom", "وسوم meta إضافية (HTML)", true],
  ["head_scripts_custom", "أكواد التتبع/Analytics (HTML)", true],
];

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "settings"], queryFn: () => adminGetSettings() });
  const [form, setForm] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ current: "", next: "" });
  useEffect(() => {
    if (data) setForm(Object.fromEntries(FIELDS.map(([k]) => [k, typeof data[k] === "string" ? data[k] : ""])));
  }, [data]);

  const save = async () => {
    try {
      await adminSaveSettings({ data: form });
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    } catch (e: any) { toast.error(e?.message ?? "تعذر الحفظ"); }
  };
  const changePw = async () => {
    try {
      await adminChangePassword({ data: pw });
      toast.success("تم تغيير كلمة المرور");
      setPw({ current: "", next: "" });
    } catch (e: any) { toast.error(e?.message?.includes("wrong") ? "كلمة المرور الحالية غير صحيحة" : "تعذر التغيير (10 أحرف على الأقل)"); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-4 rounded-xl border bg-background p-4 md:p-6">
        <h1 className="text-2xl font-semibold">الإعدادات</h1>
        {FIELDS.map(([k, label, big]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{label}</Label>
            {big
              ? <Textarea id={k} dir="ltr" className="min-h-[100px] font-mono text-xs" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              : <Input id={k} dir="auto" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />}
          </div>
        ))}
        <Button onClick={save}>حفظ الإعدادات</Button>
      </section>
      <section className="space-y-4 rounded-xl border bg-background p-4 md:p-6">
        <h2 className="text-xl font-semibold">تغيير كلمة المرور</h2>
        <div className="space-y-1.5"><Label>كلمة المرور الحالية</Label><Input type="password" dir="ltr" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>كلمة المرور الجديدة (10 أحرف على الأقل)</Label><Input type="password" dir="ltr" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        <Button variant="outline" onClick={changePw}>تغيير</Button>
      </section>
    </div>
  );
}
