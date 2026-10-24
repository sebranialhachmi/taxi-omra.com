import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "manager" | "dispatcher" | "accountant" | "driver";

type AuthCtx = {
  user: User | null;
  roles: Role[];
  loading: boolean;
  isStaff: boolean;
  hasRole: (r: Role) => boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as Role));
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    if (data.user) await loadRoles(data.user.id);
    else setRoles([]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
        if (session?.user) loadRoles(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRoles([]);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isStaff = roles.some((r) => ["admin", "manager", "dispatcher", "accountant"].includes(r));

  return (
    <Ctx.Provider
      value={{
        user,
        roles,
        loading,
        isStaff,
        hasRole: (r) => roles.includes(r),
        signOut: async () => {
          await supabase.auth.signOut();
        },
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
