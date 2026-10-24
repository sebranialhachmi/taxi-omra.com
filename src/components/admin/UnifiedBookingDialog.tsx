import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, User, Loader2, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const CATEGORY_LABEL_AR: Record<string, string> = {
  economy: "اقتصادي", standard: "قياسي", business: "أعمال", premium: "بريميوم",
  suv: "دفع رباعي", family_suv: "دفع رباعي عائلي", luxury_van: "فان فاخر", van: "فان", vip: "VIP",
};
const catLabel = (code: string, ar: boolean) => ar ? (CATEGORY_LABEL_AR[code] ?? code) : code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const BOOKING_STATUSES = ["pending", "confirmed", "assigned", "en_route", "on_trip", "completed", "cancelled", "no_show"] as const;
const STATUS_AR: Record<string, string> = { pending: "قيد الانتظار", confirmed: "مؤكد", assigned: "مُعيَّن", en_route: "في الطريق", on_trip: "في رحلة", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر" };
const PAY_METHODS = ["cash", "card", "bank_transfer", "wallet", "corporate"] as const;
const PAY_AR: Record<string, string> = { cash: "نقدي", card: "بطاقة", bank_transfer: "تحويل بنكي", wallet: "محفظة", corporate: "شركات" };

const normPhone = (p: string) => (p || "").replace(/\s+/g, "").trim();

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** If provided, customer is locked (from customer profile). */
  initialCustomer?: { id: string; full_name: string; phone: string | null; whatsapp?: string | null; email?: string | null } | null;
  onCreated?: (payload: { customerId: string; bookingId: string }) => void;
};

