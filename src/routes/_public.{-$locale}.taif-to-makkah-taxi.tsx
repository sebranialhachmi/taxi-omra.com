import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, MapPin, Clock, Shield, Plane } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كيف أحجز تاكسي من الطائف إلى مكة؟", a: "يمكنك الحجز بسهولة عبر واتساب أو الهاتف. فريقنا متاح على مدار الساعة لتأكيد حجزك وتوفير السيارة فوراً أو في الموعد المحدد." },
  { q: "هل توفرون خدمة التوصيل المباشر للفنادق؟", a: "نعم، خدمة التوصيل لدينا هي من الباب إلى الباب. نستقبلك من أي مكان في الطائف ونوصلك مباشرة إلى باب فندقك في مكة المكرمة." },
  { q: "ما هي أنواع السيارات المتاحة للعودة إلى مكة؟", a: "نوفر مجموعة متنوعة تشمل سيارات السيدان الاقتصادية، وسيارات الدفع الرباعي العائلية، والفانات الكبيرة للمجموعات." },
];

const FAQ_EN = [
  { q: "How can I book a taxi from Taif to Makkah?", a: "Booking is simple via WhatsApp or phone. Our team is available 24/7 to confirm your reservation and provide a vehicle immediately or at your scheduled time." },
  { q: "Do you offer direct hotel drop-off?", a: "Yes, we provide door-to-door service. We pick you up from any location in Taif and drop you off directly at your hotel entrance in Makkah." },
  { q: "What vehicles are available for the return to Makkah?", a: "We offer a wide range of options including economy sedans, family SUVs, and large vans for group transfers." },
];

export const Route = createFileRoute("/_public/{-$locale}/taif-to-makkah-taxi")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taif-to-makkah-taxi`;
    const title = ar 
      ? "تاكسي من الطائف إلى مكة | حجز نقل خاص آمن - تاكسي العمرة" 
      : "Taif to Makkah Taxi | Private Return Transfers";
    const description = ar 
      ? "احجز تاكسي من الطائف إلى مكة المكرمة. خدمة توصيل آمنة وموثوقة، سيارات حديثة وسائقين محترفين لرحلة عودتك من المصيف إلى مكة." 
      : "Book your private Taif to Makkah taxi. Reliable return transfers from the mountains to the Holy City. Professional 24/7 service with modern vehicles.";
    return {
      meta: [
        { title }, { name: "description", content: description }, 
        { property: "og:title", content: title }, { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { name: "keywords", content: ar ? "توصيل من الطائف الى مكة، تاكسي الطائف مكة، حجز سيارة للعودة لمكة" : "Taif to Makkah taxi, Taif to Makkah transfer, taxi from Taif to Makkah, return transfer to Makkah" }
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي الطائف إلى مكة" : "Taif to Makkah Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "توصيل من الطائف إلى مكة" : "Taif to Makkah Taxi", description, url, areaServed: "Makkah" })) }
      ]
    };
  },
  component: TaifToMakkahTaxiPage,
});

function TaifToMakkahTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const price = getPriceForRoute('taif-to-makkah', 'economyPrice', locale as any);

  return (
    <article className="container-tight py-16">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي الطائف إلى مكة" : "Taif to Makkah Taxi"}</span>
      </nav>
      
      <header className="space-y-6 mb-16">
        <h1 className="font-display text-4xl md:text-5xl">{ar ? "تاكسي من الطائف إلى مكة المكرمة" : "Taif to Makkah Private Transfer"}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {ar 
            ? `عد من المصيف براحة وأمان. نوفر لك خدمة توصيل خاصة ومباشرة من الطائف إلى مكة بأسعار تبدأ من ${price}.` 
            : `Return from the mountains in comfort and safety. We provide direct private taxi services from Taif to Makkah starting from ${price}.`}
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg" className="rounded-full h-12 px-8 bg-primary">
            <a href={waLink(ar ? "أرغب بحجز تاكسي من الطائف إلى مكة" : "Book taxi from Taif to Makkah")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز الآن عبر واتساب" : "Book via WhatsApp"}
            </a>
          </Button>
        </div>
      </header>

      <section className="bg-muted rounded-3xl p-8 md:p-12 mb-20 border border-border/40">
        <div className="max-w-3xl space-y-6">
          <h2 className="font-display text-2xl">{ar ? "رحلة العودة بلمسة فاخرة" : "A Premium Return Journey"}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {ar 
              ? "سواء كنت في رحلة سياحية قصيرة أو زيارة طويلة للطائف، نحن نضمن لك وصولاً سلساً إلى مكة المكرمة. سائقونا متواجدون في كافة مناطق الطائف (الهدا، الشفا، وسط المدينة) لخدمتكم." 
              : "Whether you are on a short sightseeing trip or a long visit to Taif, we guarantee a smooth arrival in Makkah. Our drivers are located in all areas of Taif (Al Hada, Ash Shafa, City Center) to serve you."}
          </p>
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl shadow-sm border border-border/30">
              <Shield className="h-6 w-6 text-gold" />
              <span className="text-sm font-semibold">{ar ? "قيادة آمنة ومنضبطة" : "Safe & Disciplined Driving"}</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl shadow-sm border border-border/30">
              <Clock className="h-6 w-6 text-gold" />
              <span className="text-sm font-semibold">{ar ? "دقة متناهية في المواعيد" : "Extreme Punctuality"}</span>
            </div>
          </div>
        </div>
      </section>

      <CityLongContent page="taif-to-makkah-taxi" />
      <section className="mb-16">
        <h2 className="font-display text-2xl mb-8 border-b pb-4">{ar ? "أسئلة الرحلة" : "Journey Details & FAQ"}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {(ar ? FAQ_AR : FAQ_EN).map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-bold mb-3">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm font-medium pt-8 border-t mb-16">
        <span>{ar ? "روابط مفيدة:" : "Useful Links:"}</span>
        <Link to={withLocale(locale, "/makkah-to-taif-taxi")} className="text-gold hover:underline">{ar ? "مكة إلى الطائف" : "Makkah to Taif"}</Link>
        <Link to={withLocale(locale, "/taxi-taif")} className="text-gold hover:underline">{ar ? "تاكسي الطائف" : "Taif Taxi"}</Link>
        <Link to={withLocale(locale, "/taxi-makkah")} className="text-gold hover:underline">{ar ? "تاكسي مكة" : "Makkah Taxi"}</Link>
      </div>
    </article>
  );
}
