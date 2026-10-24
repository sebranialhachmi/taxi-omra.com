import { Badge } from "@/components/ui/badge";
import { Crown, Building2, User, Ban } from "lucide-react";

const map: Record<string, { label: string; className: string; icon: any }> = {
  vip:         { label: "VIP",         className: "bg-gold/20 text-gold border-gold/40",                 icon: Crown },
  corporate:   { label: "Corporate",   className: "bg-chart-2/15 text-chart-2 border-chart-2/30",       icon: Building2 },
  regular:     { label: "Regular",     className: "bg-muted text-foreground border-border",              icon: User },
  blacklisted: { label: "Blacklisted", className: "bg-destructive/20 text-destructive border-destructive/40", icon: Ban },
};

export function CustomerTierBadge({ value }: { value: string | null | undefined }) {
  const m = map[value ?? "regular"] ?? map.regular;
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={m.className + " gap-1 font-medium"}>
      <Icon className="h-3 w-3" /> {m.label}
    </Badge>
  );
}
