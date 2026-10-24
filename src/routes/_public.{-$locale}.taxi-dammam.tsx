import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Star, Building2, Plane, ArrowRight, Anchor } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "هل توفرون خدمة التوصيل لمطار الملك فهد بالدمام (DMM)؟", a: "نعم، نقدم خدمة التوصيل والاستقبال الاحترافي من وإلى مطار الملك فهد الدولي لجميع مدن المنطقة الشرقية (الدمام، الخبر، الظهران، الجبيل)." },
  { q: "ما هي مناطق الخدمة في المنطقة الشرقية؟", a: "نخدم مدينة الدمام بالكامل، بالإضافة إلى الخبر، الظهران، الجبيل، والقطيف، مع توفير رحلات خاصة للمطار ورحلات بين المدن." },
  { q: "هل تتوفر رحلات من الدمام إلى مكة والمدينة؟", a: `نعم، نوفر خدمة الرحلات الطويلة من المنطقة الشرقية إلى مكة المكرمة والمدينة المنورة (بأسعار تبدأ من ${getPriceForRoute('dammam-makkah') || 'اطلب السعر'}).` },
  { q: "كيف يمكنني حجز تاكسي في الدمام أو الخبر؟", a: "يمكنك الحجز فوراً عبر واتساب أو الاتصال الهاتفي. فريقنا متاح على مدار الساعة لتأمين رحلتك في أسرع وقت ممكن." },
];

const FAQ_EN = [
  { q: "Do you provide airport transfers at King Fahd International Airport (DMM)?", a: "Yes, we offer professional meet-and-greet and private transfer services at DMM airport, covering Dammam, Khobar, Dhahran, and Jubail." },
  { q: "Which areas in the Eastern Province do your chauffeur services cover?", a: "Our team serves the entire city of Dammam as well as neighboring hubs like Khobar and Dhahran. We also provide long-distance transfers across the Eastern Province." },
  { q: "How can I book a private taxi in Dammam or Khobar?", a: "You can book your ride instantly via WhatsApp or a direct phone call. We offer 24/7 support to ensure your transportation is secured when you need it." },
  { q: "Do you offer intercity transfers from Dammam to other regions?", a: "Yes, we provide comfortable private transfers from Dammam to other major Saudi cities, including Riyadh and the Holy Cities of Makkah and Madinah." },
];

export const Route = createFileRoute("/_public/{-$locale}/taxi-dammam")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taxi-dammam`;
    const title = ar 
      ? "تاكسي الدمام | توصيل مطار الملك فهد والمنطقة الشرقية - تاكسي العمرة" 
      : "Dammam Taxi | Private Taxi & Transfers";
    const description = ar 
      ? "احجز تاكسي الدمام الآن. خدمة موثوقة في المنطقة الشرقية، توصيل من مطار الملك فهد، ورحلات لجميع مناطق المملكة بأسعار ثابتة." 
      : "Book a private Dammam taxi for King Fahd Airport (DMM) transfers, Khobar hotel pickups, and Eastern Province travel. Professional 24/7 private chauffeur service.";
    
    return {
      meta: [
        { title }, 
        { name: "description", content: description }, 
        { property: "og:title", content: title }, 
        { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي الدمام" : "Dammam Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "تاكسي الدمام" : "Dammam Private Taxi Service", description, url, areaServed: "Dammam" })) }
      ]
    };
  },
  component: DammamTaxiPage,
});

function DammamTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي الدمام" : "Dammam Taxi"}</span>
      </nav>

      <header className="space-y-6 mb-16">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "خدمات النقل في المنطقة الشرقية" : "Eastern Province Private Transportation"}</span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          {ar 
            ? "تاكسي الدمام: خيارك الموثوق في المنطقة الشرقية" 
            : "Dammam Taxi | Private Taxi & Transfers"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {ar 
            ? "خدمات توصيل متميزة في مدينة الدمام، الخبر، والظهران. نوفر استقبالاً احترافياً من المطار وتوصيلاً آمناً لكل وجهاتكم." 
            : "Experience premium private transportation in Dammam and the wider Eastern Province. We provide specialized transfer services from King Fahd International Airport (DMM) to Khobar, Dhahran, and all major destinations in the region."}
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في الدمام" : "I'd like to book a private taxi in Dammam")} target="_blank" rel="noopener">
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
          { icon: Plane, t_ar: "مطار الملك فهد", t_en: "DMM Airport Pickup", d_en: "Official meet-and-greet service at Dammam International Airport." },
          { icon: Building2, t_ar: "المنطقة الشرقية", t_en: "Regional Coverage", d_en: "Comprehensive service in Dammam, Khobar, and Dhahran." },
          { icon: Clock, t_ar: "متاح 24/7", t_en: "24/7 Availability", d_en: "Reliable transportation any time of the day or night." },
          { icon: Shield, t_ar: "أمان وموثوقية", t_en: "Safe & Reliable", d_en: "Vetted chauffeurs and well-maintained modern vehicles." },
          { icon: Star, t_ar: "خدمة متميزة", t_en: "Premium Service", d_en: "A professional travel experience for business and leisure." },
          { icon: MapPin, t_ar: "رحلات بين المدن", t_en: "Intercity Transfers", d_en: "Private transfers from the East to Riyadh and beyond." },
        ].map((s, i) => (
          <div key={i} className="p-6 border rounded-2xl bg-card hover:shadow-md transition-shadow">
            <div className="flex flex-col h-full">
              <s.icon className="h-10 w-10 text-gold mb-4" />
              <h3 className="font-bold mb-2">{ar ? s.t_ar : s.t_en}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{ar ? "" : s.d_en}</p>
            </div>
          </div>
        ))}
      </section>

      <CityLongContent page="taxi-dammam" />

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي الدمام" : "Dammam Taxi FAQ"}</h2>
        <div className="space-y-4 max-w-4xl">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
