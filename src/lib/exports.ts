// Enterprise export helpers — CSV, Excel, PDF, Print.
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadCsv, neutralizeFormula } from "./csv";

export type Column = { key: string; label?: string; width?: number };

function escapeHtml(v: any): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeCell(v: any): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return neutralizeFormula(s);
}

export function exportCsv(filename: string, rows: any[], columns?: Column[]) {
  downloadCsv(filename, rows, columns);
}

export function exportExcel(filename: string, rows: any[], columns?: Column[], sheetName = "Sheet1") {
  const cols: Column[] = columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ key: k, label: k }));
  const data = rows.map((r) => Object.fromEntries(cols.map((c) => {
    const v = r[c.key];
    const safe = v === null || v === undefined ? "" : (typeof v === "string" ? neutralizeFormula(v) : (typeof v === "object" ? neutralizeFormula(JSON.stringify(v)) : v));
    return [c.label ?? c.key, safe];
  })));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportPdf(opts: {
  filename: string;
  title?: string;
  subtitle?: string;
  rows: any[];
  columns: Column[];
  orientation?: "portrait" | "landscape";
}) {
  const doc = new jsPDF({ orientation: opts.orientation ?? "portrait", unit: "pt" });
  const margin = 40;
  let y = margin;
  if (opts.title) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(opts.title, margin, y); y += 20;
  }
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(opts.subtitle, margin, y); y += 16;
    doc.setTextColor(0);
  }
  autoTable(doc, {
    startY: y,
    head: [opts.columns.map((c) => c.label ?? c.key)],
    body: opts.rows.map((r) => opts.columns.map((c) => {
      const v = r[c.key];
      if (v === null || v === undefined) return "";
      if (v instanceof Date) return v.toLocaleString();
      return typeof v === "object" ? JSON.stringify(v) : String(v);
    })),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 15, 15], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin },
  });
  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}

export function printHtml(html: string, title = "Print") {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const safeTitle = escapeHtml(title);
  w.document.write(`<!doctype html><html><head><title>${safeTitle}</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#111}
      h1{font-size:20px;margin:0 0 8px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
      th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
      th{background:#111;color:#fff;font-weight:600}
      tr:nth-child(even) td{background:#f7f7f7}
      @media print{@page{margin:1cm}}
    </style></head><body>${html}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}<\/script></body></html>`);
  w.document.close();
}

export function printTable(title: string, rows: any[], columns: Column[]) {
  const head = columns.map((c) => `<th>${escapeHtml(c.label ?? c.key)}</th>`).join("");
  const body = rows.map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(r[c.key])}</td>`).join("")}</tr>`).join("");
  const safeTitle = escapeHtml(title);
  printHtml(`<h1>${safeTitle}</h1><div style="color:#666;font-size:11px">Generated ${escapeHtml(new Date().toLocaleString())}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`, title);
}

// Universal export menu action set
export type ExportFormat = "csv" | "excel" | "pdf" | "print";
export function exportData(format: ExportFormat, filename: string, rows: any[], columns: Column[], title?: string) {
  switch (format) {
    case "csv": return exportCsv(`${filename}.csv`, rows, columns);
    case "excel": return exportExcel(filename, rows, columns);
    case "pdf": return exportPdf({ filename, title: title ?? filename, rows, columns, orientation: columns.length > 6 ? "landscape" : "portrait" });
    case "print": return printTable(title ?? filename, rows, columns);
  }
}

// Explicitly reference safeCell to keep it exported for potential external use.
export { safeCell };
