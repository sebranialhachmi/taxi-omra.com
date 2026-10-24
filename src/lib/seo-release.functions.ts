import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reviewComplete } from "./seo-release-rules";

export const getSeoReleaseQueue = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [queue, settings] = await Promise.all([
    context.supabase.from("seo_release_queue").select("*").order("priority").order("created_at").limit(1000),
    context.supabase.from("seo_release_settings").select("*").eq("id", true).single(),
  ]);
  if (queue.error) throw new Error(queue.error.message);
  if (settings.error) throw new Error(settings.error.message);
  return { items: queue.data, settings: settings.data };
});

const schema = z.object({
  id: z.string().uuid(), status: z.enum(["pending", "ready"]), priority: z.number().int().min(1).max(999),
  checks: z.object({ facts: z.boolean(), prices: z.boolean(), unique: z.boolean(), bilingual: z.boolean(), images: z.boolean(), links: z.boolean(), competitors: z.boolean() }),
  competitor_urls: z.array(z.string().url().startsWith("https://")).max(10), advantage: z.string().max(4000), notes: z.string().max(4000),
});
export const saveSeoReview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => schema.parse(data)).handler(async ({ context, data }) => {
  if (data.status === "ready" && !reviewComplete(data.checks, data.competitor_urls, data.advantage)) throw new Error("أكمل المراجعة والمقارنة قبل اعتماد المحتوى / Complete the review first");
  const { id, ...values } = data;
  const result = await context.supabase.from("seo_release_queue").update(values).eq("id", id).select("id").single();
  if (result.error) throw new Error(result.error.message);
  return { ok: true };
});
export const pauseSeoRelease = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => z.object({ paused: z.boolean() }).parse(data)).handler(async ({ context, data }) => {
  const result = await context.supabase.from("seo_release_settings").update({ paused: data.paused }).eq("id", true).select("id").single();
  if (result.error) throw new Error(result.error.message);
  return { ok: true };
});