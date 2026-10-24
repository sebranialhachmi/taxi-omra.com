import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Plane, ArrowRight } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كم سعر التاكسي من مطار جدة إلى مكة؟", a: `يبدأ سعر التاكسي من مطار جدة إلى مكة المكرمة من ${getPriceForRoute('apt-jed-to-makkah', 'economyPrice')} ريال لسيارة السيدان. السعر ثابت ويشمل الاستقبال والانتظار.` },
  { q: "كيف أجد السائق في المطار؟", a: "سيكون السائق بانتظارك في صالة الوصول حاملاً لوحة عليها اسمك للتسهيل عليك، وسيقوم بمساعدتك في حمل الحقائب." },
  { q: "هل الخدمة متوفرة لرحلات الفجر؟", a: "نعم، خدماتنا متوفرة على مدار 24 ساعة طوال أيام الأسبوع. يمكنك الحجز المسبق لضمان وجود السائق فور وصولك." },
];

const FAQ_EN = [
  { q: "How much is a taxi from Jeddah Airport to Makkah?", a: `Private taxi fares from Jeddah Airport to Makkah start from ${getPriceForRoute('apt-jed-to-makkah', 'economyPrice')} SAR. This is a fixed price for the entire vehicle, not per person.` },
  { q: "Can I book a private taxi for Umrah?", a: "Yes, we specialize in private Umrah transportation. You can book a dedicated vehicle for your family or group for a direct transfer to your hotel in Makkah." },
  { q: "How long does Jeddah Airport to Makkah take?", a: "The journey typically takes about 1 hour and 15 minutes, depending on traffic and the location of your hotel in Makkah." },
];

