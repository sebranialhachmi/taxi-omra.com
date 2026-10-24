// Server-side rate limiter using rate_limit_events (service-role only).
// Simple fixed-window: allow N events per key per minute.
// Callers derive `key` from IP + endpoint or email + endpoint.

export async function checkRateLimit(key: string, limit = 5): Promise<{ allowed: boolean; retryAfter: number; count: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const bucket = new Date();
  bucket.setSeconds(0, 0);
  const bucketIso = bucket.toISOString();

  // Upsert increment: try insert first, fall back to update.
  const { error: insertErr } = await supabaseAdmin
    .from("rate_limit_events")
    .insert({ key, bucket: bucketIso, count: 1 });

  if (insertErr) {
    // Unique-violation — bump the existing row.
    const { data: existing } = await supabaseAdmin
      .from("rate_limit_events")
      .select("count")
      .eq("key", key)
      .eq("bucket", bucketIso)
      .maybeSingle();
    const next = (existing?.count ?? 0) + 1;
    await supabaseAdmin
      .from("rate_limit_events")
      .update({ count: next })
      .eq("key", key)
      .eq("bucket", bucketIso);
    return {
      allowed: next <= limit,
      count: next,
      retryAfter: next > limit ? 60 - new Date().getSeconds() : 0,
    };
  }

  return { allowed: true, count: 1, retryAfter: 0 };
}

/** Derive a stable client key from a request. */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  return `${scope}:${fwd}`;
}
