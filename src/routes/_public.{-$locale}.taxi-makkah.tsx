import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Star, Building2, Plane, ArrowRight } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كيف يمكنني حجز تاكسي في مكة؟", a: "يمكنك حجز تاكسي مكة بسهولة عبر واتساب أو الاتصال المباشر. نوفر رحلات داخلية في مكة، وتوصيل للحرم المكي، وخدمات النقل إلى مطار جدة والمدينة المنورة." },
  { q: "ما هي خدمات النقل المتوفرة للمعتمرين؟", a: "نقدم خدمات متكاملة لنقل المعتمرين من مطار جدة إلى فنادق مكة، ورحلات التنقل بين مكة والمدينة المنورة، بالإضافة إلى التوصيل إلى محطة قطار الحرمين." },
  { q: "هل لديكم توصيل من مطار جدة إلى فنادق مكة؟", a: `نعم، نحن متخصصون في النقل من مطار الملك عبدالعزيز بجدة مباشرة إلى جميع فنادق مكة المكرمة بسعر يبدأ من ${getPriceForRoute('apt-jed-to-makkah')} ريال فقط.` },
  { q: "هل السيارات مهيأة للعائلات والمجموعات؟", a: "بالتأكيد، نوفر فانات وسيارات عائلية واسعة ومريحة لضمان راحة وسلامة العائلات خلال زيارتهم لمكة والمشاعر المقدسة." },
];

const FAQ_EN = [
  { q: "How can I book a private taxi for transportation within Makkah?", a: "You can easily book a private Makkah taxi via WhatsApp or a direct call. We provide local hotel pickups, transportation to the Haram, and transfers to nearby locations such as the railway station or local sights." },
  { q: "Do you offer private transfers for Umrah pilgrims?", a: "Yes, our primary focus is serving Umrah pilgrims. We provide dedicated private transportation between Jeddah Airport and Makkah hotels, as well as intercity transfers between Makkah and Madinah." },
  { q: "Can I arrange a taxi to the Haramain High-Speed Railway station in Makkah?", a: "Certainly. We offer reliable pickups and drop-offs at the Makkah Haramain station, ensuring you connect smoothly with your train journey to Madinah or Jeddah." },
  { q: "What should I know about hotel pickups in Makkah?", a: "Our chauffeurs provide door-to-door service. Given the traffic conditions around the Holy Mosque, we coordinate closely with you to ensure a timely pickup from your hotel lobby or a designated nearby point." },
];

