import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Star, Info, Plane, ArrowRight, Luggage } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "أين أجد السائق في مطار جدة؟", a: "سيكون السائق بانتظارك في صالة الوصول فور خروجك من منطقة الجمارك في مطار الملك عبدالعزيز الدولي (الصالة رقم 1 أو الصالة الشمالية)، حاملاً لافتة عليها اسمك للتسهيل عليك." },
  { q: "ما هي الوجهات المتاحة من مطار جدة (JED)؟", a: `نوفر رحلات مباشرة من مطار جدة إلى مكة المكرمة (بواسطة ${getPriceForRoute('apt-jed-to-makkah')} ريال)، والمدينة المنورة (${getPriceForRoute('apt-jed-to-med')} ريال)، والطائف، بالإضافة إلى جميع فنادق وأحياء مدينة جدة.` },
  { q: "كيف يتم التعامل مع تأخر الرحلات؟", a: "نحن نتابع رحلتك عبر رقم الرحلة ونقوم بتعديل موعد الاستقبال تلقائياً في حال التأخير دون أي رسوم إضافية، لضمان وجود السائق عند هبوطك." },
  { q: "هل يمكنني حجز تاكسي المطار قبل وصولي؟", a: "نعم، ننصح بشدة بالحجز المسبق عبر الموقع أو واتساب لضمان توفر السيارة المناسبة لك فور وصولك إلى مطار الملك عبدالعزيز." },
];

const FAQ_EN = [
  { q: "Where do I find my chauffeur at Jeddah Airport (JED)?", a: "After clearing customs and exiting the arrivals hall at King Abdulaziz International Airport (Terminal 1 or North Terminal), your chauffeur will be waiting for you with a personalized sign featuring your name." },
  { q: "How long does the driver wait if my flight is delayed?", a: "We monitor all flight arrivals in real-time. If your flight is delayed, your pickup time is adjusted automatically at no extra cost, and we include a generous complimentary waiting time." },
  { q: "Can I book a transfer from Jeddah Airport to Makkah?", a: `Absolutely. We specialize in private Umrah transfers from Jeddah Airport to all hotels in Makkah. Prices start from ${getPriceForRoute('apt-jed-to-makkah', 'economyPrice', 'en')} and vary by vehicle type.` },
  { q: "What should I do after arriving at JED airport?", a: "Once you land, simply proceed through immigration and customs. Look for our driver in the designated arrivals area. For a smooth experience, ensure your phone is on and check your WhatsApp." },
];

export const Route = createFileRoute("/_public/{-$locale}/jeddah-airport-taxi")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/jeddah-airport-taxi`;
    const title = ar
      ? "تاكسي مطار جدة | استقبال وتوصيل مطار الملك عبدالعزيز - تاكسي العمرة"
      : "Jeddah Airport Taxi | Private JED Airport Transfers - Umrah Taxi Saudi";
    const description = ar
      ? "أفضل خدمة تاكسي مطار جدة (JED). استقبال من صالة الوصول، متابعة الرحلات، وأسعار ثابتة إلى مكة وجدة. احجز رحلتك الموثوقة من مطار الملك عبدالعزيز فور وصولك."
      : "Private Jeddah Airport Taxi for arrivals at King Abdulaziz International Airport (JED). Professional meet and greet, luggage assistance, and fixed-rate transfers to Makkah, Jeddah and Madinah.";
    
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` },
              { name: ar ? "تاكسي مطار جدة" : "Jeddah Airport Taxi", url },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            serviceJsonLd({
              name: ar ? "تاكسي مطار جدة" : "Jeddah Airport Taxi Service",
              description,
              url,
              areaServed: "Jeddah Airport (JED)",
            })
          ),
        },
      ],
    };
  },
  component: JeddahAirportTaxiPage,
});

function JeddahAirportTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav aria-label={ar ? "مسار التنقل" : "Breadcrumb"} className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-foreground">{ar ? "تاكسي مطار جدة" : "Jeddah Airport Taxi"}</span>
      </nav>

      <header className="max-w-4xl space-y-6 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-bold uppercase tracking-wider">
          <Plane className="h-3.5 w-3.5" /> {ar ? "خدمة المطار المتميزة" : "Official Airport Transfer Service"}
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight">
          {ar
            ? "تاكسي مطار جدة"
            : "Jeddah Airport Taxi"}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {ar
            ? "ودع عناء البحث عن وسيلة نقل عند وصولك إلى مطار الملك عبدالعزيز. نحن نضمن لك استقبالاً فاخراً وتوصيلاً آمناً بأسعار ثابتة ومنافسة."
            : "Skip the long queues at King Abdulaziz International Airport (JED). Our professional chauffeurs provide seamless meet-and-greet services and private transfers directly to your hotel or residence in Jeddah or Makkah."}
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8 bg-primary hover:bg-primary/90 shadow-lg">
            <a href={waLink(ar ? "أرغب بحجز تاكسي من مطار جدة" : "I'd like to book a private taxi from Jeddah Airport")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز عبر واتساب" : "WhatsApp Booking"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 border-border">
            <a href={telLink()}><Phone className="h-5 w-5 me-2" /> {SITE.phone}</a>
          </Button>
        </div>
      </header>

      <section className="mb-20 grid gap-6 md:grid-cols-4">
        {[
          { icon: Star, title: ar ? "خدمة VIP" : "Meet & Greet", desc: ar ? "استقبال شخصي بالاسم" : "Chauffeur waiting with name sign" },
          { icon: Clock, title: ar ? "متابعة الرحلة" : "Flight Tracking", desc: ar ? "تعديل الموعد عند التأخير" : "Adjusted for flight delays" },
          { icon: Shield, title: ar ? "أسعار ثابتة" : "Fixed Rates", desc: ar ? "بدون رسوم مخفية" : "Known price before arrival" },
          { icon: Luggage, title: ar ? "مساعدة الحقائب" : "Luggage Help", desc: ar ? "سائقنا يساعدك دائماً" : "Included with every transfer" },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
            <div className="mx-auto h-12 w-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
              <item.icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-2 gap-12 mb-20 items-center">
        <div className="space-y-8">
          <h2 className="font-display text-3xl md:text-4xl">{ar ? "خدمات النقل المتخصصة من مطار جدة (JED)" : "Your Guide to Arriving at King Abdulaziz Airport (JED)"}</h2>
          <div className="space-y-6">
            <div className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/5 flex items-center justify-center text-gold">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">{ar ? "ماذا تفعل عند الوصول؟" : "Smooth Arrival Experience"}</h4>
                <p className="text-sm text-muted-foreground">{ar ? "بمجرد خروجك من منطقة الجمارك، توجه إلى صالة الوصول الرئيسية حيث سينتظرك سائقنا." : "After clearing customs, simply walk into the arrivals hall. Our driver will be positioned in a visible location with a sign showing your name, ensuring you don't waste time searching for transport."}</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/5 flex items-center justify-center text-gold">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">{ar ? "النقل المباشر لمكة المكرمة" : "Direct Transfers to Makkah Hotels"}</h4>
                <p className="text-sm text-muted-foreground">{ar ? "نحن الخيار الأول للمعتمرين، حيث نوفر نقلاً مباشراً من المطار إلى باب فندقك في مكة." : "Specialized in Umrah transportation, we provide direct door-to-door transfers from JED airport to your hotel in Makkah, avoiding the stress of public taxis."}</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/5 flex items-center justify-center text-gold">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">{ar ? "النقل لوسط مدينة جدة" : "Hotel Transfers in Jeddah"}</h4>
                <p className="text-sm text-muted-foreground">{ar ? "توصيل سريع ومريح لجميع أحياء وفنادق جدة بأسعار منافسة." : "Whether staying at the Corniche or in a business district, we provide quick and private transit from the airport to any address in Jeddah."}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-muted rounded-3xl p-8 border border-border shadow-inner">
          <h3 className="text-2xl font-bold mb-6">{ar ? "وجهات النقل المفضلة" : "Popular Routes from JED Airport"}</h3>
          <ul className="space-y-4">
            {[
              { label_ar: "مطار جدة ← مكة المكرمة", label_en: "JED Airport to Makkah", path: "/jeddah-airport-to-makkah-taxi" },
              { label_ar: "مطار جدة ← المدينة المنورة", label_en: "JED Airport to Madinah", path: "/routes/jeddah-to-madinah" },
              { label_ar: "مطار جدة ← فنادق جدة", label_en: "JED Airport to Jeddah City", path: "/taxi-jeddah" },
              { label_ar: "مطار جدة ← الطائف", label_en: "JED Airport to Taif", path: "/taxi-taif" },
            ].map((d, i) => (
              <li key={i}>
                <Link to={withLocale(locale, d.path)} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-gold hover:shadow-sm transition-all">
                  <span className="font-medium text-sm">{ar ? d.label_ar : d.label_en}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <CityLongContent page="jeddah-airport-taxi" />

      <section className="mb-20">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي المطار" : "King Abdulaziz Airport Taxi FAQ"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
          <span>{ar ? "خدمات ذات صلة:" : "Related Pages:"}</span>
          <Link to={withLocale(locale, "/taxi-jeddah")} className="text-gold hover:underline">{ar ? "تاكسي جدة" : "Jeddah Taxi"}</Link>
          <Link to={withLocale(locale, "/taxi-makkah")} className="text-gold hover:underline">{ar ? "تاكسي مكة" : "Makkah Taxi"}</Link>
          <Link to={withLocale(locale, "/jeddah-to-makkah-taxi")} className="text-gold hover:underline">{ar ? "جدة إلى مكة" : "Jeddah to Makkah Taxi"}</Link>
        </div>
      </section>

      <section className="rounded-2xl bg-gold/10 border border-gold/20 p-8 md:p-12 text-center shadow-lg">
        <h2 className="font-display text-3xl mb-4 text-primary">{ar ? "هل أنت مستعد للهبوط في جدة؟" : "Arriving at Jeddah Airport?"}</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
          {ar 
            ? "احجز تاكسي المطار الآن ودعنا نهتم بك فور وصولك. خدمة احترافية تليق بك." 
            : "Ensure a smooth start to your journey in Saudi Arabia. Book your private Jeddah airport taxi now and enjoy a luxury meet-and-greet service."}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-lg">
            <a href={waLink(ar ? "أرغب بحجز استقبال من مطار جدة" : "I'd like to book a private pickup from Jeddah Airport")} target="_blank" rel="noopener">
              <MessageCircle className="h-6 w-6 me-2" /> {ar ? "حجز عبر واتساب" : "WhatsApp Booking"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-10 border-border text-lg hover:bg-muted/20">
            <a href={telLink()}>
              <Phone className="h-6 w-6 me-2" /> {SITE.phone}
            </a>
          </Button>
        </div>
      </section>
    </article>
  );
}
