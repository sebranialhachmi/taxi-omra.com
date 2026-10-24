import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date + (date.length <= 10 ? "T00:00:00" : ""));
  return Math.ceil((d.getTime() - Date.now()) / 86400_000);
}

export function ExpiryPill({ date, label }: { date: string | null | undefined; label?: string }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const d = daysUntil(date)!;
  const cls =
    d < 0 ? "bg-destructive/15 text-destructive border-destructive/30"
    : d <= 30 ? "bg-warning/15 text-warning-foreground border-warning/30"
    : "bg-success/10 text-success border-success/30";
  const Icon = d < 0 || d <= 30 ? AlertTriangle : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] ${cls}`}>
      <Icon className="h-3 w-3" />
      {label ? <span className="me-1">{label}</span> : null}
      <span>{new Date(date).toLocaleDateString()}</span>
      <span className="opacity-70">
        {d < 0 ? `· expired` : d === 0 ? `· today` : `· ${d}d`}
      </span>
    </span>
  );
}
