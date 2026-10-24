// Phase H — Notification queue: enqueue + process (WhatsApp / email / SMS / internal).
// Provider-agnostic. Actual WhatsApp send is delegated to whichever provider
// the user later connects — the processor logs "sent" with a placeholder ref
// until a provider secret is configured. Email uses Lovable Emails.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EnqueueInput = z.object({
  channel: z.enum(["whatsapp", "email", "sms", "internal"]),
  template: z.string().max(80).optional(),
  recipient: z.string().min(3).max(200),
  subject: z.string().max(200).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  related_entity: z.string().max(40).optional(),
  related_id: z.string().uuid().optional(),
  scheduled_for: z.string().datetime().optional(),
  max_attempts: z.number().int().min(1).max(10).default(5),
});

export const enqueueNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EnqueueInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("notification_queue").insert({
      channel: data.channel,
      template: data.template ?? null,
      recipient: data.recipient,
      subject: data.subject ?? null,
      payload: data.payload as any,
      related_entity: data.related_entity ?? null,
      related_id: data.related_id ?? null,
      scheduled_for: data.scheduled_for ?? new Date().toISOString(),
      max_attempts: data.max_attempts,
      created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listNotificationQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    channel: z.enum(["whatsapp", "email", "sms", "internal"]).optional(),
    status: z.enum(["queued", "sending", "sent", "failed", "cancelled"]).optional(),
    limit: z.number().int().min(1).max(500).default(100),
  }).parse(i))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("notification_queue").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.channel) q = q.eq("channel", data.channel);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const retryNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notification_queue")
      .update({ status: "queued", attempts: 0, last_error: null, scheduled_for: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notification_queue")
      .update({ status: "cancelled" })
      .eq("id", data.id).in("status", ["queued", "failed"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
