import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, MessageCircle, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { submitContact } from "@/lib/public.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/{-$locale}/contact")({
  head: ({ params }) => {
    const isAr = (params?.locale ?? "ar") === "ar";
    const title = isAr
      ? `تواصل معنا — احجز سائقك ٢٤/٧ | ${SITE.brand.ar}`
      : `Contact — Book Your Chauffeur 24/7 | ${SITE.brand.en}`;
    const description = isAr
      ? "تواصل مع فريق الحجز عبر واتساب أو الاتصال أو البريد. متاحون على مدار الساعة لتوصيلك من مطار جدة إلى مكة والمدينة."
      : "Reach our dispatch desk via WhatsApp, phone or email. Available 24/7 for Jeddah airport transfers to Makkah and Madinah.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: [],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "LocalBusiness",
          name: isAr ? SITE.brand.ar : SITE.brand.en,
          telephone: SITE.phone, email: SITE.email,
          address: { "@type": "PostalAddress", addressLocality: SITE.city, addressCountry: SITE.country },
          geo: { "@type": "GeoCoordinates", latitude: SITE.latitude, longitude: SITE.longitude },
          openingHours: "Mo-Su 00:00-23:59",
          contactPoint: [{ "@type": "ContactPoint", telephone: SITE.phone, contactType: "reservations", availableLanguage: ["ar","en"] }],
        }),
      }],
    };
  },
  component: Contact,
});

function Contact() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [sending, setSending] = useState(false);
  const channels = [
    { icon: MessageCircle, title: "WhatsApp", value: "+" + SITE.whatsapp, href: waLink(), cta: ar ? "افتح واتساب" : "Open WhatsApp", featured: true },
    { icon: Phone, title: ar ? "الاتصال" : "Phone", value: SITE.phone, href: telLink(), cta: ar ? "اتصل الآن" : "Call now" },
    { icon: Mail, title: ar ? "البريد" : "Email", value: SITE.email, href: `mailto:${SITE.email}`, cta: ar ? "أرسل بريداً" : "Send email" },
  ];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setSending(true);
    try {
      await submitContact({
        data: {
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          message: String(form.get("message") || ""),
          page_url: typeof window !== "undefined" ? window.location.href : "",
        },
      });
      toast.success(ar ? "استلمنا رسالتك — سنعاود التواصل قريباً" : "Message received — we'll be in touch shortly");
      formEl.reset();
    } catch (err: any) {
      toast.error(err?.message || (ar ? "تعذر الإرسال" : "Could not send"));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="container-tight py-16 md:py-24">
        <div className="max-w-3xl space-y-5 mb-14">
          <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "تواصل معنا" : "Contact"}</span>
          <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
            {ar ? "فريقنا في خدمتك، على مدار الساعة." : "Our team is at your service, around the clock."}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            {ar ? "اختر الطريقة الأنسب لك للتواصل. متوسط زمن الرد أقل من دقيقة." : "Pick whichever channel suits you — average response time is under a minute."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            {channels.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target="_blank"
                rel="noopener"
                className={`hover-lift group flex items-center gap-5 rounded-2xl border p-5 ${c.featured ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}
              >
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${c.featured ? "bg-gold text-primary" : "bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-primary transition-colors"}`}>
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[10px] uppercase tracking-[0.22em] ${c.featured ? "text-gold" : "text-muted-foreground"}`}>{c.title}</div>
                  <div className={`font-display text-xl mt-0.5 truncate ${c.featured ? "" : ""}`}>{c.value}</div>
                  <div className={`text-xs mt-1 ${c.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{c.cta}</div>
                </div>
                <ArrowRight className="h-4 w-4 rtl:rotate-180 shrink-0" />
              </a>
            ))}

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <Clock className="h-5 w-5 text-gold mb-3" />
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "ساعات العمل" : "Hours"}</div>
                <div className="font-display text-lg mt-1">{SITE.hours[locale]}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <MapPin className="h-5 w-5 text-gold mb-3" />
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الموقع" : "Location"}</div>
                <div className="font-display text-lg mt-1">{SITE.address[locale]}</div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5">
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-[0.22em] text-gold">{ar ? "اترك رسالة" : "Leave a message"}</div>
              <h2 className="font-display text-3xl">{ar ? "سنعاود التواصل معك" : "We'll get back to you"}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{ar ? "الاسم" : "Name"}</Label>
                <Input id="name" name="name" required placeholder={ar ? "اسمك الكامل" : "Your full name"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{ar ? "البريد" : "Email"}</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{ar ? "الهاتف" : "Phone"}</Label>
              <Input id="phone" name="phone" placeholder={SITE.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{ar ? "كيف يمكننا مساعدتك؟" : "How can we help?"}</Label>
              <Textarea id="message" name="message" required rows={5} placeholder={ar ? "تفاصيل رحلتك..." : "Tell us about your trip…"} />
            </div>
            <Button type="submit" size="lg" disabled={sending} className="rounded-full w-full sm:w-auto h-12 px-6">
              <MessageCircle className="h-5 w-5 me-2" /> {sending ? (ar ? "جاري الإرسال..." : "Sending…") : (ar ? "إرسال الرسالة" : "Send message")}
            </Button>
            <p className="text-xs text-muted-foreground">{ar ? "نستقبل رسالتك في مركز خدمة العملاء ونرد خلال دقائق." : "Your message reaches our dispatch desk — expect a reply within minutes."}</p>
          </form>
        </div>
      </section>
    </>
  );
}
