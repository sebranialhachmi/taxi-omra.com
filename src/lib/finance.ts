export const DEFAULT_CURRENCY = "SAR";

export function fmtMoney(n: number | string | null | undefined, currency = DEFAULT_CURRENCY, locale = "en") {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(v);
}

export function toCSV(rows: Record<string, any>[], columns?: string[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCSV(filename: string, rows: Record<string, any>[], columns?: string[]) {
  const csv = toCSV(rows, columns);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const EXPENSE_CATEGORIES = [
  "fuel",
  "maintenance",
  "insurance",
  "vehicle_repair",
  "driver_salary",
  "marketing",
  "office",
  "software",
  "taxes",
  "other",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "online",
  "corporate_account",
  "invoice_later",
  "wallet",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "partially_paid",
  "refunded",
  "failed",
  "cancelled",
] as const;

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
] as const;

export function periodRange(kind: "today" | "week" | "month" | "year") {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (kind === "week") start.setDate(start.getDate() - 7);
  else if (kind === "month") start.setDate(start.getDate() - 30);
  else if (kind === "year") start.setMonth(start.getMonth() - 12);
  return { since: start.toISOString(), until: now.toISOString() };
}
