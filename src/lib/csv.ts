// CSV export helper for the admin.
// Neutralizes spreadsheet formula-injection: any cell whose string form starts
// with =, +, -, @, tab, or CR is prefixed with a single quote so Excel /
// LibreOffice / Sheets treat it as text.
function neutralizeFormula(s: string): string {
  if (!s) return s;
  const first = s.charCodeAt(0);
  // = + - @ \t \r
  if (first === 0x3d || first === 0x2b || first === 0x2d || first === 0x40 || first === 0x09 || first === 0x0d) {
    return `'${s}`;
  }
  return s;
}

export function toCsv(rows: Record<string, any>[], columns?: { key: string; label?: string }[]): string {
  if (!rows.length) return "";
  const cols: { key: string; label?: string }[] = columns ?? Object.keys(rows[0]).map((k) => ({ key: k }));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    let s = typeof v === "object" ? JSON.stringify(v) : String(v);
    s = neutralizeFormula(s);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => esc(c.label ?? c.key)).join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, rows: Record<string, any>[], columns?: { key: string; label?: string }[]) {
  const csv = toCsv(rows, columns);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export { neutralizeFormula };
