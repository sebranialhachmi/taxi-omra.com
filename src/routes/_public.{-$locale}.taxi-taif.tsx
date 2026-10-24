import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Star, Mountain, Plane, ArrowRight } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "هل توفرون توصيل من جدة أو مكة إلى الطائف؟", a: `نعم، نحن متخصصون في تقديم خدمة التوصيل المباشر من مطار الملك عبدالعزيز بجدة ومن فنادق مكة المكرمة إلى جميع مناطق الطائف بسعر يبدأ من ${getPriceForRoute('apt-jed-to-taif', 'economyPrice', 'ar')}.` },
  { q: "هل تتوفر سيارات للرحلات السياحية في الطائف؟", a: "بالتأكيد، لدينا سائقون محترفون على دراية كاملة بأجمل المواقع السياحية والمنتزهات في الطائف مثل جبل دكا ومنتزه الردف لضمان جولة سياحية ممتعة." },
  { q: "ما هي أنواع السيارات المتاحة لرحلات الطائف؟", a: "نوفر سيارات سيدان مريحة، وسيارات دفع رباعي عائلية واسعة تناسب طبيعة الطرق الجبلية في الطائف، بالإضافة إلى فانات للمجموعات الكبيرة." },
  { q: "هل يمكن حجز استقبال من مطار الطائف الدولي؟", a: "نعم، نوفر خدمة الاستقبال والتوصيل من وإلى مطار الطائف الدولي لجميع الوجهات المحلية والمدن المجاورة." },
];

const FAQ_EN = [
  { q: "Do you offer private transfers from Jeddah or Makkah to Taif?", a: `Yes, we specialize in direct transfer services from KAIA airport in Jeddah and Makkah hotels to all areas of Taif (from ${getPriceForRoute('apt-jed-to-taif', 'economyPrice', 'en')}).` },
  { q: "Are vehicles available for private sightseeing tours in Taif?", a: "Certainly. Our professional drivers are well-versed in Taif's beautiful tourist sites and parks, such as Jabal Daka and Arruddaf Park, ensuring an enjoyable experience." },
  { q: "What types of vehicles can I book for my trip to Taif?", a: "We provide comfortable sedans for individuals and spacious SUVs or vans for families and larger groups, all suitable for Taif's mountain roads." },
  { q: "Can I book a private pickup from Taif International Airport (TIF)?", a: "Yes, we provide meet-and-greet and private transfer services to and from Taif International Airport for all local destinations." },
];

export const Route = createFileRoute("/_public/{-$locale}/taxi-taif")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taxi-taif`;
    const title = ar ? "تاكسي الطائف | توصيل من مطار جدة ومكة للطائف - تاكسي العمرة" : "Taif Taxi | Private Transfers from Jeddah & Makkah";
    const description = ar ? "احجز تاكسي الطائف الآن. رحلات عائلية وسياحية مريحة، توصيل من مطار جدة ومكة المكرمة إلى الطائف بأسعار ثابتة وأمان تام." : "Private taxi service for Taif. Reliable transfers from Jeddah Airport, Makkah, and local sightseeing in Taif's mountain parks with professional chauffeurs.";
    return {
      meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:url", content: url }],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي الطائف" : "Taif Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "تاكسي الطائف" : "Taif Private Taxi Service", description, url, areaServed: "Taif" })) }
      ]
    };
  },
  component: TaifTaxiPage,
});

function TaifTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي الطائف" : "Taif Taxi"}</span>
      </nav>
      <header className="space-y-6 mb-16">
        <h1 className="font-display text-4xl md:text-5xl">{ar ? "تاكسي الطائف: بوابة المصيف" : "Taif Taxi & Mountain Transfers"}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">{ar ? "رحلات يومية وسياحية من جدة ومكة إلى الطائف. استمتع بأجواء الطائف الرائعة مع خدماتنا المتميزة." : "Reliable private taxi services for tourists and families traveling from Jeddah or Makkah to the beautiful mountains of Taif. We offer comfortable intercity transfers and mountain sightseeing."}</p>
        <div className="flex gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في الطائف" : "Book private taxi in Taif")}>
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "حجز الآن" : "Book Now"}
            </a>
          </Button>
        </div>
      </header>
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Mountain, t_ar: "رحلات سياحية", t_en: "Sightseeing Tours" },
          { icon: MapPin, t_ar: "مكة ← الطائف", t_en: "Makkah to Taif Transfer", path: "/makkah-to-taif-taxi" },
          { icon: Plane, t_ar: "مطار جدة ← الطائف", t_en: "Jeddah Airport to Taif", path: "/jeddah-airport-taxi" }
        ].map((s, i) => (
          <div key={i} className="p-6 border rounded-2xl bg-card hover:shadow-md transition-shadow">
            {s.path ? (
              <Link to={withLocale(locale, s.path)} className="group flex flex-col h-full">
                <s.icon className="h-10 w-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-2 group-hover:text-gold transition-colors">{ar ? s.t_ar : s.t_en}</h3>
              </Link>
            ) : (
              <div className="flex flex-col h-full">
                <s.icon className="h-10 w-10 text-gold mb-4" />
                <h3 className="font-bold mb-2">{ar ? s.t_ar : s.t_en}</h3>
              </div>
            )}
          </div>
        ))}
      </section>
      <CityLongContent page="taxi-taif" />

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي الطائف" : "Taif Taxi FAQ"}</h2>
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
