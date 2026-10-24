import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";
import { KeyRound, Mail, Trash2, UserPlus, Power } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminCreateUser, adminUpdateUserEmail, adminResetPassword,
  adminSetRoles, adminToggleUserActive, adminDeleteUser,
} from "@/lib/user-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersPage });

const ROLES = ["admin", "manager", "dispatcher", "accountant", "driver"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABEL_AR: Record<Role, string> = {
  admin: "مدير",
  manager: "مسؤول",
  dispatcher: "منسق حجوزات",
  accountant: "محاسب",
  driver: "سائق",
};

function UsersPage() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();

  const create = useServerFn(adminCreateUser);
  const updEmail = useServerFn(adminUpdateUserEmail);
  const resetPw = useServerFn(adminResetPassword);
  const setRoles = useServerFn(adminSetRoles);
  const toggleActive = useServerFn(adminToggleUserActive);
  const delUser = useServerFn(adminDeleteUser);

  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      const map = new Map<string, Role[]>();
      (roles ?? []).forEach((r: any) => map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.role]));
      return (profiles ?? []).map((p: any) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", phone: "", roles: ["manager"] as Role[] });
  const [saving, setSaving] = useState(false);

  const submitCreate = async () => {
    if (!newUser.email || newUser.password.length < 6 || newUser.roles.length === 0) {
      toast.error(ar ? "أدخل البريد وكلمة مرور (6+) ودور واحد على الأقل" : "Email + password (6+) + at least one role required");
      return;
    }
    setSaving(true);
    try {
      await create({ data: newUser });
      toast.success(ar ? "تم إنشاء المستخدم" : "User created");
      setCreateOpen(false);
      setNewUser({ email: "", password: "", full_name: "", phone: "", roles: ["manager"] });
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally { setSaving(false); }
  };

  // Edit dialog state
  const [editing, setEditing] = useState<any | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRoles, setEditRoles] = useState<Role[]>([]);
  const [newPw, setNewPw] = useState("");

  const openEdit = (u: any) => {
    setEditing(u);
    setEditEmail(u.email ?? "");
    setEditRoles(u.roles ?? []);
    setNewPw("");
  };

  const submitEmail = async () => {
    if (!editing || !editEmail) return;
    try {
      await updEmail({ data: { user_id: editing.id, email: editEmail } });
      toast.success(ar ? "تم تحديث البريد" : "Email updated");
      refresh();
    } catch (e: any) { toast.error(e?.message); }
  };
  const submitPw = async () => {
    if (!editing || newPw.length < 6) { toast.error(ar ? "كلمة المرور 6 أحرف على الأقل" : "Min 6 chars"); return; }
    try {
      await resetPw({ data: { user_id: editing.id, password: newPw } });
      toast.success(ar ? "تم إعادة تعيين كلمة المرور" : "Password reset");
      setNewPw("");
    } catch (e: any) { toast.error(e?.message); }
  };
  const submitRoles = async () => {
    if (!editing) return;
    try {
      await setRoles({ data: { user_id: editing.id, roles: editRoles } });
      toast.success(ar ? "تم تحديث الأدوار" : "Roles updated");
      refresh();
    } catch (e: any) { toast.error(e?.message); }
  };
  const doToggle = async (u: any) => {
    try {
      await toggleActive({ data: { user_id: u.id, is_active: !u.is_active } });
      refresh();
    } catch (e: any) { toast.error(e?.message); }
  };
  const doDelete = async (u: any) => {
    if (!confirm(ar ? `حذف الحساب ${u.email}؟ لا يمكن التراجع.` : `Delete ${u.email}?`)) return;
    try {
      await delUser({ data: { user_id: u.id } });
      toast.success(ar ? "تم الحذف" : "Deleted");
      refresh();
    } catch (e: any) { toast.error(e?.message); }
  };

  const cols: Column<any>[] = [
    { key: "full_name", header: ar ? "الاسم" : "Name", render: (r) => r.full_name ?? "—" },
    { key: "email", header: ar ? "البريد" : "Email" },
    { key: "phone", header: ar ? "الهاتف" : "Phone", render: (r) => r.phone ?? "—" },
    {
      key: "roles", header: ar ? "الأدوار" : "Roles", render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.length === 0 ? <span className="text-muted-foreground text-xs">—</span> :
            r.roles.map((x: Role) => <Badge key={x} variant="secondary">{ar ? ROLE_LABEL_AR[x] : x}</Badge>)}
        </div>
      ),
    },
    {
      key: "is_active", header: ar ? "الحالة" : "Status", render: (r) => (
        <Badge variant={r.is_active ? "secondary" : "destructive"} className={r.is_active ? "bg-success/20 text-success border-success/30" : ""}>
          {r.is_active ? (ar ? "نشط" : "Active") : (ar ? "موقوف" : "Inactive")}
        </Badge>
      )
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("users")}
        description={ar ? "إدارة الحسابات والأدوار وكلمات المرور" : "Manage accounts, roles and passwords"}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" /> {ar ? "إضافة مستخدم" : "Add user"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ar ? "إنشاء مستخدم جديد" : "Create user"}</DialogTitle>
                <DialogDescription>{ar ? "سيتم تأكيد البريد تلقائياً." : "Email will be auto-confirmed."}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>{ar ? "البريد" : "Email"}</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
                <div><Label>{ar ? "كلمة المرور" : "Password"}</Label><Input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="min 6 chars" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{ar ? "الاسم" : "Full name"}</Label><Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} /></div>
                  <div><Label>{ar ? "الهاتف" : "Phone"}</Label><Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} /></div>
                </div>
                <div>
                  <Label className="mb-2 block">{ar ? "الأدوار" : "Roles"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <label key={r} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                        <Checkbox
                          checked={newUser.roles.includes(r)}
                          onCheckedChange={(v) => setNewUser({
                            ...newUser,
                            roles: v ? [...newUser.roles, r] : newUser.roles.filter((x) => x !== r),
                          })}
                        />
                        <span className="text-sm">{ar ? ROLE_LABEL_AR[r] : r}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
                <Button onClick={submitCreate} disabled={saving}>{saving ? "…" : t("create")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable
        data={q.data ?? []}
        columns={cols}
        loading={q.isLoading}
        actions={(r) => (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => openEdit(r)} title={ar ? "تعديل" : "Edit"}>
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => doToggle(r)} title={ar ? "تفعيل/إيقاف" : "Toggle active"}>
              <Power className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => doDelete(r)} title={ar ? "حذف" : "Delete"}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ar ? "تعديل المستخدم" : "Edit user"}</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> {ar ? "تغيير البريد" : "Change email"}</Label>
              <div className="flex gap-2">
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                <Button onClick={submitEmail}>{t("save")}</Button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> {ar ? "إعادة تعيين كلمة المرور" : "Reset password"}</Label>
              <div className="flex gap-2">
                <Input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="min 6 chars" />
                <Button onClick={submitPw}>{ar ? "تعيين" : "Set"}</Button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <Label>{ar ? "الأدوار" : "Roles"}</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                    <Checkbox
                      checked={editRoles.includes(r)}
                      onCheckedChange={(v) => setEditRoles(v ? [...editRoles, r] : editRoles.filter((x) => x !== r))}
                    />
                    <span className="text-sm">{ar ? ROLE_LABEL_AR[r] : r}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={submitRoles}>{ar ? "حفظ الأدوار" : "Save roles"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
