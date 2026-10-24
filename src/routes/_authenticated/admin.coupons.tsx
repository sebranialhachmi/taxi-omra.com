import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Megaphone, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/coupons")({ component: Coupons });

const ICON_OPTIONS = ["sparkles", "tag", "gift", "plane", "percent"];

function Coupons() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [tab, setTab] = useState<"announcements" | "coupons">("announcements");
  const [openA, setOpenA] = useState(false);
  const [openC, setOpenC] = useState(false);

  const [annForm, setAnnForm] = useState<any>({
    title_ar: "", title_en: "", description_ar: "", description_en: "",
    cta_text_ar: "", cta_text_en: "", cta_url: "",
    bg_color: "#0F172A", text_color: "#F5D67B", icon: "sparkles",
    priority: 10, valid_from: "", valid_until: "", target_pages: "", show_once: false, dismissible: true,
  });
  const [couForm, setCouForm] = useState({ code: "", discount_type: "percent", discount_value: "10", max_uses: "", valid_until: "" });

  const q = useQuery({
    queryKey: ["coupons", tab],
    queryFn: async () => (await supabase.from("coupons").select("*").eq("is_announcement", tab === "announcements").order("priority", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const targets = annForm.target_pages.split(",").map((s: string) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("coupons").insert({
        code: `ANN-${Date.now().toString(36).toUpperCase()}`,
        discount_type: "percent",
        discount_value: 0,
        is_announcement: true,
        is_active: true,
        title_ar: annForm.title_ar || null,
        title_en: annForm.title_en || null,
        description_ar: annForm.description_ar || null,
        description_en: annForm.description_en || null,
        cta_text_ar: annForm.cta_text_ar || null,
        cta_text_en: annForm.cta_text_en || null,
        cta_url: annForm.cta_url || null,
        bg_color: annForm.bg_color || null,
        text_color: annForm.text_color || null,
        icon: annForm.icon || null,
        priority: Number(annForm.priority || 0),
        target_pages: targets,
        show_once: !!annForm.show_once,
        dismissible: annForm.dismissible !== false,
        valid_from: annForm.valid_from || null,
        valid_until: annForm.valid_until || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تم إنشاء الإعلان" : "Created"); setOpenA(false); qc.invalidateQueries({ queryKey: ["coupons"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const createCoupon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: couForm.code.toUpperCase(),
        discount_type: couForm.discount_type,
        discount_value: Number(couForm.discount_value),
        max_uses: couForm.max_uses ? Number(couForm.max_uses) : null,
        valid_until: couForm.valid_until || null,
        is_announcement: false,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تم الإنشاء" : "Created"); setOpenC(false); qc.invalidateQueries({ queryKey: ["coupons"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = async (id: string) => {
    if (!confirm(ar ? "حذف؟" : "Delete?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  const annCols: Column<any>[] = [
    { key: "title", header: ar ? "العنوان" : "Title", render: (r) => <div className="font-medium">{ar ? (r.title_ar || r.title_en) : (r.title_en || r.title_ar)}</div> },
    { key: "cta_url", header: "CTA", render: (r) => r.cta_url ? <span className="font-mono text-xs">{r.cta_url}</span> : "—" },
    { key: "target_pages", header: ar ? "الصفحات" : "Pages", render: (r) => (r.target_pages?.length ? r.target_pages.join(", ") : ar ? "الكل" : "All") },
    { key: "priority", header: ar ? "الأولوية" : "Priority" },
    { key: "valid_until", header: ar ? "ينتهي" : "Until", render: (r) => r.valid_until ? new Date(r.valid_until).toLocaleDateString() : "—" },
    { key: "is_active", header: ar ? "الحالة" : "Status", render: (r) => <Switch checked={r.is_active} onCheckedChange={async (v) => { await supabase.from("coupons").update({ is_active: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["coupons"] }); }} /> },
    { key: "actions", header: "", render: (r) => <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button> },
  ];

  const couCols: Column<any>[] = [
    { key: "code", header: ar ? "الرمز" : "Code", render: (r) => <span className="font-mono font-medium">{r.code}</span> },
    { key: "discount_type", header: ar ? "النوع" : "Type" },
    { key: "discount_value", header: ar ? "القيمة" : "Value" },
    { key: "used_count", header: ar ? "الاستخدام" : "Used", render: (r) => `${r.used_count}${r.max_uses ? ` / ${r.max_uses}` : ""}` },
    { key: "valid_until", header: ar ? "ينتهي" : "Until", render: (r) => r.valid_until ? new Date(r.valid_until).toLocaleDateString() : "—" },
    { key: "is_active", header: ar ? "الحالة" : "Status", render: (r) => <Switch checked={r.is_active} onCheckedChange={async (v) => { await supabase.from("coupons").update({ is_active: v }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["coupons"] }); }} /> },
    { key: "actions", header: "", render: (r) => <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button> },
  ];

  return (
    <div>
      <PageHeader title={ar ? "شريط الإعلانات والكوبونات" : "Announcements & Coupons"} description={ar ? "إدارة الشريط العلوي في الموقع والعروض الترويجية" : "Manage the top site banner and promo codes"} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 me-2" />{ar ? "شريط الإعلانات" : "Announcements"}</TabsTrigger>
          <TabsTrigger value="coupons"><Tag className="h-4 w-4 me-2" />{ar ? "الكوبونات" : "Coupons"}</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={openA} onOpenChange={setOpenA}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{ar ? "إعلان جديد" : "New announcement"}</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{ar ? "إعلان جديد" : "New announcement"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
                  <div><Label>العنوان (عربي)</Label><Input dir="rtl" value={annForm.title_ar} onChange={(e) => setAnnForm({ ...annForm, title_ar: e.target.value })} /></div>
                  <div><Label>Title (English)</Label><Input value={annForm.title_en} onChange={(e) => setAnnForm({ ...annForm, title_en: e.target.value })} /></div>
                  <div><Label>الوصف (عربي)</Label><Textarea dir="rtl" rows={2} value={annForm.description_ar} onChange={(e) => setAnnForm({ ...annForm, description_ar: e.target.value })} /></div>
                  <div><Label>Description (English)</Label><Textarea rows={2} value={annForm.description_en} onChange={(e) => setAnnForm({ ...annForm, description_en: e.target.value })} /></div>
                  <div><Label>{ar ? "نص الزر (عربي)" : "CTA (AR)"}</Label><Input dir="rtl" value={annForm.cta_text_ar} onChange={(e) => setAnnForm({ ...annForm, cta_text_ar: e.target.value })} /></div>
                  <div><Label>CTA (English)</Label><Input value={annForm.cta_text_en} onChange={(e) => setAnnForm({ ...annForm, cta_text_en: e.target.value })} /></div>
                  <div className="col-span-2"><Label>{ar ? "رابط الزر" : "CTA URL"}</Label><Input placeholder="/ar/book أو https://..." value={annForm.cta_url} onChange={(e) => setAnnForm({ ...annForm, cta_url: e.target.value })} /></div>
                  <div><Label>{ar ? "لون الخلفية" : "Background"}</Label><Input type="color" value={annForm.bg_color} onChange={(e) => setAnnForm({ ...annForm, bg_color: e.target.value })} /></div>
                  <div><Label>{ar ? "لون النص" : "Text color"}</Label><Input type="color" value={annForm.text_color} onChange={(e) => setAnnForm({ ...annForm, text_color: e.target.value })} /></div>
                  <div><Label>{ar ? "الأيقونة" : "Icon"}</Label>
                    <Select value={annForm.icon} onValueChange={(v) => setAnnForm({ ...annForm, icon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ICON_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{ar ? "الأولوية" : "Priority"}</Label><Input type="number" value={annForm.priority} onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })} /></div>
                  <div><Label>{ar ? "يبدأ" : "Starts"}</Label><Input type="datetime-local" value={annForm.valid_from} onChange={(e) => setAnnForm({ ...annForm, valid_from: e.target.value })} /></div>
                  <div><Label>{ar ? "ينتهي" : "Ends"}</Label><Input type="datetime-local" value={annForm.valid_until} onChange={(e) => setAnnForm({ ...annForm, valid_until: e.target.value })} /></div>
                  <div className="col-span-2"><Label>{ar ? "الصفحات المستهدفة (فارغ = كل الصفحات)" : "Target pages (empty = all)"}</Label>
                    <Input placeholder="/, /services, /airports/*" value={annForm.target_pages} onChange={(e) => setAnnForm({ ...annForm, target_pages: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2"><Switch checked={annForm.show_once} onCheckedChange={(v) => setAnnForm({ ...annForm, show_once: v })} /><span className="text-sm">{ar ? "عرض مرة واحدة لكل زائر" : "Show once per visitor"}</span></label>
                  <label className="flex items-center gap-2"><Switch checked={annForm.dismissible} onCheckedChange={(v) => setAnnForm({ ...annForm, dismissible: v })} /><span className="text-sm">{ar ? "قابل للإغلاق" : "Dismissible"}</span></label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenA(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button disabled={!annForm.title_ar && !annForm.title_en} onClick={() => createAnnouncement.mutate()}>{ar ? "حفظ" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable data={q.data ?? []} columns={annCols} loading={q.isLoading} />
        </TabsContent>

        <TabsContent value="coupons" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={openC} onOpenChange={setOpenC}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{ar ? "كوبون جديد" : "New coupon"}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{ar ? "كوبون جديد" : "New coupon"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>{ar ? "الرمز" : "Code"}</Label><Input value={couForm.code} onChange={(e) => setCouForm({ ...couForm, code: e.target.value })} className="uppercase" /></div>
                  <div><Label>{ar ? "النوع" : "Type"}</Label>
                    <Select value={couForm.discount_type} onValueChange={(v) => setCouForm({ ...couForm, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percent">Percent</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>{ar ? "القيمة" : "Value"}</Label><Input type="number" value={couForm.discount_value} onChange={(e) => setCouForm({ ...couForm, discount_value: e.target.value })} /></div>
                  <div><Label>{ar ? "الحد الأقصى" : "Max uses"}</Label><Input type="number" value={couForm.max_uses} onChange={(e) => setCouForm({ ...couForm, max_uses: e.target.value })} /></div>
                  <div><Label>{ar ? "ينتهي" : "Valid until"}</Label><Input type="date" value={couForm.valid_until} onChange={(e) => setCouForm({ ...couForm, valid_until: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenC(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button disabled={!couForm.code} onClick={() => createCoupon.mutate()}>{ar ? "حفظ" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable data={q.data ?? []} columns={couCols} loading={q.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
