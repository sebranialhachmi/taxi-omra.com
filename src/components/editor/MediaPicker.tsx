import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Search } from "lucide-react";
import { publicMediaUrl } from "@/lib/media";
import { useI18n } from "@/lib/i18n";

export type PickedMedia = { url: string; altEn: string; altAr: string; caption: string; width?: number | null; height?: number | null };

/**
 * Media Library picker: reuse an existing image or upload a new one,
 * always with bilingual alt text + optional caption.
 */
export function MediaPicker({ open, onOpenChange, onPick }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (m: PickedMedia) => void;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [altEn, setAltEn] = useState("");
  const [altAr, setAltAr] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const q = useQuery({
    queryKey: ["media-lib"],
    queryFn: async () => (await supabase.from("media_library").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
    enabled: open,
  });

  const pickRow = (row: any) => {
    setSelected(row);
    setAltEn(row.alt_text ?? "");
    setAltAr(row.alt_text_ar ?? "");
    setCaption(row.caption ?? "");
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();
      // Deduplicate: reuse an existing library entry with the same name + size.
      const existing = (q.data ?? []).find((r: any) => r.filename === file.name && r.size_bytes === file.size);
      if (existing) { pickRow(existing); toast.info(ar ? "الصورة موجودة مسبقاً — تم اختيارها" : "Image already in library — selected"); return; }

      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
      const up = await supabase.storage.from("media-library").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const dims = await imageSize(file).catch(() => null);
      const { data, error } = await supabase.from("media_library").insert({
        path, filename: file.name, content_type: file.type, size_bytes: file.size,
        width: dims?.w ?? null, height: dims?.h ?? null,
      }).select().single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["media-lib"] });
      pickRow(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const confirm = async () => {
    if (!selected) return;
    await supabase.from("media_library").update({ alt_text: altEn || null, alt_text_ar: altAr || null, caption: caption || null } as any).eq("id", selected.id);
    qc.invalidateQueries({ queryKey: ["media-lib"] });
    onPick({ url: publicMediaUrl(selected.path), altEn, altAr, caption, width: selected.width, height: selected.height });
    onOpenChange(false);
    setSelected(null);
  };

  const rows = (q.data ?? []).filter((r: any) =>
    !search || r.filename?.toLowerCase().includes(search.toLowerCase()) || r.alt_text?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{ar ? "مكتبة الوسائط" : "Media Library"}</DialogTitle></DialogHeader>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="ps-8" placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 me-2" />{uploading ? (ar ? "جارٍ الرفع..." : "Uploading...") : (ar ? "رفع صورة" : "Upload")}
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto py-1">
          {rows.map((r: any) => (
            <button key={r.id} type="button" onClick={() => pickRow(r)}
              className={`aspect-square overflow-hidden rounded-lg border-2 bg-muted ${selected?.id === r.id ? "border-primary" : "border-transparent"}`}>
              <img src={publicMediaUrl(r.path)} alt={r.alt_text ?? r.filename} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
          {rows.length === 0 && <p className="col-span-full text-sm text-muted-foreground py-6 text-center">{ar ? "لا توجد صور" : "No images yet"}</p>}
        </div>

        {selected && (
          <div className="space-y-3 border-t pt-4">
            <div className="text-xs text-muted-foreground break-all">{selected.filename}</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-sm">Alt Text (EN)</label><Input value={altEn} onChange={(e) => setAltEn(e.target.value)} placeholder="Private taxi from Jeddah Airport to Makkah" /></div>
              <div><label className="text-sm">Alt Text (AR)</label><Input dir="rtl" value={altAr} onChange={(e) => setAltAr(e.target.value)} placeholder="تاكسي خاص من مطار جدة إلى مكة المكرمة" /></div>
            </div>
            <div><label className="text-sm">{ar ? "تعليق (اختياري)" : "Caption (optional)"}</label><Input value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
            {!altEn && !altAr && <p className="text-xs text-amber-600">{ar ? "تحذير: النص البديل مفقود (مهم للـ SEO)." : "Warning: alt text is missing (important for SEO)."}</p>}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button type="button" disabled={!selected} onClick={() => void confirm()}>{ar ? "إدراج" : "Insert"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function imageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = reject;
    img.src = url;
  });
}
