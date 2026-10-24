import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/menus")({ component: MenusAdmin });

function MenusAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [activeMenu, setActiveMenu] = useState<string>("header");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const menusQ = useQuery({
    queryKey: ["admin-menus"],
    queryFn: async () => (await supabase.from("menus").select("*").order("location")).data ?? [],
  });

  const current = (menusQ.data ?? []).find((m: any) => m.location === activeMenu);

  const itemsQ = useQuery({
    enabled: !!current?.id,
    queryKey: ["admin-menu-items", current?.id],
    queryFn: async () => (await supabase.from("menu_items").select("*").eq("menu_id", current!.id).order("sort_order")).data ?? [],
  });

  const save = async (fd: FormData) => {
    if (!current) return;
    const payload: any = {
      menu_id: current.id,
      label_en: fd.get("label_en"),
      label_ar: fd.get("label_ar"),
      url: fd.get("url"),
      target: fd.get("target") || "_self",
      icon: fd.get("icon") || null,
      sort_order: Number(fd.get("sort_order") || 0),
      is_active: fd.get("is_active") === "on",
    };
    const res = editing
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(ar ? "تم الحفظ" : "Saved"); setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };

  const del = async (id: string) => {
    if (!confirm(ar ? "حذف العنصر؟" : "Delete item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };

  const reorder = async (id: string, dir: -1 | 1) => {
    const rows = itemsQ.data ?? [];
    const i = rows.findIndex((r: any) => r.id === id);
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j];
    await supabase.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id);
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };



  return (
    <div>
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <PageHeader title={locale === "ar" ? "القوائم" : "Menus"} description={locale === "ar" ? "قوائم التنقل في الموقع العام" : "Navigation menus for the public site."} />
        <div className="flex gap-2 items-center">
          <Select value={activeMenu} onValueChange={setActiveMenu}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(menusQ.data ?? []).map((m: any) => <SelectItem key={m.id} value={m.location}>{m.name} ({m.location})</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button disabled={!current}><Plus className="h-4 w-4 me-2" />{ar ? "إضافة عنصر" : "Add item"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? (ar ? "تعديل عنصر القائمة" : "Edit menu item") : (ar ? "إضافة عنصر قائمة" : "Add menu item")}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm">{ar ? "التسمية (إنجليزي) *" : "Label (EN) *"}</label><Input name="label_en" defaultValue={editing?.label_en} required /></div>
                  <div><label className="text-sm">{ar ? "التسمية (عربي) *" : "Label (AR) *"}</label><Input name="label_ar" defaultValue={editing?.label_ar} dir="rtl" required /></div>
                </div>
                <div><label className="text-sm">{ar ? "الرابط *" : "URL *"}</label><Input name="url" defaultValue={editing?.url} required placeholder="/services or https://..." /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-sm">{ar ? "الهدف" : "Target"}</label>
                    <Select name="target" defaultValue={editing?.target ?? "_self"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_self">{ar ? "نفس التبويب" : "Same tab"}</SelectItem>
                        <SelectItem value="_blank">{ar ? "تبويب جديد" : "New tab"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm">{ar ? "الأيقونة" : "Icon"}</label><Input name="icon" defaultValue={editing?.icon} placeholder={ar ? "اسم من lucide" : "lucide name"} /></div>
                  <div><label className="text-sm">{ar ? "الترتيب" : "Sort order"}</label><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> {ar ? "مُفعّل" : "Active"}</label>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                  <Button type="submit">{ar ? "حفظ" : "Save"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4">
        {!current && <div className="text-muted-foreground text-sm">{ar ? "اختر قائمة." : "Select a menu."}</div>}
        {current && (itemsQ.data ?? []).length === 0 && <div className="text-muted-foreground text-sm py-6 text-center">{ar ? "لا توجد عناصر بعد." : "No items yet."}</div>}
        <div className="space-y-2">
          {(itemsQ.data ?? []).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted/40">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder(item.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder(item.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <div className="flex-1">
                <div className="font-medium">{locale === "ar" ? item.label_ar : item.label_en}</div>
                <div className="text-xs text-muted-foreground">{item.url} · target: {item.target}</div>
              </div>
              <Switch checked={item.is_active} onCheckedChange={async (v) => { await supabase.from("menu_items").update({ is_active: v }).eq("id", item.id); qc.invalidateQueries({ queryKey: ["admin-menu-items"] }); }} />
              <Button size="icon" variant="ghost" onClick={() => { setEditing(item); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