export function UnifiedBookingDialog({ open, onOpenChange, initialCustomer, onCreated }: Props) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();

  // Modes: 'search' -> 'existing' (booking-only) OR 'new' (customer+booking)
  const [mode, setMode] = useState<"search" | "new" | "existing">(initialCustomer ? "existing" : "search");
  const [existing, setExisting] = useState<any | null>(initialCustomer ?? null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialCustomer) { setMode("existing"); setExisting(initialCustomer); }
      else { setMode("search"); setExisting(null); setQuery(""); }
      resetForm();
    }
  }, [open, initialCustomer?.id]);

  // Search matches (debounced by simple trim length)
  const matches = useQuery({
    queryKey: ["customer-search", query],
    enabled: open && mode === "search" && query.trim().length >= 2,
    queryFn: async () => {
      const s = query.trim();
      const like = `%${s}%`;
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone, whatsapp, email, tier, total_trips, total_spent")
        .or(`full_name.ilike.${like},phone.ilike.${like},whatsapp.ilike.${like},email.ilike.${like}`)
        .order("last_booking_at", { ascending: false, nullsFirst: false })
        .limit(8);
      return data ?? [];
    },
  });

  // Lookups
  const cats = useQuery({ queryKey: ["cats-active"], queryFn: async () => (await supabase.from("vehicle_categories").select("id, code").eq("is_active", true).order("sort_order")).data ?? [] });
  const vehicles = useQuery({ queryKey: ["vehicles-active"], queryFn: async () => (await supabase.from("vehicles").select("id, plate_number, make, model, category_id").order("plate_number")).data ?? [] });

  // Customer form (used only in 'new' mode)
  const [cust, setCust] = useState({
    full_name: "", phone: "", whatsapp: "", email: "",
    country: "", city: "", preferred_language: ar ? "ar" : "en", notes: "",
  });

  // Booking form
  const [bk, setBk] = useState({
    service: "airport_transfer",
    pickup_city: "", dropoff_location: "", airport: "",
    pickup_at_date: "", pickup_at_time: "",
    category_id: "", vehicle_id: "",
    passengers: "1", luggage: "0",
    price: "",
    payment_method: "cash",
    status: "pending" as (typeof BOOKING_STATUSES)[number],
    notes: "",
  });

  function resetForm() {
    setCust({ full_name: "", phone: "", whatsapp: "", email: "", country: "", city: "", preferred_language: ar ? "ar" : "en", notes: "" });
    setBk({ service: "airport_transfer", pickup_city: "", dropoff_location: "", airport: "", pickup_at_date: "", pickup_at_time: "", category_id: "", vehicle_id: "", passengers: "1", luggage: "0", price: "", payment_method: "cash", status: "pending", notes: "" });
  }

  const pickupISO = useMemo(() => {
    if (!bk.pickup_at_date) return null;
    const t = bk.pickup_at_time || "12:00";
    const dt = new Date(`${bk.pickup_at_date}T${t}`);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }, [bk.pickup_at_date, bk.pickup_at_time]);

  const canSave = useMemo(() => {
    // booking mandatory
    if (!bk.pickup_city.trim() || !bk.dropoff_location.trim() || !pickupISO || !bk.price) return false;
    if (mode === "new") return !!cust.full_name.trim() && !!normPhone(cust.phone);
    if (mode === "existing") return !!existing?.id;
    return false;
  }, [mode, existing, cust, bk, pickupISO]);

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      let customerId = existing?.id as string | undefined;

      // NEW customer flow: upsert by phone (case-insensitive) to guarantee no duplicate.
      if (mode === "new") {
        const phone = normPhone(cust.phone);
        // Check if phone already exists
        const { data: found } = await supabase
          .from("customers").select("id, full_name")
          .ilike("phone", phone).limit(1).maybeSingle();
        if (found?.id) {
          toast.message(ar ? `العميل موجود مسبقاً (${found.full_name}) — سيتم ربط الحجز به.` : `Customer already exists (${found.full_name}) — booking will be linked to them.`);
          customerId = found.id;
        } else {
          const payload: any = {
            full_name: cust.full_name.trim(),
            phone,
            whatsapp: cust.whatsapp ? normPhone(cust.whatsapp) : null,
            email: cust.email || null,
            country: cust.country || null,
            city: cust.city || null,
            preferred_language: cust.preferred_language || null,
            notes: cust.notes || null,
            tier: "regular",
          };
          const { data, error } = await supabase.from("customers").insert(payload).select("id").single();
          if (error) throw error;
          customerId = data.id;
        }
      }

      if (!customerId) throw new Error("No customer");

      // Build booking notes with the extra "service / airport / passengers / luggage / payment" info.
      const extras: string[] = [];
      if (bk.service) extras.push(`${ar ? "الخدمة" : "Service"}: ${bk.service}`);
      if (bk.airport) extras.push(`${ar ? "المطار" : "Airport"}: ${bk.airport}`);
      if (bk.passengers) extras.push(`${ar ? "الركاب" : "Passengers"}: ${bk.passengers}`);
      if (bk.luggage) extras.push(`${ar ? "الحقائب" : "Luggage"}: ${bk.luggage}`);
      if (bk.payment_method) extras.push(`${ar ? "الدفع" : "Payment"}: ${bk.payment_method}`);
      const combinedNotes = [extras.join(" · "), bk.notes].filter(Boolean).join("\n");

      const price = Number(bk.price) || 0;
      const bookingPayload: any = {
        customer_id: customerId,
        pickup_location: bk.pickup_city.trim(),
        dropoff_location: bk.dropoff_location.trim(),
        pickup_at: pickupISO,
        category_id: bk.category_id || null,
        vehicle_id: bk.vehicle_id || null,
        base_fare: 0, distance_fare: 0, time_fare: 0, waiting_fare: 0,
        night_surcharge: 0, airport_fee: 0, discount: 0,
        total_fare: price,
        status: bk.status,
        source: "internal",
        notes: combinedNotes || null,
        tags: bk.service ? [bk.service] : [],
      };
      const { data: booking, error: bErr } = await supabase.from("bookings").insert(bookingPayload).select("id").single();
      if (bErr) throw bErr;

      toast.success(ar ? "تم الحفظ" : "Saved");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
      qc.invalidateQueries({ queryKey: ["customer-bookings", customerId] });
      onCreated?.({ customerId, bookingId: booking.id });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "existing"
              ? (ar ? "حجز جديد للعميل" : "New booking for customer")
              : (ar ? "عميل جديد + أول حجز" : "New customer + first booking")}
          </DialogTitle>
        </DialogHeader>

        {/* STEP: SEARCH */}
        {mode === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ar ? "ابحث بالهاتف، الواتساب، أو الاسم…" : "Search by phone, WhatsApp, or name…"}
                className="ps-9"
              />
            </div>
            <div className="rounded-lg border divide-y">
              {matches.isFetching && <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ البحث…" : "Searching…"}</div>}
              {!matches.isFetching && query.trim().length >= 2 && (matches.data ?? []).length === 0 && (
                <div className="p-3 text-sm text-muted-foreground">{ar ? "لا يوجد عميل مطابق." : "No matching customer."}</div>
              )}
              {(matches.data ?? []).map((c: any) => (
                <button key={c.id} onClick={() => { setExisting(c); setMode("existing"); }}
                        className="w-full text-start p-3 hover:bg-muted/40 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{c.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.phone ?? "—"} · {c.email ?? ""}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{c.tier}</Badge>
                    <span className="text-xs text-muted-foreground">{c.total_trips ?? 0} {ar ? "رحلة" : "trips"}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-muted-foreground">
                {ar ? "لا يوجد؟ أنشئ عميلاً جديداً واحجز في نفس الخطوة." : "Not there? Create a new customer and book in one step."}
              </div>
              <Button variant="outline" onClick={() => { setMode("new"); setCust((p) => ({ ...p, full_name: query })); }}>
                <UserPlus className="h-4 w-4 me-2" />{ar ? "عميل جديد" : "New customer"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP: FORM (new or existing) */}
        {mode !== "search" && (
          <div className="space-y-6">
            {/* Section 1 — Customer */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {ar ? "١ · معلومات العميل" : "1 · Customer information"}
                </h3>
                {!initialCustomer && (
                  <Button variant="ghost" size="sm" onClick={() => { setMode("search"); setExisting(null); }}>
                    {ar ? "تغيير" : "Change"}
                  </Button>
                )}
              </div>

              {mode === "existing" && existing && (
                <div className="rounded-lg border p-3 bg-muted/30 flex items-center gap-3">
                  <Check className="h-4 w-4 text-success" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{existing.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{existing.phone ?? "—"} · {existing.email ?? ""}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ar ? "التعديل يتم من ملف العميل" : "Edit from the customer profile"}
                  </div>
                </div>
              )}

              {mode === "new" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><Label>{ar ? "الاسم الكامل" : "Full name"} *</Label>
                    <Input value={cust.full_name} onChange={(e) => setCust({ ...cust, full_name: e.target.value })} /></div>
                  <div><Label>{ar ? "الهاتف" : "Phone"} *</Label>
                    <Input value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} placeholder="+9665…" /></div>
                  <div><Label>{ar ? "واتساب" : "WhatsApp"}</Label>
                    <Input value={cust.whatsapp} onChange={(e) => setCust({ ...cust, whatsapp: e.target.value })} placeholder="+9665…" /></div>
                  <div><Label>{ar ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input type="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} /></div>
                  <div><Label>{ar ? "الدولة" : "Country"}</Label>
                    <Input value={cust.country} onChange={(e) => setCust({ ...cust, country: e.target.value })} /></div>
                  <div><Label>{ar ? "المدينة" : "City"}</Label>
                    <Input value={cust.city} onChange={(e) => setCust({ ...cust, city: e.target.value })} /></div>
                  <div>
                    <Label>{ar ? "اللغة المفضلة" : "Preferred language"}</Label>
                    <Select value={cust.preferred_language} onValueChange={(v) => setCust({ ...cust, preferred_language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2"><Label>{ar ? "ملاحظات عن العميل" : "Customer notes"}</Label>
                    <Textarea rows={2} value={cust.notes} onChange={(e) => setCust({ ...cust, notes: e.target.value })} /></div>
                </div>
              )}
            </section>

            {/* Section 2 — First Booking */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {mode === "existing" ? (ar ? "٢ · حجز جديد" : "2 · New booking") : (ar ? "٢ · أول حجز" : "2 · First booking")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>{ar ? "الخدمة" : "Service"}</Label>
                  <Select value={bk.service} onValueChange={(v) => setBk({ ...bk, service: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airport_transfer">{ar ? "توصيل مطار" : "Airport transfer"}</SelectItem>
                      <SelectItem value="city_ride">{ar ? "توصيل داخل المدينة" : "City ride"}</SelectItem>
                      <SelectItem value="hourly">{ar ? "بالساعة" : "Hourly"}</SelectItem>
                      <SelectItem value="intercity">{ar ? "بين المدن" : "Intercity"}</SelectItem>
                      <SelectItem value="umrah">{ar ? "عمرة" : "Umrah"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{ar ? "المطار" : "Airport"}</Label>
                  <Input value={bk.airport} onChange={(e) => setBk({ ...bk, airport: e.target.value })} placeholder={ar ? "مطار جدة" : "e.g. JED"} />
                </div>
                <div><Label>{ar ? "مدينة الانطلاق / موقع الاستلام" : "Pickup city / location"} *</Label>
                  <Input value={bk.pickup_city} onChange={(e) => setBk({ ...bk, pickup_city: e.target.value })} /></div>
                <div><Label>{ar ? "الوجهة" : "Destination"} *</Label>
                  <Input value={bk.dropoff_location} onChange={(e) => setBk({ ...bk, dropoff_location: e.target.value })} /></div>
                <div><Label>{ar ? "تاريخ الاستلام" : "Pickup date"} *</Label>
                  <Input type="date" value={bk.pickup_at_date} onChange={(e) => setBk({ ...bk, pickup_at_date: e.target.value })} /></div>
                <div><Label>{ar ? "وقت الاستلام" : "Pickup time"}</Label>
                  <Input type="time" value={bk.pickup_at_time} onChange={(e) => setBk({ ...bk, pickup_at_time: e.target.value })} /></div>
                <div>
                  <Label>{ar ? "المركبة / الفئة" : "Vehicle category"}</Label>
                  <Select value={bk.category_id} onValueChange={(v) => setBk({ ...bk, category_id: v, vehicle_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{(cats.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{catLabel(c.code, ar)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{ar ? "مركبة محددة (اختياري)" : "Specific vehicle (optional)"}</Label>
                  <Select value={bk.vehicle_id} onValueChange={(v) => setBk({ ...bk, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {(vehicles.data ?? [])
                        .filter((v: any) => !bk.category_id || v.category_id === bk.category_id)
                        .map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{ar ? "عدد الركاب" : "Passengers"}</Label>
                  <Input type="number" min="1" value={bk.passengers} onChange={(e) => setBk({ ...bk, passengers: e.target.value })} /></div>
                <div><Label>{ar ? "عدد الحقائب" : "Luggage"}</Label>
                  <Input type="number" min="0" value={bk.luggage} onChange={(e) => setBk({ ...bk, luggage: e.target.value })} /></div>
                <div><Label>{ar ? "السعر" : "Price"} *</Label>
                  <Input type="number" step="0.01" value={bk.price} onChange={(e) => setBk({ ...bk, price: e.target.value })} placeholder="0.00" /></div>
                <div>
                  <Label>{ar ? "طريقة الدفع" : "Payment method"}</Label>
                  <Select value={bk.payment_method} onValueChange={(v) => setBk({ ...bk, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_METHODS.map((m) => <SelectItem key={m} value={m}>{ar ? PAY_AR[m] : m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{ar ? "حالة الحجز" : "Booking status"}</Label>
                  <Select value={bk.status} onValueChange={(v) => setBk({ ...bk, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{ar ? STATUS_AR[s] : s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>{ar ? "ملاحظات الحجز" : "Booking notes"}</Label>
                  <Textarea rows={2} value={bk.notes} onChange={(e) => setBk({ ...bk, notes: e.target.value })} /></div>
              </div>
            </section>
          </div>
        )}

        {mode !== "search" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button disabled={!canSave || saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {ar ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
