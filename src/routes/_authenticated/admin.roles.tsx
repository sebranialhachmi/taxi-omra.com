import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useHasPermission, ACTIONS } from "@/lib/rbac";
import { Shield, Sparkles } from "lucide-react";

const ROLES = ["admin", "manager", "dispatcher", "accountant", "driver"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS_AR: Record<Role, string> = {
  admin: "مدير عام",
  manager: "مدير",
  dispatcher: "منسق حركة",
  accountant: "محاسب",
  driver: "سائق",
};

const ACTION_LABELS_AR: Record<string, string> = {
  view: "عرض",
  create: "إنشاء",
  edit: "تعديل",
  delete: "حذف",
  export: "تصدير",
  manage: "إدارة",
  approve: "اعتماد",
  assign: "تعيين",
};

const MODULE_LABELS_AR: Record<string, string> = {
  bookings: "الحجوزات",
  customers: "العملاء",
  drivers: "السائقون",
  vehicles: "المركبات",
  invoices: "الفواتير",
  payments: "المدفوعات",
  expenses: "المصروفات",
  reports: "التقارير",
  analytics: "التحليلات",
  cms: "المحتوى",
  seo: "تحسين الظهور",
  marketing: "التسويق",
  roles: "الأدوار",
  users: "المستخدمون",
  audit: "التدقيق",
  operations: "العمليات",
  settings: "الإعدادات",
  fleet: "الأسطول",
  routes: "الرحلات",
  blog: "المدونة",
  faqs: "الأسئلة الشائعة",
  media: "الوسائط",
  finance: "المالية",
  payroll: "الرواتب",
  refunds: "المرتجعات",
  coupons: "القسائم",
  tasks: "المهام",
  whatsapp: "واتساب",
};

export const Route = createFileRoute("/_authenticated/admin/roles")({ component: RolesPage });

function RolesPage() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const gate = useHasPermission("roles.manage");
  const [q, setQ] = useState("");
  const [activeRole, setActiveRole] = useState<Role>("manager");

  const perms = useQuery({
    queryKey: ["all-perms"],
    queryFn: async () => (await supabase.from("permissions").select("*").order("module").order("action")).data ?? [],
  });
  const rolePerms = useQuery({
    queryKey: ["all-role-perms"],
    queryFn: async () => (await supabase.from("role_permissions").select("*")).data ?? [],
  });

  const grantedByRole = useMemo(() => {
    const m = new Map<string, Set<string>>();
    (rolePerms.data ?? []).forEach((rp: any) => {
      if (!m.has(rp.role)) m.set(rp.role, new Set());
      m.get(rp.role)!.add(rp.permission_id);
    });
    return m;
  }, [rolePerms.data]);

  const modules = useMemo(() => {
    const set = new Map<string, any[]>();
    (perms.data ?? []).forEach((p: any) => {
      if (!set.has(p.module)) set.set(p.module, []);
      set.get(p.module)!.push(p);
    });
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [perms.data]);

  const filteredModules = modules.filter(([m]) => !q.trim() || m.toLowerCase().includes(q.toLowerCase()));

  const ar = locale === "ar";

  const toggle = async (role: Role, permissionId: string, checked: boolean) => {
    if (role === "admin") { toast.info(ar ? "المدير العام لديه صلاحيات كاملة تلقائياً" : "Admin has full access by design"); return; }
    if (checked) {
      const { error } = await supabase.from("role_permissions").insert({ role, permission_id: permissionId });
      if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("role_permissions").delete().eq("role", role).eq("permission_id", permissionId);
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["all-role-perms"] });
    qc.invalidateQueries({ queryKey: ["me-perms"] });
  };

  const toggleModule = async (role: Role, moduleName: string, grant: boolean) => {
    if (role === "admin") return;
    const modPerms = (perms.data ?? []).filter((p: any) => p.module === moduleName);
    if (grant) {
      await supabase.from("role_permissions").upsert(modPerms.map((p: any) => ({ role, permission_id: p.id })), { onConflict: "role,permission_id" });
    } else {
      await supabase.from("role_permissions").delete().eq("role", role).in("permission_id", modPerms.map((p: any) => p.id));
    }
    qc.invalidateQueries({ queryKey: ["all-role-perms"] });
    qc.invalidateQueries({ queryKey: ["me-perms"] });
    const modLabel = ar ? (MODULE_LABELS_AR[moduleName] ?? moduleName) : moduleName;
    toast.success(ar ? `${grant ? "تم منح" : "تم سحب"} ${modLabel}` : `${grant ? "Granted" : "Revoked"} ${moduleName}`);
  };

  if (!gate.loading && !gate.allowed) return <div className="p-8 text-center text-muted-foreground">{ar ? "غير مصرح" : "Not authorized"}</div>;

  const activeGranted = grantedByRole.get(activeRole) ?? new Set();
  const totalPerms = perms.data?.length ?? 0;
  const roleLabel = (r: Role) => ar ? ROLE_LABELS_AR[r] : r;
  const modLabel = (m: string) => ar ? (MODULE_LABELS_AR[m] ?? m) : m;
  const actLabel = (a: string) => ar ? (ACTION_LABELS_AR[a] ?? a) : a;

  return (
    <div>
      <PageHeader
        title={ar ? "الأدوار والصلاحيات" : "Roles & Permissions"}
        description={ar ? `مصفوفة صلاحيات المؤسسة — ${totalPerms} صلاحية عبر ${modules.length} وحدة × ${ACTIONS.length} إجراءات` : `Enterprise RBAC — ${totalPerms} permissions across ${modules.length} modules × ${ACTIONS.length} actions`}
      />

      {/* Role selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ROLES.map((r) => {
          const count = grantedByRole.get(r)?.size ?? 0;
          const pct = totalPerms ? (count / totalPerms) * 100 : 0;
          return (
            <button key={r} onClick={() => setActiveRole(r)}
              className={`rounded-xl border p-4 text-start transition ${activeRole === r ? "border-gold bg-primary/5" : "border-border hover:border-gold/50"}`}>
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-4 w-4 text-gold" />
                {r === "admin" && <Sparkles className="h-3 w-3 text-gold" />}
              </div>
              <div className="capitalize font-display text-lg">{roleLabel(r)}</div>
              <div className="text-xs text-muted-foreground">{count} / {totalPerms}</div>
              <div className="mt-2 h-1 bg-muted rounded overflow-hidden">
                <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 flex items-center gap-3">
          <Input placeholder={ar ? "تصفية الوحدات…" : "Filter modules…"} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Badge variant="outline" className="capitalize">{ar ? "التعديل" : "Editing"}: {roleLabel(activeRole)}</Badge>
          {activeRole === "admin" && <span className="text-xs text-muted-foreground">{ar ? "المدير العام يمتلك صلاحيات كاملة — المصفوفة للقراءة فقط" : "Admin has full access — matrix is read-only"}</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{ar ? "مصفوفة الصلاحيات" : "Permission Matrix"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur border-b z-10">
                <tr>
                  <th className="text-start px-3 py-2 font-medium">{ar ? "الوحدة" : "Module"}</th>
                  {ACTIONS.map((a) => <th key={a} className="text-center px-1 py-2 font-medium capitalize w-16">{actLabel(a)}</th>)}
                  <th className="text-center px-2 py-2 font-medium w-24">{ar ? "الكل" : "Bulk"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredModules.map(([modName, modPerms]) => {
                  const modPermIds = modPerms.map((p: any) => p.id);
                  const grantedCount = modPermIds.filter((id: string) => activeGranted.has(id)).length;
                  const all = grantedCount === modPerms.length;
                  return (
                    <tr key={modName} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-1.5 font-medium capitalize">{modLabel(modName)}
                        <span className="ms-2 text-[10px] text-muted-foreground">{grantedCount}/{modPerms.length}</span>
                      </td>
                      {ACTIONS.map((a) => {
                        const p = modPerms.find((p: any) => p.action === a);
                        if (!p) return <td key={a} className="text-center text-muted-foreground/30">·</td>;
                        const granted = activeRole === "admin" || activeGranted.has(p.id);
                        return (
                          <td key={a} className="text-center">
                            <Checkbox
                              checked={granted}
                              disabled={activeRole === "admin"}
                              onCheckedChange={(v) => toggle(activeRole, p.id, !!v)}
                            />
                          </td>
                        );
                      })}
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={activeRole === "admin"}
                          onClick={() => toggleModule(activeRole, modName, !all)}
                          className="h-6 text-[10px]"
                        >
                          {all ? (ar ? "سحب" : "Revoke") : (ar ? "منح" : "Grant")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
