import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Star, Building2, Plane, ArrowRight, Briefcase } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "هل توفرون استقبال من مطار الملك خالد بالرياض (RUH)؟", a: "نعم، نقدم خدمة الاستقبال بالاسم والتوصيل الاحترافي من وإلى مطار الملك خالد الدولي لجميع أحياء الرياض، الفنادق، ومركز الملك عبدالله المالي." },
  { q: "ما هي مناطق التغطية لتاكسي الرياض؟", a: "نخدم جميع أحياء العاصمة بما في ذلك المناطق التجارية الكبرى (العليا، النخيل، الملقا) والمناطق السياحية مثل الدرعية، بالإضافة إلى الرحلات الطويلة خارج المدينة." },
  { q: "هل لديكم رحلات من الرياض إلى مكة المكرمة؟", a: `نعم، نوفر سيارات حديثة فاخرة ومريحة مخصصة للرحلات الطويلة بين الرياض ومكة المكرمة (بأسعار تبدأ من ${getPriceForRoute('riyadh-makkah') || 'اطلب السعر'}).` },
  { q: "هل تتوفر خدمات النقل لرجال الأعمال في الرياض؟", a: "بالتأكيد، نوفر سيارات فاخرة وسائقين محترفين للتنقل بين الاجتماعات والمؤتمرات داخل مدينة الرياض مع الالتزام التام بالمواعيد." },
];

const FAQ_EN = [
  { q: "Do you provide airport pickups at King Khalid International Airport (RUH)?", a: "Yes, we offer professional meet-and-greet services at King Khalid International Airport. Our chauffeurs will meet you in the arrivals hall and provide a direct transfer to any hotel or office in Riyadh." },
  { q: "Which areas in Riyadh do your taxi services cover?", a: "We cover all major Riyadh districts, including the King Abdullah Financial District (KAFD), Olaya business hub, and residential areas like An Nakheel. We also serve tourist destinations like Diriyah." },
  { q: "Do you offer chauffeur services for business travelers?", a: "Absolutely. We specialize in corporate transportation, providing punctual, professional chauffeurs and premium vehicles for business meetings, conferences, and multi-stop trips across the capital." },
  { q: "Can I book a long-distance transfer from Riyadh to other cities?", a: "Yes, we provide comfortable intercity transfers from Riyadh to major cities, including Makkah and Dammam. Please contact us for a specific quote based on your vehicle preference." },
];

export const Route = createFileRoute("/_public/{-$locale}/taxi-riyadh")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taxi-riyadh`;
    const title = ar 
      ? "تاكسي الرياض | حجز توصيل مطار الرياض والرحلات الطويلة - تاكسي العمرة" 
      : "Riyadh Taxi | Private City & Airport Transfers";
    const description = ar 
      ? "احجز تاكسي الرياض الآن. خدمات توصيل احترافية داخل العاصمة، استقبال من مطار الملك خالد، ورحلات بين المدن بسيارات فاخرة وحديثة." 
      : "Book a private Riyadh taxi for King Khalid Airport (RUH) pickups, KAFD business transfers, and hotel drop-offs. Professional 24/7 private chauffeur service in Riyadh.";
    
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
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي الرياض" : "Riyadh Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "تاكسي الرياض" : "Riyadh Private Taxi Service", description, url, areaServed: "Riyadh" })) }
      ]
    };
  },
  component: RiyadhTaxiPage,
});

function RiyadhTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي الرياض" : "Riyadh Taxi"}</span>
      </nav>

      <header className="space-y-6 mb-16">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "خدمات النقل في الرياض" : "Premium Capital Transportation"}</span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          {ar 
            ? "تاكسي الرياض: تنقل بذكاء ورفاهية في العاصمة" 
            : "Riyadh Taxi | Private City & Airport Transfers"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {ar 
            ? "نوفر لك حلول تنقل متكاملة في مدينة الرياض، من المطار وإلى أي وجهة داخل أو خارج المدينة بسيارات حديثة وسائقين محترفين." 
            : "Experience reliable and professional private transportation in Riyadh. From King Khalid International Airport (RUH) pickups to navigating the business districts of Olaya and KAFD, we provide high-standard chauffeur services for residents and visitors."}
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في الرياض" : "I'd like to book a private taxi in Riyadh")} target="_blank" rel="noopener">
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
          { icon: Plane, t_ar: "مطار الملك خالد", t_en: "RUH Airport Transfer", d_en: "Reliable meet-and-greet service at Riyadh International Airport." },
          { icon: Briefcase, t_ar: "نقل لرجال الأعمال", t_en: "Business Chauffeur", d_en: "Professional transport for meetings and financial districts." },
          { icon: Building2, t_ar: "أحياء الرياض", t_en: "City-Wide Pickup", d_en: "Door-to-door service across all major Riyadh districts." },
          { icon: Star, t_ar: "خدمة كبار الشخصيات", t_en: "VIP Travel", d_en: "Premium vehicles and high-end service for a luxury experience." },
          { icon: Clock, t_ar: "متاح 24/7", t_en: "Available 24/7", d_en: "Ready to serve you anytime in the bustling capital." },
          { icon: MapPin, t_ar: "رحلات بين المدن", t_en: "Intercity Transfers", d_en: "Private long-distance trips to Makkah, Dammam, and more." },
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

      <CityLongContent page="taxi-riyadh" />

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي الرياض" : "Riyadh Taxi FAQ"}</h2>
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
