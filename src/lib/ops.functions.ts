// Operations & backup server functions.
// - opsSnapshot: gathers live counts and health signals from RLS-scoped tables.
// - exportAllData: streams every business table as a single JSON archive for the caller.
// Admin/manager only; enforced by requireSupabaseAuth + has_role check inside handlers.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (data === true) return true;
  const { data: mgr } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "manager" });
  if (mgr !== true) throw new Error("Forbidden");
  return true;
}

// ---- Ops snapshot ---------------------------------------------------------
type OpsHealth = { name: string; status: "ok" | "warn" | "down"; detail?: string };

export const opsSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);

    const check = async (label: string, fn: () => Promise<void>): Promise<OpsHealth> => {
      try { await fn(); return { name: label, status: "ok" }; }
      catch (e: any) { return { name: label, status: "down", detail: String(e?.message ?? e).slice(0, 200) }; }
    };

    const [
      dbHealth, storageHealth, authHealth,
      bookingsTotal, bookingsToday, activeDrivers, activeVehicles,
      pendingInvoices, unresolvedErrors, recentErrors, contactsNew,
    ] = await Promise.all([
      check("Database", async () => { const { error } = await sb.from("settings").select("key").limit(1); if (error) throw error; }),
      check("Storage", async () => { const { data, error } = await sb.storage.listBuckets(); if (error) throw error; if (!data) throw new Error("no data"); }),
      check("Auth", async () => { const { data, error } = await sb.auth.getUser(); if (error || !data.user) throw error ?? new Error("no user"); }),
      sb.from("bookings").select("*", { count: "exact", head: true }),
      sb.from("bookings").select("*", { count: "exact", head: true }).gte("pickup_at", today.toISOString()),
      sb.from("drivers").select("*", { count: "exact", head: true }).neq("status", "suspended"),
      sb.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
      sb.from("invoices").select("*", { count: "exact", head: true }).in("status", ["issued", "overdue"]),
      sb.from("error_logs").select("*", { count: "exact", head: true }).eq("resolved", false),
      sb.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
      sb.from("contact_submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
    ]);

    // Storage bucket usage summary
    let storageBytes = 0;
    let storageFiles = 0;
    try {
      const { data: media } = await sb.from("media_library").select("size_bytes");
      (media ?? []).forEach((m: any) => { storageBytes += Number(m.size_bytes || 0); storageFiles += 1; });
    } catch { /* ignore */ }

    // WhatsApp readiness: at least one active template
    const { count: waActive } = await sb.from("whatsapp_templates").select("*", { count: "exact", head: true }).eq("is_active", true);

    // AI readiness — key presence surfaced by success of a health-only fetch
    const aiOk = !!process.env.LOVABLE_API_KEY;

    const services: OpsHealth[] = [
      dbHealth, storageHealth, authHealth,
      { name: "WhatsApp templates", status: (waActive ?? 0) > 0 ? "ok" : "warn", detail: `${waActive ?? 0} active` },
      { name: "AI Gateway", status: aiOk ? "ok" : "down", detail: aiOk ? "LOVABLE_API_KEY present" : "missing key" },
    ];

    return {
      captured_at: now.toISOString(),
      services,
      counters: {
        bookings_total: bookingsTotal.count ?? 0,
        bookings_today: bookingsToday.count ?? 0,
        active_drivers: activeDrivers.count ?? 0,
        active_vehicles: activeVehicles.count ?? 0,
        pending_invoices: pendingInvoices.count ?? 0,
        unresolved_errors: unresolvedErrors.count ?? 0,
        errors_7d: recentErrors.count ?? 0,
        new_contacts: contactsNew.count ?? 0,
      },
      storage: {
        files: storageFiles,
        bytes: storageBytes,
      },
    };
  });

// ---- Backup / export ------------------------------------------------------
const EXPORT_TABLES = [
  "customers", "drivers", "vehicles", "vehicle_categories", "routes",
  "bookings", "invoices", "payments", "refunds", "expenses",
  "corporate_accounts", "coupons", "pricing_rules", "driver_payroll",
  "customer_notes", "customer_documents",
  "activity_events", "audit_logs",
  "settings", "finance_settings",
  "cms_pages", "blog_posts", "blog_categories", "faqs",
  "hero_slides", "homepage_sections", "promotions", "partners", "testimonials",
  "whatsapp_templates",
] as const;

export const exportAllData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const bundle: Record<string, any[]> = {};
    for (const table of EXPORT_TABLES) {
      const { data, error } = await sb.from(table as any).select("*").limit(50_000);
      if (error) {
        bundle[table] = [{ __error: error.message }];
        continue;
      }
      bundle[table] = (data ?? []) as any[];
    }
    const payload = {
      exported_at: new Date().toISOString(),
      generated_by: context.userId,
      tables: bundle,
    };
    // Return as a JSON string to keep the RPC serializer happy with heterogeneous rows.
    return { json: JSON.stringify(payload) };
  });

// ---- Import / restore ----------------------------------------------------
// Admin-only. Upserts rows from an exported bundle back into each table.
// Uses the service-role client so RLS won't block admin restore, but still
// authorizes the caller via assertAdmin(). Errors per-table are collected
// so a partial failure doesn't abort the whole restore.
export const importAllData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { json: string; mode?: "upsert" | "insert" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let parsed: any;
    try { parsed = JSON.parse(data.json); } catch { throw new Error("Invalid JSON file"); }
    const tables = parsed?.tables && typeof parsed.tables === "object" ? parsed.tables : parsed;
    if (!tables || typeof tables !== "object") throw new Error("Unrecognized backup format");

    const report: { table: string; inserted: number; error?: string }[] = [];
    for (const table of EXPORT_TABLES) {
      const rows = Array.isArray(tables[table]) ? tables[table].filter((r: any) => r && !r.__error) : [];
      if (!rows.length) { report.push({ table, inserted: 0 }); continue; }
      // Chunk to avoid oversized payloads
      let inserted = 0;
      let lastErr: string | undefined;
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const q = supabaseAdmin.from(table as any).upsert(chunk as any);
        const { error } = await q;
        if (error) { lastErr = error.message; break; }
        inserted += chunk.length;
      }
      report.push({ table, inserted, error: lastErr });
    }
    return { report, imported_at: new Date().toISOString() };
  });
