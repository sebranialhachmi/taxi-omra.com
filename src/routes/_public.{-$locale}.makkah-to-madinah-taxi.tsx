import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, MapPin, Clock, Shield, Plane, ArrowRight } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كم تستغرق الرحلة من مكة إلى المدينة بالتاكسي؟", a: "تستغرق الرحلة عادة ما بين 4 إلى 5 ساعات حسب حركة المرور. نستخدم طريق الهجرة السريع وهو طريق مريح وآمن." },
  { q: "هل توفرون توصيل من فنادق مكة إلى فنادق المدينة؟", a: "نعم، خدمة التوصيل لدينا من الباب إلى الباب، حيث نستقبلك من فندقك في مكة ونوصلك مباشرة إلى وجهتك في المدينة المنورة." },
  { q: "هل يمكن الحجز للمجموعات الكبيرة؟", a: "نعم، نوفر فانات حديثة وسيارات عائلية تتسع للمجموعات مع مساحة واسعة للحقائب لضمان راحة الجميع." },
];

const FAQ_EN = [
  { q: "How long is the taxi ride from Makkah to Madinah?", a: "The distance is approximately 450 km, and the journey usually takes around 4.5 to 5 hours via the Al-Hijrah Highway." },
  { q: "Do you offer hotel-to-hotel transfers?", a: "Yes, we provide door-to-door service. We pick you up from your hotel in Makkah and drop you off directly at your accommodation in Madinah." },
  { q: "Is there enough room for large luggage?", a: "Absolutely. We offer various vehicle types including large vans and SUVs with dedicated space for all your suitcases and belongings." },
];

