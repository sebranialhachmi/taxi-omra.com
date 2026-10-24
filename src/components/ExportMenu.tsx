import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from "lucide-react";
import { exportData, type Column } from "@/lib/exports";
import { useHasPermission } from "@/lib/rbac";

export function ExportMenu({
  filename, rows, columns, title, module,
}: {
  filename: string;
  rows: any[];
  columns: Column[];
  title?: string;
  module?: string;
}) {
  const gate = useHasPermission(module ? `${module}.export` : "reports.export");
  if (module && !gate.allowed) return null;
  const disabled = !rows?.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 me-1" /> Export <ChevronDown className="h-3 w-3 ms-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => exportData("csv", filename, rows, columns, title)}>
          <FileText className="h-4 w-4 me-2" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData("excel", filename, rows, columns, title)}>
          <FileSpreadsheet className="h-4 w-4 me-2" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData("pdf", filename, rows, columns, title)}>
          <FileText className="h-4 w-4 me-2" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData("print", filename, rows, columns, title)}>
          <Printer className="h-4 w-4 me-2" /> Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
