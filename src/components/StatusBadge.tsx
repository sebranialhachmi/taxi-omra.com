import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

type Entry = { label: string; ar: string; variant: any; className?: string };

const map: Record<string, Entry> = {
  // Booking statuses
  new: { label: "New", ar: "جديد", variant: "secondary", className: "bg-muted text-foreground border-border" },
  pending: { label: "Pending", ar: "قيد الانتظار", variant: "secondary", className: "bg-warning/20 text-warning-foreground border-warning/30" },
  confirmed: { label: "Confirmed", ar: "مؤكد", variant: "secondary", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  assigned: { label: "Assigned", ar: "مُعيَّن", variant: "secondary", className: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  picked_up: { label: "Picked up", ar: "تم الاستلام", variant: "secondary", className: "bg-primary/25 text-primary border-primary/40" },
  en_route: { label: "En route", ar: "في الطريق", variant: "secondary", className: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  on_trip: { label: "On trip", ar: "في رحلة", variant: "secondary", className: "bg-primary/20 text-primary border-primary/30" },
  completed: { label: "Completed", ar: "مكتمل", variant: "secondary", className: "bg-success/20 text-success border-success/30" },
  cancelled: { label: "Cancelled", ar: "ملغي", variant: "destructive" },
  no_show: { label: "No show", ar: "لم يحضر", variant: "destructive" },
  // Driver statuses
  available: { label: "Available", ar: "متاح", variant: "secondary", className: "bg-success/20 text-success border-success/30" },
  busy: { label: "Busy", ar: "مشغول", variant: "secondary", className: "bg-primary/20 text-primary border-primary/30" },
  offline: { label: "Offline", ar: "خارج الخدمة", variant: "secondary" },
  on_break: { label: "On break", ar: "استراحة", variant: "secondary", className: "bg-warning/20 text-warning-foreground border-warning/30" },
  waiting: { label: "Waiting", ar: "انتظار", variant: "secondary", className: "bg-warning/20 text-warning-foreground border-warning/30" },
  vacation: { label: "Vacation", ar: "إجازة", variant: "secondary", className: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  suspended: { label: "Suspended", ar: "موقوف", variant: "destructive" },
  // Vehicle statuses
  active: { label: "Active", ar: "نشط", variant: "secondary", className: "bg-success/20 text-success border-success/30" },
  maintenance: { label: "Maintenance", ar: "صيانة", variant: "secondary", className: "bg-warning/20 text-warning-foreground border-warning/30" },
  out_of_service: { label: "Out of service", ar: "خارج الخدمة", variant: "destructive" },
  reserved: { label: "Reserved", ar: "محجوز", variant: "secondary", className: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  retired: { label: "Retired", ar: "متقاعد", variant: "secondary" },
  inactive: { label: "Inactive", ar: "غير نشط", variant: "secondary" },
  // Employment statuses
  probation: { label: "Probation", ar: "تحت الاختبار", variant: "secondary", className: "bg-warning/20 text-warning-foreground border-warning/30" },
  terminated: { label: "Terminated", ar: "منتهي", variant: "destructive" },
  // Payment
  paid: { label: "Paid", ar: "مدفوع", variant: "secondary", className: "bg-success/20 text-success border-success/30" },
  partially_paid: { label: "Partially paid", ar: "مدفوع جزئياً", variant: "secondary", className: "bg-warning/20 text-warning-foreground border-warning/30" },
  refunded: { label: "Refunded", ar: "مسترد", variant: "secondary", className: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  failed: { label: "Failed", ar: "فشل", variant: "destructive" },
  // Invoice
  draft: { label: "Draft", ar: "مسودة", variant: "secondary" },
  issued: { label: "Issued", ar: "صادرة", variant: "secondary", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  overdue: { label: "Overdue", ar: "متأخرة", variant: "destructive" },
  // Payroll
  approved: { label: "Approved", ar: "معتمد", variant: "secondary", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const { locale } = useI18n();
  if (!value) return <Badge variant="outline">—</Badge>;
  const m = map[value];
  const label = m ? (locale === "ar" ? m.ar : m.label) : value;
  return <Badge variant={m?.variant ?? "secondary"} className={m?.className}>{label}</Badge>;
}
