import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/homepage")({ component: HomepageAdmin });

function HomepageAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => (await supabase.from("homepage_sections").select("*").order("sort_order")).data ?? [],
  });

  const saveSection = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("homepage_sections").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(ar ? "تم الحفظ" : "Saved");
    qc.invalidateQueries({ queryKey: ["homepage-sections"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={ar ? "أقسام الصفحة الرئيسية" : "Homepage Sections"} description={ar ? "تفعيل وترتيب وتسمية الأقسام الظاهرة في الصفحة الرئيسية" : "Toggle, reorder, and label the sections that appear on the public homepage."} />
      <div className="grid gap-3">
        {(q.data ?? []).map((s: any) => (
          <Card key={s.id} className="rounded-2xl">
            <CardContent className="p-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  void saveSection(s.id, {
                    title_en: fd.get("title_en"),
                    title_ar: fd.get("title_ar"),
                    subtitle_en: fd.get("subtitle_en") || null,
                    subtitle_ar: fd.get("subtitle_ar") || null,
                    sort_order: Number(fd.get("sort_order") || 0),
                    enabled: fd.get("enabled") === "on",
                  });
                }}
                className="grid gap-3 md:grid-cols-6 items-end"
              >
                <div className="md:col-span-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "المفتاح" : "Key"}</div>
                  <div className="font-mono text-sm mt-1">{s.section_key}</div>
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs">{ar ? "العنوان (إنجليزي)" : "Title (EN)"}</label>
                  <Input name="title_en" defaultValue={s.title_en ?? ""} />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs">{ar ? "العنوان (عربي)" : "Title (AR)"}</label>
                  <Input name="title_ar" defaultValue={s.title_ar ?? ""} dir="rtl" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs">{ar ? "العنوان الفرعي (إنجليزي)" : "Subtitle (EN)"}</label>
                  <Input name="subtitle_en" defaultValue={s.subtitle_en ?? ""} />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs">{ar ? "الترتيب" : "Order"}</label>
                  <Input name="sort_order" type="number" defaultValue={s.sort_order} />
                </div>
                <div className="md:col-span-1 flex items-center gap-3 justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      name="enabled"
                      defaultChecked={s.enabled}
                      onCheckedChange={(v) => saveSection(s.id, { enabled: v })}
                    />
                    <span className="text-xs">{s.enabled ? (ar ? "مفعّل" : "On") : (ar ? "معطّل" : "Off")}</span>
                  </label>
                  <Button type="submit" size="icon" variant="ghost" title={ar ? "حفظ" : "Save"}><Save className="h-4 w-4" /></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
