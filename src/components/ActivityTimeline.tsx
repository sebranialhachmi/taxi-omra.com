import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CircleDot } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  entityType: "booking" | "customer" | "driver" | "vehicle" | "task";
  entityId: string;
  limit?: number;
}

export function ActivityTimeline({ entityType, entityId, limit = 100 }: Props) {
  const { locale } = useI18n();
  const q = useQuery({
    queryKey: ["activity", entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_events")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
  });

  if (q.isLoading) return <div className="space-y-2">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>;
  const events = q.data ?? [];
  if (events.length === 0) return <div className="text-sm text-muted-foreground py-4 flex items-center gap-2"><Clock className="h-4 w-4" />{locale==="ar"?"لا يوجد سجل نشاط":"No activity yet"}</div>;

  return (
    <ol className="relative border-s border-border/60 ms-2 space-y-4 py-2">
      {events.map((e: any) => (
        <li key={e.id} className="ms-4">
          <span className="absolute -start-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-gold ring-4 ring-background">
            <CircleDot className="h-3 w-3 text-gold-foreground opacity-0" />
          </span>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{e.message ?? e.event_type}</p>
              {(e.from_value || e.to_value) && e.event_type !== "status_changed" && (
                <p className="text-xs text-muted-foreground truncate">
                  {e.from_value && <span>{e.from_value} → </span>}{e.to_value}
                </p>
              )}
            </div>
            <time className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
              {new Date(e.created_at).toLocaleString(locale === "ar" ? "ar" : "en", { dateStyle: "short", timeStyle: "short" })}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
