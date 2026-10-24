import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type Column<T> = { key: string; header: ReactNode; render?: (row: T) => ReactNode; className?: string };

export function DataTable<T extends { id: string | number }>({
  data, columns, loading, empty, actions, onRowClick,
}: { data: T[]; columns: Column<T>[]; loading?: boolean; empty?: string; actions?: (row: T) => ReactNode; onRowClick?: (row: T) => void }) {
  const { t } = useI18n();
  const totalCols = columns.length + (actions ? 1 : 0);
  return (
    <Card className="rounded-2xl border-border/70 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                {columns.map((c) => (
                  <TableHead key={c.key} className={`text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground h-11 ${c.className ?? ""}`}>{c.header}</TableHead>
                ))}
                {actions && <TableHead className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground text-end">{t("actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  {Array.from({ length: totalCols }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-3/4" /></TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={totalCols} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Inbox className="h-5 w-5" />
                      </div>
                      <div className="text-sm text-muted-foreground">{empty ?? t("no_data")}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && data.map((row) => (
                <TableRow key={String(row.id)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={`py-3.5 text-sm ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : (row as any)[c.key]}
                    </TableCell>
                  ))}
                  {actions && <TableCell className="text-end py-3.5">{actions(row)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
