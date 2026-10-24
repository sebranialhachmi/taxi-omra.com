import { lazy, Suspense, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Field, TableConfig } from "@/lib/admin-fields";

const RichTextEditor = lazy(() =>
  import("@/components/editor/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
);

export type FormState = Record<string, any>;

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** DB row -> strings/booleans the inputs can edit. */
export function toForm(cfg: TableConfig, row: Record<string, any> | null): FormState {
  const src = row ?? cfg.defaults ?? {};
  const out: FormState = {};
  for (const f of cfg.fields) {
    const v = src[f.key];
    switch (f.type) {
      case "bool": out[f.key] = Boolean(v); break;
      case "tags": out[f.key] = Array.isArray(v) ? v.join(", ") : ""; break;
      case "json": out[f.key] = v == null ? "" : JSON.stringify(v, null, 2); break;
      case "datetime": out[f.key] = toLocalInput(v ?? null); break;
      case "number": out[f.key] = v == null ? "" : String(v); break;
      case "select": out[f.key] = v == null ? (f.options?.[0] ?? "") : String(v); break;
      default: out[f.key] = v ?? "";
    }
  }
  return out;
}

/** Form strings -> values for the server. Throws a readable error for bad JSON. */
export function fromForm(cfg: TableConfig, form: FormState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const v = form[f.key];
    switch (f.type) {
      case "tags": out[f.key] = String(v).split(/[\n,]+/).map((s) => s.trim()).filter(Boolean); break;
      case "json":
        if (!String(v).trim()) out[f.key] = null;
        else {
          try { out[f.key] = JSON.parse(v); } catch { throw new Error(`"${f.label}" ليس JSON صحيحًا`); }
        }
        break;
      case "datetime": out[f.key] = v ? new Date(v).toISOString() : null; break;
      case "number": out[f.key] = v === "" ? null : Number(v); break;
      case "select": out[f.key] = f.key === "status_code" ? Number(v) : v; break;
      default: out[f.key] = v;
    }
  }
  return out;
}

function HtmlField({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const [source, setSource] = useState(false);
  return (
    <div>
      <div className="mb-1 flex gap-2 text-xs">
        <button type="button" onClick={() => setSource(false)} className={`rounded px-2 py-1 ${!source ? "bg-primary text-primary-foreground" : "border"}`}>محرر مرئي</button>
        <button type="button" onClick={() => setSource(true)} className={`rounded px-2 py-1 ${source ? "bg-primary text-primary-foreground" : "border"}`}>كود HTML</button>
      </div>
      {source ? (
        <Textarea dir={field.rtl ? "rtl" : "ltr"} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[360px] font-mono text-xs" />
      ) : (
        <Suspense fallback={<div className="min-h-[320px] rounded-lg border bg-muted/20" />}>
          <RichTextEditor value={value} onChange={onChange} dir={field.rtl ? "rtl" : "ltr"} />
        </Suspense>
      )}
    </div>
  );
}

export function FieldInput({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  const dir = field.rtl ? "rtl" : undefined;
  const id = `f-${field.key}`;
  let control: React.ReactNode;
  switch (field.type) {
    case "bool":
      control = <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />;
      break;
    case "textarea":
      control = <Textarea id={id} dir={dir} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[90px]" />;
      break;
    case "tags":
      control = <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[60px]" dir="ltr" />;
      break;
    case "json":
      control = <Textarea id={id} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[120px] font-mono text-xs" />;
      break;
    case "html":
      control = <HtmlField field={field} value={value} onChange={onChange} />;
      break;
    case "number":
      control = <Input id={id} type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" />;
      break;
    case "datetime":
      control = <Input id={id} type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" />;
      break;
    case "select":
      control = (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case "image":
      control = (
        <div className="space-y-2">
          <Input id={id} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
          {value ? <img src={value} alt="" className="h-24 rounded-md border object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : null}
        </div>
      );
      break;
    default:
      control = <Input id={id} dir={dir} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {control}
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </div>
  );
}
