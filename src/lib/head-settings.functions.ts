import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const HEAD_KEYS = [
  "google_site_verification",
  "bing_site_verification",
  "head_meta_custom",
  "head_scripts_custom",
] as const;

export const getPublicHeadSettings = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return {} as Record<string, string>;
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data } = await client.from("settings").select("key,value").in("key", HEAD_KEYS as any);
  const out: Record<string, string> = {};
  (data ?? []).forEach((r: any) => {
    const v = typeof r.value === "string" ? r.value : (r.value?.value ?? "");
    if (v) out[r.key] = String(v);
  });
  return out;
});