export const Route = createFileRoute("/_public/{-$locale}/jeddah-to-makkah-taxi")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/jeddah-to-makkah-taxi`;
    const title = ar 
      ? "تاكسي من مطار جدة إلى مكة | حجز توصيل مباشر 24 ساعة - تاكسي العمرة" 
      : "Jeddah to Makkah Taxi | Private Umrah Transfer - Umrah Taxi Saudi";
    const description = ar 
      ? "احجز أفضل تاكسي من مطار جدة إلى مكة المكرمة. خدمة استقبال احترافية، سيارات حديثة، وأسعار ثابتة للمعتمرين والزوار. احجز رحلتك الآن في أقل من دقيقة." 
      : "Reliable Jeddah to Makkah taxi service for Umrah pilgrims. Private Jeddah Airport to Makkah transfers with professional drivers and fixed rates. Book your hotel transfer now.";
    return {
      meta: [
        { title }, 
        { name: "description", content: description }, 
        { property: "og:title", content: title }, 
        { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { name: "keywords", content: ar 
          ? "توصيل من مطار جدة الى مكة، تاكسي مطار جدة مكة، حجز سيارة من مطار جدة الى مكة، مواصلات مطار جدة مكة" 
          : "Jeddah to Makkah taxi, Jeddah to Makkah private taxi, Jeddah to Makkah transfer, Jeddah Airport to Makkah, taxi from Jeddah to Makkah, private transfer Jeddah to Makkah, Jeddah airport transfer to Makkah, Makkah hotel transfer, Umrah transfer from Jeddah" 
        }
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي جدة إلى مكة" : "Jeddah to Makkah Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "توصيل من مطار جدة إلى مكة" : "Jeddah Airport to Makkah Taxi", description, url, areaServed: "Makkah" })) }
      ]
    };
  },
  component: JeddahToMakkahTaxiPage,
});

function JeddahToMakkahTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي من مطار جدة إلى مكة" : "Jeddah to Makkah Taxi"}</span>
      </nav>
      
      <header className="space-y-6 mb-16">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight">
          {ar ? "تاكسي من مطار جدة إلى مكة المكرمة" : "Jeddah to Makkah Taxi"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          {ar 
            ? "نقدم خدمة توصيل مباشرة ومريحة من مطار الملك عبدالعزيز الدولي بجدة إلى قلب مكة المكرمة. سواء كنت قادماً للعمرة أو الزيارة، نحن نضمن لك وصولاً آمناً وسلساً." 
            : "Direct and comfortable private taxi services from Jeddah and King Abdulaziz International Airport (JED) to the heart of Makkah. The perfect Umrah transfer for pilgrims, families, and international visitors."}

        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8 bg-primary shadow-lg">
            <a href={waLink(ar ? "أرغب بحجز تاكسي من مطار جدة إلى مكة" : "Book taxi from Jeddah Airport to Makkah")} target="_blank" rel="noopener">
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
          { icon: Clock, t_ar: "متابعة الرحلات", t_en: "Flight Tracking", d_ar: "نتابع موعد وصول رحلتك لضمان انتظار السائق لك فور هبوطك.", d_en: "We track your arrival time to ensure the driver is ready when you land." },
          { icon: Shield, t_ar: "سعر ثابت", t_en: "Fixed Price", d_ar: "أسعار ثابتة تشمل الضريبة ورسوم المطار والانتظار دون مفاجآت.", d_en: "Fixed rates including tax, airport fees, and waiting with no surprises." },
          { icon: MapPin, t_ar: "توصيل لباب الفندق", t_en: "Door-to-Door", d_ar: "نصل بك مباشرة إلى مدخل فندقك في مكة المكرمة بكل راحة.", d_en: "We take you directly to your hotel entrance in Makkah in total comfort." },
        ].map((item, i) => (
          <div key={i} className="p-8 border rounded-3xl bg-card hover:shadow-md transition-shadow">
            <item.icon className="h-12 w-12 text-gold mb-6" />
            <h3 className="text-xl font-bold mb-3">{ar ? item.t_ar : item.t_en}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{ar ? item.d_ar : item.d_en}</p>
          </div>
        ))}
      </section>

      <div className="bg-muted rounded-3xl p-8 md:p-12 mb-20">
        <h2 className="font-display text-3xl mb-8">{ar ? "لماذا تختارنا لرحلتك إلى مكة؟" : "Why Choose Us for Your Trip to Makkah?"}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <ul className="space-y-4">
            {[
              ar ? "استقبال احترافي في صالة الوصول" : "Professional meet & greet in arrivals",
              ar ? "سيارات حديثة ونظيفة مكيفة" : "Clean, modern air-conditioned cars",
              ar ? "سائقون محترفون على دراية بطرق مكة" : "Experienced drivers who know Makkah roads",
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-gold shrink-0" /> {text}</li>
            ))}
          </ul>
          <ul className="space-y-4">
            {[
              ar ? "خدمة متوفرة 24/7 طوال الأسبوع" : "24/7 service all week long",
              ar ? "مساحة كافية لجميع الحقائب" : "Ample space for all luggage",
              ar ? "سهولة الحجز والتواصل المباشر" : "Easy booking and direct communication",
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-gold shrink-0" /> {text}</li>
            ))}
          </ul>
        </div>
      </div>

      <CityLongContent page="jeddah-to-makkah-taxi" />
      <section className="mb-20">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(ar ? FAQ_AR : FAQ_EN).map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm font-medium border-t pt-8 mb-16">
        <span>{ar ? "مسارات أخرى ذات صلة:" : "Related Umrah Routes:"}</span>
        <Link to={withLocale(locale, "/makkah-to-madinah-taxi")} className="text-gold hover:underline">{ar ? "مكة إلى المدينة" : "Makkah to Madinah"}</Link>
        <Link to={withLocale(locale, "/makkah-to-jeddah-taxi")} className="text-gold hover:underline">{ar ? "مكة إلى جدة" : "Makkah to Jeddah"}</Link>
        <Link to={withLocale(locale, "/jeddah-airport-taxi")} className="text-gold hover:underline">{ar ? "تاكسي مطار جدة" : "Jeddah Airport Taxi"}</Link>
      </div>

      <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-16 text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-6">{ar ? "جاهز لحجز رحلتك إلى مكة؟" : "Ready to Book Your Trip to Makkah?"}</h2>
        <p className="text-primary-foreground/80 mb-10 max-w-2xl mx-auto text-lg">
          {ar 
            ? "احجز الآن واستمتع برحلة مريحة وهادئة من مطار جدة إلى مكة المكرمة. فريقنا بانتظار خدمتك." 
            : "Book now and enjoy a comfortable, quiet journey from Jeddah Airport to Makkah. Our team is waiting to serve you."}
        </p>
        <Button asChild size="lg" className="bg-gold text-primary hover:bg-gold-soft h-14 px-10 text-lg rounded-full">
          <a href={waLink(ar ? "أرغب بحجز تاكسي من مطار جدة إلى مكة" : "Book taxi from Jeddah Airport to Makkah")} target="_blank" rel="noopener">
            <MessageCircle className="h-6 w-6 me-2" /> {ar ? "تواصل معنا الآن" : "Contact Us Now"}
          </a>
        </Button>
      </div>
    </article>
  );
}
