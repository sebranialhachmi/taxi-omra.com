// Enterprise RBAC — client-side helpers. Server enforcement is via
// has_permission() SQL function + RLS. UI usage of these hooks is
// for hiding/disabling controls only; never for authorization.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

export const ACTIONS = ["view","create","edit","delete","export","publish","assign","manage","approve","print","restore","audit"] as const;
export type PermAction = (typeof ACTIONS)[number];

export const MODULES = [
  "bookings","customers","drivers","fleet","categories","routes","dispatch","calendar","tasks","reminders",
  "finance","payments","invoices","expenses","refunds","corporate","payroll","pricing","coupons",
  "cms","blog","pages","faqs","testimonials","team","menus","hero","homepage","media","promotions","partners","services","cities","airports",
  "seo","redirects","contacts","whatsapp",
  "reports","analytics","audit","activity",
  "users","roles","settings","operations","notifications","marketing",
] as const;
export type PermModule = (typeof MODULES)[number];

export const perm = (module: PermModule, action: PermAction) => `${module}.${action}` as const;

export function usePermissions() {
  return useQuery({
    queryKey: ["me-perms"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return { codes: new Set<string>(), isAdmin: false };
      const [{ data: roles }, { data: perms }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.rpc("user_permissions" as any, { _user_id: uid }),
      ]);
      const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
      const codes = new Set<string>((perms ?? []).map((p: any) => p.code));
      return { codes, isAdmin };
    },
  });
}

export function useHasPermission(code: string) {
  const q = usePermissions();
  if (!q.data) return { allowed: false, loading: q.isLoading };
  if (q.data.isAdmin) return { allowed: true, loading: false };
  // module.manage grants everything within module
  const [mod] = code.split(".");
  const allowed = q.data.codes.has(code) || q.data.codes.has(`${mod}.manage`);
  return { allowed, loading: false };
}

export function PermissionGate({ code, children, fallback = null }: { code: string; children: ReactNode; fallback?: ReactNode }) {
  const { allowed, loading } = useHasPermission(code);
  if (loading || !allowed) return <>{fallback}</>;
  return <>{children}</>;
}
