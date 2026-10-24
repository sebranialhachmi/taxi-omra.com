// Phase H — AI Generator server functions.
// One-shot generators that produce DRAFTS requiring human approval before
// being applied. Uses Lovable AI Gateway (chat completions). All outputs are
// persisted in `ai_drafts` with status='draft'; nothing is auto-published.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

async function callAi(system: string, user: string, opts?: { json?: boolean; model?: string }) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const body: any = {
    model: opts?.model ?? DEFAULT_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (opts?.json) body.response_format = { type: "json_object" };
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("AI rate limit — try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted — add credits in workspace billing.");
    throw new Error(`AI gateway ${res.status}: ${t.slice(0, 300)}`);
  }
  const j: any = await res.json();
  return String(j.choices?.[0]?.message?.content ?? "");
}

async function saveDraft(sb: any, userId: string, args: {
  kind: string; target_entity?: string; target_id?: string; locale?: string;
  input: unknown; output: unknown;
}) {
  const { data, error } = await sb.from("ai_drafts").insert({
    kind: args.kind,
    target_entity: args.target_entity ?? null,
    target_id: args.target_id ?? null,
    locale: args.locale ?? "en",
    input: args.input as any,
    output: args.output as any,
    status: "draft",
    created_by: userId,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

// ============ SEO GENERATORS ============
export const aiGenerateSeoMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    topic: z.string().min(2).max(400),
    locale: z.enum(["en", "ar"]).default("en"),
    target_entity: z.string().optional(),
    target_id: z.string().uuid().optional(),
    context: z.string().max(2000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const sys = `You are an SEO writer for a luxury chauffeur/taxi company. Write natural, click-worthy meta tags.
- Titles: 50–60 characters, include primary keyword, brand at end.
- Descriptions: 140–160 characters, actionable, avoid clickbait.
- Output STRICT JSON: {"title":"…","description":"…","keywords":["…"]}
- Language: ${data.locale === "ar" ? "Arabic" : "English"}.`;
    const raw = await callAi(sys, `Topic: ${data.topic}\nContext: ${data.context ?? ""}`, { json: true });
    let out: any; try { out = JSON.parse(raw); } catch { out = { title: "", description: "", keywords: [], raw }; }
    const id = await saveDraft(supabase, userId, { kind: "seo_meta", ...data, input: data, output: out });
    return { draft_id: id, ...out };
  });

export const aiGenerateSchemaSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    entity_type: z.enum(["service", "route", "city", "airport", "faq", "article", "organization"]),
    payload: z.record(z.string(), z.unknown()),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const sys = `You produce Schema.org JSON-LD for a taxi/chauffeur company. Return STRICT valid JSON-LD only, no markdown.`;
    const raw = await callAi(sys, `Entity type: ${data.entity_type}\nData: ${JSON.stringify(data.payload)}`, { json: true });
    let out: any; try { out = JSON.parse(raw); } catch { out = { error: "Invalid JSON", raw }; }
    const id = await saveDraft(context.supabase, context.userId, { kind: "schema_jsonld", input: data, output: out });
    return { draft_id: id, jsonld: out };
  });

// ============ CONTENT GENERATORS ============
export const aiGenerateBlogDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    title: z.string().min(3).max(200),
    outline: z.array(z.string()).max(15).optional(),
    locale: z.enum(["en", "ar"]).default("en"),
    tone: z.enum(["luxury", "informative", "friendly"]).default("luxury"),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const sys = `You write blog posts for a luxury chauffeur company. Tone: ${data.tone}. Language: ${data.locale}.
Return STRICT JSON: {"title":"…","excerpt":"…","content_markdown":"…","tags":["…"],"reading_time_min":N}
Content must be 800–1400 words, well structured with H2/H3, no fabricated data.`;
    const user = `Title: ${data.title}\nOutline: ${(data.outline ?? []).join("\n- ")}`;
    const raw = await callAi(sys, user, { json: true });
    let out: any; try { out = JSON.parse(raw); } catch { out = { error: "Invalid JSON", raw }; }
    const id = await saveDraft(context.supabase, context.userId, { kind: "blog_draft", locale: data.locale, input: data, output: out });
    return { draft_id: id, ...out };
  });

export const aiRewriteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    text: z.string().min(5).max(8000),
    mode: z.enum(["rewrite", "expand", "summarize", "translate"]),
    target_locale: z.enum(["en", "ar"]).optional(),
    tone: z.enum(["luxury", "friendly", "professional"]).default("luxury"),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const modeMap: Record<string, string> = {
      rewrite: "Rewrite the text in the same language, preserving meaning and factual claims.",
      expand: "Expand the text to roughly double its length, adding relevant detail. Do not invent facts.",
      summarize: "Summarise the text in 2–4 sentences, preserving key facts.",
      translate: `Translate the text into ${data.target_locale === "ar" ? "Arabic" : "English"}, keeping proper nouns and prices unchanged.`,
    };
    const sys = `You are a copy editor for a luxury chauffeur company. Tone: ${data.tone}. ${modeMap[data.mode]} Return plain text only.`;
    const out = await callAi(sys, data.text);
    const id = await saveDraft(context.supabase, context.userId, {
      kind: data.mode === "translate" ? "translation" : `content_${data.mode}`,
      locale: data.target_locale ?? "en",
      input: data,
      output: { text: out },
    });
    return { draft_id: id, text: out };
  });

// ============ BOOKING ASSIST ============
export const aiBookingSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ booking_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: b, error } = await supabase.from("bookings")
      .select("code,status,pickup_at,pickup_location,dropoff_location,total_fare,currency,special_requests,customer:customers(name,phone,tier),driver:drivers(name),category:vehicle_categories(name_en)")
      .eq("id", data.booking_id).maybeSingle();
    if (error || !b) throw new Error("Booking not found or not authorised");
    const sys = "Summarise a single booking for internal staff. 3 short lines, plain English. No fabrication.";
    const summary = await callAi(sys, JSON.stringify(b));
    const id = await saveDraft(supabase, userId, {
      kind: "booking_summary", target_entity: "booking", target_id: data.booking_id, input: b, output: { summary },
    });
    return { draft_id: id, summary };
  });

export const aiPriceExplanation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    base_fare: z.number(),
    distance_km: z.number().optional(),
    duration_min: z.number().optional(),
    surcharges: z.record(z.string(), z.number()).optional(),
    discount: z.number().optional(),
    currency: z.string().default("SAR"),
    locale: z.enum(["en", "ar"]).default("en"),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const sys = `Explain a taxi fare breakdown to a customer in ${data.locale === "ar" ? "Arabic" : "English"}. Warm, transparent, 2–4 sentences. No fabrication.`;
    const text = await callAi(sys, JSON.stringify(data));
    const id = await saveDraft(context.supabase, context.userId, { kind: "price_explanation", locale: data.locale, input: data, output: { text } });
    return { draft_id: id, text };
  });

// ============ DRAFT MANAGEMENT ============
export const listAiDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    kind: z.string().optional(),
    status: z.enum(["draft", "approved", "rejected", "applied"]).optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }).parse(i))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("ai_drafts").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const reviewAiDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    draft_id: z.string().uuid(),
    decision: z.enum(["approve", "reject"]),
    notes: z.string().max(1000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_drafts").update({
      status: data.decision === "approve" ? "approved" : "rejected",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      notes: data.notes ?? null,
    }).eq("id", data.draft_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
