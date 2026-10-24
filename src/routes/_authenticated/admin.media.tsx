import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Copy, Trash2, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/media")({ component: MediaAdmin });

function MediaAdmin() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["media-lib"],
    queryFn: async () => (await supabase.from("media_library").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const upload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();
        const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
        const up = await supabase.storage.from("media-library").upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw up.error;
        const { error } = await supabase.from("media_library").insert({
          path, filename: file.name, content_type: file.type, size_bytes: file.size,
        });
        if (error) throw error;
      }
      toast.success(ar ? "تم الرفع" : "Uploaded");
      qc.invalidateQueries({ queryKey: ["media-lib"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const del = async (row: any) => {
    if (!confirm(ar ? "حذف الملف؟" : "Delete file?")) return;
    await supabase.storage.from("media-library").remove([row.path]);
    await supabase.from("media_library").delete().eq("id", row.id);
    qc.invalidateQueries({ queryKey: ["media-lib"] });
  };

  const getUrl = async (path: string) => {
    const { data } = await supabase.storage.from("media-library").createSignedUrl(path, 60 * 60 * 24 * 7);
    if (data?.signedUrl) {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success(ar ? "تم نسخ الرابط (صالح 7 أيام)" : "URL copied (7d signed)");
    }
  };

  const filtered = (q.data ?? []).filter((r: any) =>
    !search || r.filename.toLowerCase().includes(search.toLowerCase()) || r.alt_text?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <PageHeader title={ar ? "مكتبة الوسائط" : "Media Library"} description={ar ? "مكتبة مركزية للصور والمستندات المستخدمة في إدارة المحتوى." : "Central library for images and documents used across the CMS."} />
        <div className="flex gap-2">
          <Input placeholder={ar ? "بحث…" : "Search…"} value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} accept="image/*,application/pdf" />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4 me-2" />{uploading ? (ar ? "جاري الرفع…" : "Uploading…") : (ar ? "رفع" : "Upload")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((r: any) => (
          <Card key={r.id} className="overflow-hidden group">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted grid place-items-center">
                {r.content_type?.startsWith("image/") ? (
                  <MediaImage path={r.path} alt={r.alt_text ?? r.filename} />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-2">
                <div className="text-xs truncate font-medium">{r.filename}</div>
                <div className="text-[10px] text-muted-foreground">{Math.round((r.size_bytes ?? 0) / 1024)} KB</div>
                <Input defaultValue={r.alt_text ?? ""} placeholder={ar ? "نص بديل" : "Alt text"} className="mt-1.5 h-7 text-xs"
                  onBlur={async (e) => { await supabase.from("media_library").update({ alt_text: e.target.value }).eq("id", r.id); }}
                />
                <div className="flex gap-1 mt-1.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => getUrl(r.path)} title={ar ? "نسخ الرابط" : "Copy URL"}><Copy className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(r)} title={ar ? "حذف" : "Delete"}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && !q.isLoading && (
          <div className="col-span-full text-center py-16 text-muted-foreground">{ar ? "لا توجد وسائط بعد." : "No media yet."}</div>
        )}
      </div>
    </div>
  );
}

function MediaImage({ path, alt }: { path: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase.storage.from("media-library").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [path]);
  return url ? <img src={url} alt={alt} className="object-cover w-full h-full" loading="lazy" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />;
}
