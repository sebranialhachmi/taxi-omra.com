import { createFileRoute } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { Plane, MessageCircle, Phone, Clock, Luggage, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { serviceJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/_public/{-$locale}/airport-transfers")({
  head: ({ params }) => {
    const ar = (params.locale ?? "ar") === "ar";
    const title = ar
      ? `توصيل مطار جدة — تاكسي إلى مكة والمدينة مع استقبال في الصالة | ${SITE.brand.ar}`
      : `Jeddah Airport Transfers — Taxi to Makkah & Madinah with Meet & Greet | ${SITE.brand.en}`;
    const description = ar
      ? "استقبال شخصي في صالة الوصول بمطار الملك عبدالعزيز، متابعة الرحلة، أسعار ثابتة، وانتظار مجاني حتى ٦٠ دقيقة. متاح ٢٤ ساعة."
      : "Meet-and-greet at Jeddah King Abdulaziz Airport arrivals hall, live flight tracking, fixed fares, and up to 60 minutes of complimentary wait. Available 24/7.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "keywords", content: ar
          ? "تاكسي مطار جدة, توصيل من مطار جدة إلى مكة, تاكسي العمرة, نقل المطار, سائق خاص جدة"
          : "Jeddah airport taxi, Jeddah to Makkah transfer, Umrah taxi, airport chauffeur, KAIA airport transfer" },
      ],
      links: [],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({
          name: ar ? "توصيل من مطار جدة إلى مكة" : "Jeddah Airport to Makkah Transfer",
          description,
          url: `${SITE.url}/${ar ? "ar" : "en"}/airport-transfers`,
        })) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([
          { name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${ar ? "ar" : "en"}` },
          { name: ar ? "الخدمات" : "Services", url: `${SITE.url}/${ar ? "ar" : "en"}/services` },
          { name: ar ? "نقل المطار" : "Airport Transfers", url: `${SITE.url}/${ar ? "ar" : "en"}/airport-transfers` },
        ])) },
      ],
    };
  },
  component: AirportTransfers,
});

function AirportTransfers() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const perks = [
    { icon: Clock, t: ar ? "متابعة رحلتك" : "Flight tracking", d: ar ? "نتابع موعد وصولك ونعدّل الالتقاط تلقائياً." : "We track your flight and adjust pickup automatically." },
    { icon: Luggage, t: ar ? "استقبال شخصي" : "Meet & greet", d: ar ? "السائق ينتظرك في القاعة بلوحة اسمك." : "Your chauffeur waits in arrivals with a name board." },
    { icon: ShieldCheck, t: ar ? "أسعار ثابتة" : "Fixed fares", d: ar ? "لا رسوم مفاجئة، السعر متفق عليه مسبقاً." : "No surprises — price agreed before you land." },
  ];
  return (
    <>
      <CityLongContent page="airport-transfers" />
      <section className="container-tight py-16 md:py-24">
        <div className="max-w-3xl space-y-5">
          <span className="eyebrow"><span className="h-px w-8 bg-gold" /><Plane className="h-3 w-3" />{ar ? "نقل المطار" : "Airport Transfers"}</span>
          <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
            {ar ? "من المطار إلى وجهتك، بدون توتر." : "From the airport to your door — effortlessly."}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            {ar
              ? "نراقب رحلتك، نستقبلك في القاعة، ونوصلك بسيارة تنفيذية أنيقة. زمن الانتظار المجاني حتى ٦٠ دقيقة."
              : "We monitor your flight, greet you in arrivals, and drive you in an executive vehicle. Up to 60 minutes complimentary wait time."}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="rounded-full h-12 px-6 bg-primary">
              <a href={waLink(ar ? "أرغب بحجز نقل مطار" : "I'd like to book an airport transfer")} target="_blank" rel="noopener">
                <MessageCircle className="h-5 w-5 me-2" />{ar ? "احجز عبر واتساب" : "Book via WhatsApp"}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6">
              <a href={telLink()}><Phone className="h-5 w-5 me-2" />{SITE.phone}</a>
            </Button>
          </div>
        </div>
        <div className="grid gap-6 mt-16 md:grid-cols-3">
          {perks.map((p) => (
            <div key={p.t} className="hover-lift rounded-2xl border border-border bg-card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold mb-4"><p.icon className="h-5 w-5" /></div>
              <div className="font-display text-xl">{p.t}</div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
