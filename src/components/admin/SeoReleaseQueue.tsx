import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSeoReleaseQueue, saveSeoReview, pauseSeoRelease } from "@/lib/seo-release.functions";
import { EMPTY_CHECKS, RELEASE_CHECKS, reviewComplete, nextReleaseDate, type ReviewChecks } from "@/lib/seo-release-rules";
import { useHasPermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, ClipboardCheck, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

type Item = Awaited<ReturnType<typeof getSeoReleaseQueue>>["items"][number];
const checkLabels = {
  facts: ["حقائق موثقة دون وعود مختلقة", "Verified facts; no invented promises"], prices: ["أسعار مطابقة للموقع", "Prices match the site"],
  unique: ["محتوى فريد يجيب عن حاجة الزائر", "Unique content answering visitor needs"], bilingual: ["مراجعة العربية والإنجليزية", "Both languages reviewed"],
  images: ["صور موجودة وملائمة", "Relevant existing imagery"], links: ["روابط داخلية سليمة وروابط واردة", "Working internal and inbound links"],
  competitors: ["مقارنة منافسين وتوثيق التحسين", "Competitor comparison documented"],
};
export function SeoReleaseQueue({ ar }: { ar: boolean }) {
  const read = useServerFn(getSeoReleaseQueue), save = useServerFn(saveSeoReview), pause = useServerFn(pauseSeoRelease);
  const { allowed } = useHasPermission("seo.approve");
  const q = useQuery({ queryKey: ["seo-release-queue"], queryFn: () => read() });
  const [filter, setFilter] = useState("all"), [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Item | null>(null), [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<ReviewChecks>(EMPTY_CHECKS), [urls, setUrls] = useState("");
  const [advantage, setAdvantage] = useState(""), [notes, setNotes] = useState(""), [priority, setPriority] = useState(100);
  const labels: Record<string,string> = { pending: ar ? "بانتظار التقوية والمراجعة" : "Needs strengthening / review", ready: ar ? "جاهز للبحث" : "Ready", released: ar ? "أتيح للبحث" : "Released", consolidated: ar ? "مكرر: يبقى محوّلًا" : "Consolidated duplicate" };
  const dates = new Map<string,Date>();
  let date = new Date(q.data?.settings.next_release_at ?? Date.now());
  const ready = q.data?.items.filter(i => i.status === "ready").sort((a,b) => a.priority-b.priority || (a.approved_at ?? "").localeCompare(b.approved_at ?? "")) ?? [];
  for (const i of ready) { dates.set(i.id,date); date = nextReleaseDate(date); }
  const fmt = (d: Date) => d.toLocaleString(ar ? "ar-SA-u-ca-gregory" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  const filtered = q.data?.items.filter(i => (filter === "all" || i.status === filter) && `${i.title_ar} ${i.title_en} ${i.slug}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  function open(i: Item) { setSelected(i);setChecks({ ...EMPTY_CHECKS, ...(i.checks as Partial<ReviewChecks>) });setUrls(i.competitor_urls.join("\n"));setAdvantage(i.advantage);setNotes(i.notes);setPriority(i.priority); }
  async function submit(status: "ready" | "pending") {
    if (!selected) return;
    setBusy(true);
    try { await save({ data: { id: selected.id, status, priority, checks, competitor_urls: urls.split("\n").map(s => s.trim()).filter(Boolean), advantage, notes } });await q.refetch();setSelected(null);toast.success(ar ? "تم حفظ المراجعة" : "Review saved"); }
    catch(e) { toast.error(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  return <section className="space-y-4 border-t pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">{ar ? "جدول المحتوى المخفي" : "Hidden content schedule"}</h2>
      <Button variant="outline" disabled={!allowed || busy || !q.data} onClick={async () => { setBusy(true);try { await pause({ data: { paused: !q.data?.settings.paused } });await q.refetch(); } catch(e) { toast.error(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); } }}>{q.data?.settings.paused ? <Play className="size-4" /> : <Pause className="size-4" />}{q.data?.settings.paused ? (ar ? "استئناف الجدول" : "Resume") : (ar ? "إيقاف الجدول" : "Pause")}</Button></div>
    <div className="flex flex-wrap gap-4 text-sm"><span>{ar ? "محتوى واحد كل 3 أيام · بتوقيت السعودية" : "One item every 3 days · Saudi time"}</span><Badge variant="outline">{q.data?.settings.paused ? (ar ? "متوقف" : "Paused") : (ar ? "نشط" : "Active")}</Badge><span>{ar ? "جاهز:" : "Ready:"} {ready.length}</span><span>{ar ? "إجمالي الجدول:" : "Total:"} {q.data?.items.length ?? 0}</span></div>
    <div className="flex flex-wrap gap-2"><Input className="max-w-sm" aria-label={ar ? "بحث في الجدول" : "Search schedule"} placeholder={ar ? "بحث بعنوان أو رابط" : "Title or slug"} value={search} onChange={e => setSearch(e.target.value)} />
    {['all','pending','ready','released','consolidated'].map(s => <Button key={s} size="sm" variant={filter===s ? "default" : "outline"} onClick={() => setFilter(s)}>{s==='all' ? (ar ? "الكل" : "All") : labels[s]}</Button>)}</div>
    {q.isLoading && <p>{ar ? "جارٍ تحميل الجدول…" : "Loading schedule…"}</p>}{q.error && <p role="alert" className="text-destructive">{q.error.message}</p>}
    <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead><tr className="border-b text-muted-foreground">{(ar ? ["المحتوى","النوع","الحالة","الأولوية","موعد متوقع","المراجعة"] : ["Content","Type","Status","Priority","Expected release","Review"]).map(h => <th key={h} className="p-3 text-start">{h}</th>)}</tr></thead><tbody>
      {filtered.map(i => <tr key={i.id} className="border-b"><td className="p-3 min-w-64"><a className="font-medium underline-offset-4 hover:underline" href={`/${ar ? "ar" : "en"}${i.path}`} target="_blank" rel="noreferrer">{ar ? i.title_ar : i.title_en}<ExternalLink className="ms-2 inline size-3" /></a><div className="text-xs text-muted-foreground" dir="ltr">{i.path}</div></td><td className="p-3">{i.entity_type==='blog' ? (ar ? "مقالة" : "Article") : (ar ? "صفحة" : "Page")}</td><td className="p-3"><Badge variant="outline">{labels[i.status]}</Badge></td><td className="p-3">{i.priority}</td><td className="p-3 min-w-44">{i.released_at ? fmt(new Date(i.released_at)) : dates.has(i.id) && !q.data?.settings.paused ? fmt(dates.get(i.id) ?? date) : "—"}</td><td className="p-3"><Button variant="outline" size="sm" disabled={!allowed || i.status==='released' || i.status==='consolidated'} onClick={() => open(i)}><ClipboardCheck className="size-4" />{ar ? "مراجعة" : "Review"}</Button></td></tr>)}
    </tbody></table></div>
    {!q.isLoading && !filtered.length && <p className="text-muted-foreground">{ar ? "لا يوجد محتوى بهذا الاختيار" : "No matching content"}</p>}
    <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl" dir={ar ? "rtl" : "ltr"}><DialogHeader><DialogTitle>{selected && (ar ? selected.title_ar : selected.title_en)}</DialogTitle></DialogHeader>
      <div className="space-y-3">{RELEASE_CHECKS.map(k => <Label key={k} className="flex items-center gap-3"><Checkbox checked={checks[k]} onCheckedChange={v => setChecks(c => ({...c,[k]:v===true}))} />{checkLabels[k][ar ? 0 : 1]}</Label>)}</div>
      <Label htmlFor="review-urls">{ar ? "روابط المنافسين (اثنان على الأقل)" : "Competitor URLs (at least two)"}</Label><Textarea id="review-urls" dir="ltr" value={urls} onChange={e => setUrls(e.target.value)} />
      <Label htmlFor="review-advantage">{ar ? "ما التحسين الموثق مقارنة بالمنافسين؟" : "Documented improvement over competitors"}</Label><Textarea id="review-advantage" value={advantage} onChange={e => setAdvantage(e.target.value)} />
      <Label htmlFor="review-notes">{ar ? "ملاحظات ومصادر الحقائق" : "Notes and fact sources"}</Label><Textarea id="review-notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <Label htmlFor="review-priority">{ar ? "الأولوية (الأصغر أولًا)" : "Priority (lower first)"}</Label><Input id="review-priority" type="number" min={1} max={999} value={priority} onChange={e => setPriority(Number(e.target.value))} />
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => submit("pending")}><Save className="size-4" />{ar ? "حفظ للمراجعة" : "Save draft review"}</Button><Button disabled={busy || !reviewComplete(checks,urls.split('\n').map(s => s.trim()).filter(Boolean),advantage)} onClick={() => submit("ready")}><ClipboardCheck className="size-4" />{ar ? "اعتماد للجدول" : "Approve for schedule"}</Button></div>
    </DialogContent></Dialog>
  </section>;
}