export const Route = createFileRoute("/_public/{-$locale}/makkah-to-madinah-taxi")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/makkah-to-madinah-taxi`;
    const title = ar 
      ? "تاكسي من مكة إلى المدينة | حجز نقل خاص بين الحرمين - تاكسي العمرة" 
      : "Makkah to Madinah Taxi | Private Intercity Umrah Transfers";
    const description = ar 
      ? "احجز تاكسي مكة إلى المدينة المنورة الآن. خدمة توصيل مريحة وآمنة بين الحرمين الشريفين بسيارات حديثة وسائقين محترفين. حجز سهل وسعر ثابت." 
      : "Reliable Makkah to Madinah taxi service for pilgrims. Private intercity transfers with professional drivers and fixed rates. Book your door-to-door transfer now.";
    return {
      meta: [
        { title }, 
        { name: "description", content: description }, 
        { property: "og:title", content: title }, 
        { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { name: "keywords", content: ar 
          ? "توصيل من مكة الى المدينة، تاكسي مكة المدينة، حجز سيارة من مكة الى المدينة، نقل بين الحرمين" 
          : "Makkah to Madinah taxi, Makkah to Madinah private taxi, Makkah to Madinah transfer, intercity taxi Saudi Arabia, Umrah transfer Makkah to Madinah" 
        }
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي مكة إلى المدينة" : "Makkah to Madinah Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "توصيل من مكة إلى المدينة" : "Makkah to Madinah Taxi", description, url, areaServed: "Madinah" })) }
      ]
    };
  },
  component: MakkahToMadinahTaxiPage,
});

function MakkahToMadinahTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const price = getPriceForRoute('makkah-to-med', 'economyPrice', locale as any);

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي من مكة إلى المدينة" : "Makkah to Madinah Taxi"}</span>
      </nav>
      
      <header className="space-y-6 mb-16">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight text-balance">
          {ar ? "توصيل خاص من مكة المكرمة إلى المدينة المنورة" : "Makkah to Madinah Private Taxi Services"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          {ar 
            ? `استكمل رحلتك الإيمانية براحة تامة. نوفر لك أفضل خدمة تاكسي من مكة إلى المدينة المنورة بأسعار تبدأ من ${price} ريال فقط.` 
            : `Complete your spiritual journey in total comfort. We provide the premier private taxi service from Makkah to Madinah with fares starting from ${price} SAR.`}
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8 bg-primary shadow-lg">
            <a href={waLink(ar ? "أرغب بحجز تاكسي من مكة إلى المدينة" : "Book taxi from Makkah to Madinah")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز عبر واتساب" : "Book via WhatsApp"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 border-border">
            <a href={telLink()}><Phone className="h-5 w-5 me-2" /> {SITE.phone}</a>
          </Button>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-8 mb-20">
        {[
          { icon: Clock, t_ar: "التزام تام", t_en: "Punctuality", d_ar: "نصل إلى فندقك في الموعد المحدد لبدء رحلتك نحو المدينة دون تأخير.", d_en: "We arrive at your Makkah hotel exactly on time to start your journey to Madinah." },
          { icon: Shield, t_ar: "راحة المسافات", t_en: "Long-Distance Comfort", d_ar: "سيارات مجهزة خصيصاً للمسافات الطويلة لضمان راحة المعتمرين والزوار.", d_en: "Vehicles specially maintained for long-distance travel to ensure pilgrim comfort." },
          { icon: MapPin, t_ar: "خدمة شاملة", t_en: "Full Service", d_ar: "تشمل الرحلة الاستقبال من أي نقطة في مكة والتوصيل لباب وجهتك في المدينة.", d_en: "Includes pickup from any point in Makkah and drop-off at your Madinah destination." },
        ].map((item, i) => (
          <div key={i} className="p-8 border rounded-3xl bg-card hover:shadow-md transition-shadow">
            <item.icon className="h-12 w-12 text-gold mb-6" />
            <h3 className="text-xl font-bold mb-3">{ar ? item.t_ar : item.t_en}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{ar ? item.d_ar : item.d_en}</p>
          </div>
        ))}
      </section>

      <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 mb-20 overflow-hidden relative">
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl mb-6">{ar ? "لماذا تختار تاكسي العمرة؟" : "Why Choose Our Intercity Transfer?"}</h2>
            <p className="text-primary-foreground/70 mb-8 leading-relaxed">
              {ar 
                ? "نحن ندرك قيمة وقتك وقدسية رحلتك. سائقونا محترفون ويحرصون على توفير بيئة هادئة ومريحة طوال الساعات الخمس التي تقضيها في الطريق." 
                : "We value your time and the importance of your pilgrimage. Our professional drivers ensure a quiet, respectful, and comfortable environment throughout the 5-hour drive."}
            </p>
            <ul className="space-y-4">
              {[
                ar ? "توقفات اختيارية للاستراحة والصلاة" : "Optional stops for prayer and refreshments",
                ar ? "سائقون يتحدثون لغات متعددة" : "Multilingual professional drivers",
                ar ? "أسعار ثابتة تشمل كافة الرسوم" : "Fixed fares including all road fees",
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-gold shrink-0" /> {text}</li>
              ))}
            </ul>
          </div>
          <div className="hidden lg:block bg-gold/10 p-8 rounded-2xl border border-gold/20 backdrop-blur-sm text-center">
             <div className="text-gold font-display text-5xl mb-2">450 KM</div>
             <div className="text-sm uppercase tracking-widest text-primary-foreground/60 mb-6">{ar ? "رحلة آمنة" : "Safe Journey"}</div>
             <p className="text-sm text-primary-foreground/80 leading-relaxed italic">
               {ar ? "طريق الهجرة السريع - يربط بين أطهر بقاع الأرض" : "The Hijrah Highway - connecting the holiest sites on Earth"}
             </p>
          </div>
        </div>
      </div>

      <CityLongContent page="makkah-to-madinah-taxi" />
      <section className="mb-20">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة حول مسار مكة - المدينة" : "Makkah to Madinah FAQs"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(ar ? FAQ_AR : FAQ_EN).map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm font-medium pt-8 border-t mb-16">
        <span>{ar ? "مسارات أخرى:" : "Other Routes:"}</span>
        <Link to={withLocale(locale, "/madinah-to-makkah-taxi")} className="text-gold hover:underline">{ar ? "المدينة إلى مكة" : "Madinah to Makkah"}</Link>
        <Link to={withLocale(locale, "/taxi-makkah")} className="text-gold hover:underline">{ar ? "تاكسي مكة" : "Makkah Taxi"}</Link>
        <Link to={withLocale(locale, "/jeddah-to-makkah-taxi")} className="text-gold hover:underline">{ar ? "جدة إلى مكة" : "Jeddah to Makkah"}</Link>
      </div>
    </article>
  );
}
