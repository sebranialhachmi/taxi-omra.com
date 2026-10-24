import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, MapPin, Clock, Shield, Mountain } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كم سعر التاكسي من مكة إلى الطائف؟", a: `تبدأ أسعارنا من مكة إلى الطائف من حوالي 400 ريال للذهاب والعودة (يرجى التواصل معنا للحصول على سعر الرحلة الواحدة الدقيق).` },
  { q: "ما هي المسافة بين مكة والطائف؟", a: "تبعد الطائف عن مكة المكرمة حوالي 85-100 كم، وتستغرق الرحلة بالسيارة الخاصة حوالي ساعة ونصف إلى ساعتين." },
  { q: "هل تنصحون بزيارة الطائف في الصيف؟", a: "نعم، الطائف هي المصيف الأول في المملكة وتتميز بأجوائها المعتدلة ومرتفعاتها الخضراء، وهي وجهة مثالية للهروب من حرارة مكة." },
];

const FAQ_EN = [
  { q: "How much is a taxi from Makkah to Taif?", a: `Our rates for Makkah to Taif transfers start from approximately 400 SAR for round trips. Please contact us for a specific one-way quote.` },
  { q: "How far is Taif from Makkah?", a: "Taif is roughly 85-100 km from Makkah. The journey by private car typically takes between 1.5 to 2 hours." },
  { q: "Is a day trip to Taif worth it?", a: "Absolutely! Known as the 'City of Roses', Taif offers cool mountain air and beautiful parks, making it the perfect day trip destination from the heat of Makkah." },
];

export const Route = createFileRoute("/_public/{-$locale}/makkah-to-taif-taxi")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/makkah-to-taif-taxi`;
    const title = ar 
      ? "تاكسي من مكة إلى الطائف | حجز توصيل للمصيف - تاكسي العمرة" 
      : "Makkah to Taif Taxi | Private Mountain Transfer Services";
    const description = ar 
      ? "احجز تاكسي خاص من مكة المكرمة إلى الطائف. خدمة توصيل مريحة بسيارات مهيأة للطرق الجبلية. استمتع برحلة سياحية آمنة مع سائقين خبراء." 
      : "Book your private Makkah to Taif taxi. Comfortable transfers to the mountain city of Taif. Ideal for day trips and family sightseeing with expert drivers.";
    return {
      meta: [
        { title }, { name: "description", content: description }, 
        { property: "og:title", content: title }, { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { name: "keywords", content: ar ? "توصيل من مكة الى الطائف، تاكسي مكة الطائف، حجز سيارة للمصيف، رحلة سياحية للطائف" : "Makkah to Taif taxi, Makkah to Taif transfer, Makkah to Taif private car, Taif day trip from Makkah" }
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي مكة إلى الطائف" : "Makkah to Taif Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "توصيل من مكة إلى الطائف" : "Makkah to Taif Taxi", description, url, areaServed: "Taif" })) }
      ]
    };
  },
  component: MakkahToTaifTaxiPage,
});

function MakkahToTaifTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const price = getPriceForRoute('makkah-to-taif-rt', 'economyPrice', locale as any);

  return (
    <article className="container-tight py-16">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي مكة إلى الطائف" : "Makkah to Taif Taxi"}</span>
      </nav>
      
      <header className="space-y-6 mb-16">
        <h1 className="font-display text-4xl md:text-5xl">{ar ? "تاكسي من مكة المكرمة إلى الطائف" : "Makkah to Taif Private Taxi"}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {ar 
            ? `اهرب من حرارة الصيف إلى مرتفعات الطائف الباردة. نوفر لك خدمة توصيل خاصة ومريحة من مكة بأسعار تبدأ من ${price} ريال للذهاب والعودة.` 
            : `Escape the summer heat and head to the cool mountains of Taif. We provide private, comfortable transfers from Makkah with rates starting from ${price} SAR for round trips.`}
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg" className="rounded-full h-12 px-8 bg-primary">
            <a href={waLink(ar ? "أرغب بحجز تاكسي من مكة إلى الطائف" : "Book taxi from Makkah to Taif")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "حجز الآن عبر واتساب" : "Book via WhatsApp"}
            </a>
          </Button>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-10 mb-20">
        <div className="space-y-6">
          <h2 className="font-display text-2xl">{ar ? "رحلات سياحية وعائلية" : "Family & Sightseeing Trips"}</h2>
          <p className="text-muted-foreground">
            {ar 
              ? "مدينة الطائف هي الوجهة المفضلة للمعتمرين والزوار الراغبين في تغيير الأجواء. سياراتنا مجهزة بأنظمة تكييف ممتازة وسائقونا يعرفون أفضل المسارات الجبلية الآمنة." 
              : "Taif is a top destination for pilgrims and visitors looking for a change of scenery. Our vehicles are equipped with excellent AC systems, and our drivers know the safest mountain routes."}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Shield, t: ar ? "أمان تام في المرتفعات" : "Mountain road safety" },
              { icon: Clock, t: ar ? "مرونة كاملة في المواعيد" : "Flexible timing" },
              { icon: CheckCircle2, t: ar ? "سيارات حديثة ونظيفة" : "Modern and clean fleet" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-gold shrink-0" />
                <span className="text-sm font-medium">{item.t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative rounded-3xl overflow-hidden bg-muted p-8 border border-border/50">
          <Mountain className="absolute -bottom-10 -right-10 h-48 w-48 text-border/20" />
          <h3 className="font-display text-xl mb-6">{ar ? "مميزات مسار الطائف" : "Taif Route Highlights"}</h3>
          <ul className="space-y-4 text-sm relative z-10">
            <li className="flex justify-between border-b pb-2"><span>{ar ? "المسافة" : "Distance"}</span> <span className="font-bold">~90 KM</span></li>
            <li className="flex justify-between border-b pb-2"><span>{ar ? "الارتفاع" : "Elevation"}</span> <span className="font-bold">1,878 m</span></li>
            <li className="flex justify-between border-b pb-2"><span>{ar ? "الطقس" : "Weather"}</span> <span className="font-bold">{ar ? "معتدل / بارد" : "Cool / Moderate"}</span></li>
          </ul>
        </div>
      </section>

      <CityLongContent page="makkah-to-taif-taxi" />
      <section className="mb-16">
        <h2 className="font-display text-2xl mb-6">{ar ? "الأسئلة المتكررة" : "Frequently Asked Questions"}</h2>
        <div className="space-y-4">
          {(ar ? FAQ_AR : FAQ_EN).map((f) => (
            <div key={f.q} className="p-5 border rounded-xl bg-card">
              <h3 className="font-semibold text-sm mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t pt-8 mb-16 flex flex-wrap gap-4 text-sm font-medium">
        <span>{ar ? "شاهد أيضاً:" : "See also:"}</span>
        <Link to={withLocale(locale, "/taxi-taif")} className="text-gold hover:underline">{ar ? "تاكسي الطائف" : "Taif Taxi"}</Link>
        <Link to={withLocale(locale, "/taif-to-makkah-taxi")} className="text-gold hover:underline">{ar ? "الطائف إلى مكة" : "Taif to Makkah"}</Link>
        <Link to={withLocale(locale, "/taxi-makkah")} className="text-gold hover:underline">{ar ? "تاكسي مكة" : "Makkah Taxi"}</Link>
      </div>
    </article>
  );
}
