import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Phone } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { submitBookingRequest } from "@/lib/public.functions";

export const Route = createFileRoute("/_public/{-$locale}/booking")({
  head: ({ params }) => {
    const locale = params.locale ?? "en";
    const ar = locale === "ar";
    const title = ar
      ? `احجز رحلتك — ${SITE.brand.ar}`
      : `Book Your Ride — ${SITE.brand.en}`;
    const desc = ar
      ? "احجز تاكسي فاخر خلال دقيقة: مطار جدة، مكة، المدينة. تأكيد سريع عبر واتساب."
      : "Book a premium chauffeur in under a minute — Jeddah Airport, Makkah & Madinah. Instant WhatsApp confirmation.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
      ],
      links: [],
    };
  },
  component: BookingPage,
});

function BookingPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSending(true);
    try {
      await submitBookingRequest({
        data: {
          name: String(form.get("name") || ""),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || ""),
          pickup: String(form.get("pickup") || ""),
          dropoff: String(form.get("dropoff") || ""),
          pickup_at: String(form.get("pickup_at") || ""),
          passengers: form.get("passengers") ? Number(form.get("passengers")) : undefined,
          luggage: form.get("luggage") ? Number(form.get("luggage")) : undefined,
          vehicle: String(form.get("vehicle") || ""),
          notes: String(form.get("notes") || ""),
          page_url: typeof window !== "undefined" ? window.location.href : "",
          locale,
        },
      });
      toast.success(ar ? "تم استلام طلب الحجز" : "Booking request received");
      navigate({ to: withLocale(locale, "/thank-you") });
    } catch (err: any) {
      toast.error(err?.message || (ar ? "تعذر الإرسال" : "Could not send"));
    } finally {
      setSending(false);
    }
  };

  const waPrefill = ar
    ? "مرحباً، أرغب بحجز رحلة. المكان:  \nالوجهة:  \nالوقت:  \nعدد الركاب: "
    : "Hello, I'd like to book a ride.\nPickup: \nDropoff: \nWhen: \nPassengers: ";

  return (
    <section className="container-tight py-16 md:py-24">
      <nav aria-label={ar ? "مسار التنقل" : "Breadcrumb"} className="text-sm text-muted-foreground mb-4">
        <a href={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</a>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-foreground">{ar ? "احجز الآن" : "Book now"}</span>
      </nav>

      <div className="max-w-3xl space-y-5 mb-10">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "احجز رحلتك" : "Book your ride"}</span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight text-balance">
          {ar ? "احجز خلال دقيقة — تأكيد فوري." : "Book in under a minute — instant confirmation."}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {ar
            ? "أرسل تفاصيل رحلتك، وسيتواصل معك موظف الاستقبال عبر واتساب لتأكيد السائق والسعر."
            : "Send us your trip details and our dispatcher will confirm your driver and fare via WhatsApp."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <a href={waLink(waPrefill)} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز عبر واتساب" : "Book on WhatsApp"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <a href={telLink()}>
              <Phone className="h-5 w-5 me-2" /> {SITE.phone}
            </a>
          </Button>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-5 md:grid-cols-2 max-w-3xl">
        <div className="space-y-2">
          <Label htmlFor="name">{ar ? "الاسم" : "Full name"} *</Label>
          <Input id="name" name="name" required minLength={2} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{ar ? "رقم الجوال" : "Phone"} *</Label>
          <Input id="phone" name="phone" type="tel" required minLength={4} maxLength={40} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
          <Input id="email" name="email" type="email" maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pickup">{ar ? "نقطة الانطلاق" : "Pickup location"} *</Label>
          <Input id="pickup" name="pickup" required minLength={2} maxLength={300} placeholder={ar ? "مثال: مطار الملك عبدالعزيز" : "e.g. King Abdulaziz Airport"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dropoff">{ar ? "الوجهة" : "Dropoff location"} *</Label>
          <Input id="dropoff" name="dropoff" required minLength={2} maxLength={300} placeholder={ar ? "مثال: مكة المكرمة" : "e.g. Makkah"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pickup_at">{ar ? "الوقت المفضل" : "Preferred pickup time"}</Label>
          <Input id="pickup_at" name="pickup_at" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle">{ar ? "نوع المركبة" : "Vehicle type"}</Label>
          <select
            id="vehicle"
            name="vehicle"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{ar ? "أي مركبة متاحة" : "Any available"}</option>
            <option value="sedan">{ar ? "سيدان" : "Sedan"}</option>
            <option value="suv">SUV</option>
            <option value="van">{ar ? "فان (٧ ركاب)" : "Van (7 pax)"}</option>
            <option value="business">{ar ? "أعمال" : "Business class"}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="passengers">{ar ? "عدد الركاب" : "Passengers"}</Label>
          <Input id="passengers" name="passengers" type="number" min={1} max={60} defaultValue={1} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="luggage">{ar ? "عدد الحقائب" : "Luggage"}</Label>
          <Input id="luggage" name="luggage" type="number" min={0} max={60} defaultValue={0} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">{ar ? "ملاحظات" : "Notes"}</Label>
          <Textarea id="notes" name="notes" maxLength={2000} rows={4} />
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" size="lg" className="rounded-full" disabled={sending}>
            {sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "أرسل طلب الحجز" : "Send booking request")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {ar ? "بإرسال الطلب فإنك توافق على سياسة الخصوصية." : "By submitting, you agree to our privacy policy."}
          </p>
        </div>
      </form>
    </section>
  );
}
