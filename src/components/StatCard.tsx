import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon: Icon, tone = "primary", hint, trend,
}: {
  label: string; value: string | number; icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "chart2"; hint?: string;
  trend?: { value: string; positive?: boolean };
}) {
  const toneMap = {
    primary: "bg-gold/15 text-gold",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    chart2: "bg-chart-2/15 text-chart-2",
  } as const;
  return (
    <Card className="hover-lift border-border/70 rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneMap[tone])}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="font-display text-4xl leading-none mt-4 tracking-tight">{value}</div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          {trend && (
            <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 font-medium", trend.positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