export const Route = createFileRoute("/_public/{-$locale}/taxi-makkah")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taxi-makkah`;
    const title = ar 
      ? "تاكسي مكة | توصيل للحرم وفنادق مكة - تاكسي العمرة" 
      : "Makkah Taxi | Private Transfers for Visitors & Pilgrims";
    const description = ar 
      ? "احجز تاكسي مكة للتنقل داخل المدينة أو من مطار جدة. خدمة موثوقة لزوار الحرم والعائلات بأسعار ثابتة. سيارات حديثة وسائقون محترفون." 
      : "Book a private Makkah taxi for hotel transfers, Haram pickups, and pilgrimage transportation. Reliable 24/7 chauffeur service in Makkah for international travelers.";
    
    return {
      meta: [
        { title }, 
        { name: "description", content: description }, 
        { property: "og:title", content: title }, 
        { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { 
          type: "application/ld+json", 
          children: JSON.stringify(breadcrumbJsonLd([
            { name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, 
            { name: ar ? "تاكسي مكة" : "Makkah Taxi", url }
          ])) 
        },
        { 
          type: "application/ld+json", 
          children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) 
        },
        { 
          type: "application/ld+json", 
          children: JSON.stringify(serviceJsonLd({ 
            name: ar ? "تاكسي مكة" : "Makkah Private Taxi Service", 
            description, 
            url, 
            areaServed: "Makkah" 
          })) 
        }
      ]
    };
  },
  component: MakkahTaxiPage,
});

function MakkahTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي مكة" : "Makkah Taxi"}</span>
      </nav>

      <header className="space-y-6 mb-16">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "خدمات النقل في مكة" : "Makkah Private Chauffeur Services"}</span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          {ar 
            ? "تاكسي مكة المكرمة: تنقل بكل روحانية وراحة" 
            : "Makkah Taxi | Private Transfers for Visitors & Pilgrims"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {ar 
            ? "خدمة توصيل مريحة وموثوقة داخل مكة ومن مطار جدة. نوفر أسطولاً مخصصاً لخدمة ضيوف الرحمن والزوار الدوليين على مدار الساعة." 
            : "Navigate the Holy City with ease. We provide professional private transportation in Makkah, catering specifically to the needs of pilgrims and international visitors. From hotel transfers to Haram pickups, we ensure a smooth journey."}
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في مكة" : "I'd like to book a private taxi in Makkah")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "حجز الآن عبر واتساب" : "WhatsApp Booking"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8">
            <a href={telLink()}><Phone className="h-5 w-5 me-2" /> {SITE.phone}</a>
          </Button>
        </div>
      </header>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Building2, t_ar: "نقل الفنادق", t_en: "Hotel & Haram Transfers", d_en: "Reliable transfers between your hotel and the Holy Mosque." },
          { icon: Star, t_ar: "توصيل ضيوف الرحمن", t_en: "Pilgrim Transportation", d_en: "Dedicated service for Umrah and Hajj visitors." },
          { icon: Clock, t_ar: "محطة القطار", t_en: "Railway Station Connection", d_en: "Efficient pickups and drop-offs at Haramain Station." },
          { icon: Plane, t_ar: "مطار جدة ← مكة", t_en: "Jeddah Airport Transfer", d_en: "Direct private pickup from KAIA arrivals.", path: "/jeddah-airport-to-makkah-taxi" },
          { icon: MapPin, t_ar: "مكة ← المدينة", t_en: "Intercity to Madinah", d_en: "Long-distance private transfers between holy cities.", path: "/makkah-to-madinah-taxi" },
          { icon: Car, t_ar: "جولات مخصصة", t_en: "Private City Travel", d_en: "Customized local transportation around Makkah." },
        ].map((s, i) => (
          <div key={i} className="p-6 border rounded-2xl bg-card hover:shadow-md transition-shadow group">
            {s.path ? (
              <Link to={withLocale(locale, s.path)} className="flex flex-col h-full">
                <s.icon className="h-10 w-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-2 group-hover:text-gold transition-colors">{ar ? s.t_ar : s.t_en}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{ar ? "" : s.d_en}</p>
                <div className="mt-auto pt-4 flex items-center text-xs font-medium text-gold">
                  {ar ? "المزيد" : "View Details"} <ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180" />
                </div>
              </Link>
            ) : (
              <div className="flex flex-col h-full">
                <s.icon className="h-10 w-10 text-gold mb-4" />
                <h3 className="font-bold mb-2">{ar ? s.t_ar : s.t_en}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{ar ? "" : s.d_en}</p>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="bg-gold/5 p-8 md:p-12 rounded-3xl border border-gold/10 mb-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-display mb-6">{ar ? "لماذا تختار خدماتنا في مكة؟" : "Why Book Your Makkah Transportation with Us?"}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-gold" /> {ar ? "معرفة تامة بالطرق" : "Local Expertise"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{ar ? "سائقونا على دراية كاملة بمداخل ومخارج المنطقة المركزية المحيطة بالحرم." : "Our drivers navigate Makkah's unique traffic patterns and road closures with ease, ensuring you get as close to your destination as possible."}</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-gold" /> {ar ? "أسعار ثابتة" : "Transparent Pricing"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{ar ? "لا توجد مفاجآت في السعر، كل شيء واضح قبل الحجز." : "Enjoy peace of mind with fixed fares and no hidden charges, regardless of traffic conditions within the city."}</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-gold" /> {ar ? "سيارات مريحة" : "Pilgrim Comfort"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{ar ? "أسطول سيارات حديثة مكيفة وواسعة تناسب العائلات والأمتعة." : "Our vehicles are clean, spacious, and air-conditioned, designed to accommodate families and Umrah luggage comfortably."}</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-gold" /> {ar ? "خدمة متوفرة 24/7" : "Round-the-Clock Support"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{ar ? "نحن معك في أي وقت من اليوم لتأمين تنقلاتك." : "Whether you have an early morning flight or a late-night arrival, our private taxi service in Makkah is always available."}</p>
            </div>
          </div>
        </div>
      </section>

      <CityLongContent page="taxi-makkah" />

      <section className="mb-20">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي مكة" : "Makkah Taxi FAQ"}</h2>
        <div className="space-y-4 max-w-4xl">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold mb-3">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <h2 className="font-display text-3xl md:text-4xl mb-4">{ar ? "ابدأ رحلتك الإيمانية براحة بال" : "Reliable Makkah Private Transportation"}</h2>
        <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
          {ar 
            ? "احجز تاكسي مكة الآن لضمان وصولك الآمن والمريح إلى وجهتك." 
            : "Focus on your pilgrimage while we handle the driving. Book your private Makkah taxi today for professional and respectful service."}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="bg-gold text-primary hover:bg-gold-soft h-14 px-10 text-lg rounded-full">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في مكة" : "I'd like to book a private taxi in Makkah")} target="_blank" rel="noopener">
              <MessageCircle className="h-6 w-6 me-2" /> {ar ? "حجز عبر واتساب" : "WhatsApp Booking"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-white/5 h-14 px-10 text-lg rounded-full">
            <a href={telLink()}>
              <Phone className="h-6 w-6 me-2" /> {SITE.phone}
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
