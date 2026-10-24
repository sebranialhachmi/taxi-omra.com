import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Role = "admin" | "manager" | "dispatcher" | "accountant" | "driver";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; full_name?: string; phone?: string; roles: Role[] }) =>
    z.object({
      email: z.string().trim().email().max(255),
      password: z.string().min(6).max(128),
      full_name: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(40).optional(),
      roles: z.array(z.enum(["admin", "manager", "dispatcher", "accountant", "driver"])).min(1),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name ?? data.email.split("@")[0] },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");
    const uid = created.user.id;
    // Profile is created by handle_new_user; ensure phone if provided.
    if (data.phone) {
      await supabaseAdmin.from("profiles").update({ phone: data.phone, full_name: data.full_name ?? null }).eq("id", uid);
    } else if (data.full_name) {
      await supabaseAdmin.from("profiles").update({ full_name: data.full_name }).eq("id", uid);
    }
    // Roles
    const rows = data.roles.map((r) => ({ user_id: uid, role: r as any }));
    await supabaseAdmin.from("user_roles").upsert(rows, { onConflict: "user_id,role" });
    return { id: uid };
  });

export const adminUpdateUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; email: string }) =>
    z.object({ user_id: z.string().uuid(), email: z.string().trim().email().max(255) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      email: data.email,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").update({ email: data.email }).eq("id", data.user_id);
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; password: string }) =>
    z.object({ user_id: z.string().uuid(), password: z.string().min(6).max(128) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; roles: Role[] }) =>
    z.object({
      user_id: z.string().uuid(),
      roles: z.array(z.enum(["admin", "manager", "dispatcher", "accountant", "driver"])),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (data.roles.length > 0) {
      await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((r) => ({ user_id: data.user_id, role: r as any })));
    }
    return { ok: true };
  });

export const adminToggleUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; is_active: boolean }) =>
    z.object({ user_id: z.string().uuid(), is_active: z.boolean() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ is_active: data.is_active }).eq("id", data.user_id);
    // Optional: ban/unban via auth admin
    await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.is_active ? "none" : "876000h",
    } as any);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (data.user_id === context.userId) throw new Error("Cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
