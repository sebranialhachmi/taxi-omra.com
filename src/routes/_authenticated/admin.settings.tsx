import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

// Keys rendered with a big textarea; everything else uses <Input>.
const MULTILINE_KEYS = new Set([
  "head_meta_custom",
  "head_scripts_custom",
  "whatsapp_default_message",
]);

// Human-readable labels & help. Falls back to raw key + description from DB.
const KEY_META: Record<string, { title: { ar: string; en: string }; help?: { ar: string; en: string } }> = {
  google_site_verification: {
    title: { ar: "Google Search Console — كود التحقق", en: "Google Search Console verification" },
    help: {
      ar: "الصق فقط قيمة content من وسم <meta name=\"google-site-verification\">.",
      en: "Paste only the content value from the <meta name=\"google-site-verification\"> tag.",
    },
  },
  bing_site_verification: {
    title: { ar: "Bing Webmaster — كود التحقق", en: "Bing Webmaster verification" },
    help: { ar: "قيمة content من وسم msvalidate.01.", en: "The content value of the msvalidate.01 meta tag." },
  },
  head_meta_custom: {
    title: { ar: "وسوم Meta مخصصة في <head>", en: "Custom <head> meta tags" },
    help: {
      ar: "الصق HTML خام (وسوم <meta> أو <link>). يتم حقنها في رأس كل صفحة.",
      en: "Raw HTML (<meta> / <link> tags). Injected into <head> on every page.",
    },
  },
  head_scripts_custom: {
    title: { ar: "سكربتات تتبع (Analytics, Pixel, GTM)", en: "Custom head scripts (Analytics, Pixel, GTM)" },
    help: {
      ar: "الصق أكواد <script>…</script> كاملة. تُنفّذ على جميع الصفحات.",
      en: "Full <script>…</script> tags. Executed on every page.",
    },
  },
  contact_phone: {
    title: { ar: "رقم الاتصال (يشمل +)", en: "Phone number (include +)" },
    help: { ar: "الرقم الظاهر في الرأس والتذييل وزر «اتصل الآن». مثال: +966551796487", en: "Shown in header, footer and the Call button. E.g. +966551796487" },
  },
  whatsapp_number: {
    title: { ar: "رقم واتساب (بدون +)", en: "WhatsApp number (no +)" },
    help: { ar: "أرقام فقط. يُستخدم في الزر العائم وروابط واتساب في كل الموقع. مثال: 966551796487", en: "Digits only. Used by the floating button and all WhatsApp links site-wide. E.g. 966551796487" },
  },
  whatsapp_default_message: {
    title: { ar: "رسالة واتساب الافتراضية", en: "Default WhatsApp message" },
    help: { ar: "الرسالة التي تظهر جاهزة للإرسال عند الضغط على زر واتساب.", en: "Pre-filled message when a visitor taps the WhatsApp button." },
  },
};

// Grouping for the settings screen so it's not a flat wall of keys.
const GROUPS: { titleAr: string; titleEn: string; matches: (key: string) => boolean }[] = [
  { titleAr: "أدوات المشرف على الرأس (SEO / Analytics)", titleEn: "Head tools (SEO / Analytics)", matches: (k) => ["google_site_verification", "bing_site_verification", "head_meta_custom", "head_scripts_custom"].includes(k) },
  { titleAr: "الاتصال وواتساب", titleEn: "Contact & WhatsApp", matches: (k) => k === "contact_phone" || k.startsWith("whatsapp_") },
  { titleAr: "إعدادات أخرى", titleEn: "Other settings", matches: () => true }, // catch-all
];

function Settings() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("settings").select("*").order("key")).data ?? [],
  });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (q.data) {
      const v: Record<string, string> = {};
      q.data.forEach((s: any) => {
        v[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      });
      setValues(v);
    }
  }, [q.data]);

  const save = async (key: string) => {
    let value: any = values[key];
    try { value = JSON.parse(values[key]); } catch { /* keep raw string */ }
    const { error } = await supabase.from("settings").update({ value }).eq("key", key);
    if (error) toast.error(error.message);
    else { toast.success(ar ? "تم الحفظ" : "Saved"); qc.invalidateQueries({ queryKey: ["settings"] }); }
  };

  const rows = q.data ?? [];
  const assigned = new Set<string>();
  const grouped = GROUPS.map((g) => {
    const items = rows.filter((r: any) => !assigned.has(r.key) && g.matches(r.key));
    items.forEach((r: any) => assigned.add(r.key));
    return { ...g, items };
  }).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings")}
        description={ar ? "إعدادات النظام العامة — Google Search Console وسكربتات التتبع وواتساب وأكثر." : "System-wide settings — Google Search Console, tracking scripts, WhatsApp and more."}
      />

      {grouped.map((g) => (
        <Card key={g.titleEn}>
          <CardHeader>
            <CardTitle>{ar ? g.titleAr : g.titleEn}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {g.items.map((s: any) => {
              const meta = KEY_META[s.key];
              const title = meta ? (ar ? meta.title.ar : meta.title.en) : s.key;
              const help = meta?.help ? (ar ? meta.help.ar : meta.help.en) : (s.description ?? undefined);
              const isMulti = MULTILINE_KEYS.has(s.key);
              return (
                <div key={s.key} className="border-b pb-4 last:border-0 last:pb-0 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <Label className="text-sm font-medium">{title}</Label>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{s.key}</div>
                    </div>
                    <Button size="sm" onClick={() => save(s.key)}>{t("save")}</Button>
                  </div>
                  {help && <div className="text-xs text-muted-foreground">{help}</div>}
                  {isMulti ? (
                    <Textarea
                      rows={s.key === "head_scripts_custom" ? 10 : 6}
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      className="font-mono text-xs"
                      dir="ltr"
                    />
                  ) : (
                    <Input
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      dir={s.key.includes("message") ? undefined : "ltr"}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {rows.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t("no_data")}</CardContent></Card>
      )}
    </div>
  );
}
