// Booking & CRM operations — server functions.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type BookingStatus =
  | "pending" | "confirmed" | "assigned" | "en_route"
  | "on_trip" | "picked_up" | "completed" | "cancelled" | "no_show";

/** Duplicate an existing booking — copies everything except lifecycle timestamps + status. */
export const duplicateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: src, error } = await supabase.from("bookings").select("*").eq("id", data.id).single();
    if (error) throw error;
    const copy: any = { ...src };
    delete copy.id; delete copy.code; delete copy.created_at; delete copy.updated_at;
    delete copy.started_at; delete copy.completed_at; delete copy.confirmed_at; delete copy.assigned_at;
    delete copy.cancelled_by; delete copy.cancellation_reason; delete copy.cancellation_category;
    copy.status = "pending";
    copy.driver_id = null; copy.vehicle_id = null;
    copy.pickup_at = new Date(Date.now() + 24 * 3600_000).toISOString();
    const { data: created, error: e2 } = await supabase.from("bookings").insert(copy).select("id, code").single();
    if (e2) throw e2;
    return created;
  });

/** Bulk status update. */
export const bulkUpdateBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[]; patch: { status?: BookingStatus; is_priority?: boolean; tags?: string[] } }) => d)
  .handler(async ({ data, context }) => {
    if (!data.ids.length) return { updated: 0 };
    const { error } = await context.supabase.from("bookings").update(data.patch as any).in("id", data.ids);
    if (error) throw error;
    return { updated: data.ids.length };
  });

/** Cancel booking with reason + category, log to activity, set cancelled_by. */
export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason: string; category?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("bookings").update({
      status: "cancelled",
      cancellation_reason: data.reason,
      cancellation_category: data.category ?? null,
      cancelled_by: userId,
    } as any).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Add a booking note. */
export const addBookingNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { booking_id: string; body: string; pinned?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("booking_notes").insert({
      booking_id: data.booking_id,
      body: data.body,
      pinned: data.pinned ?? false,
      author_id: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

/** Log a WhatsApp send (called after the deep link opens). */
export const logWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    phone: string; body: string; locale?: "en" | "ar";
    template_code?: string | null;
    booking_id?: string | null; customer_id?: string | null; contact_id?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("whatsapp_messages").insert({
      phone: data.phone,
      body: data.body,
      locale: data.locale ?? "en",
      template_code: data.template_code ?? null,
      booking_id: data.booking_id ?? null,
      customer_id: data.customer_id ?? null,
      contact_id: data.contact_id ?? null,
      sent_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

/** Schedule a booking reminder. */
export const scheduleBookingReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { booking_id: string; remind_at: string; note?: string | null; channel?: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("booking_reminders").insert({
      booking_id: data.booking_id,
      remind_at: data.remind_at,
      note: data.note ?? null,
      channel: data.channel ?? "whatsapp",
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });
