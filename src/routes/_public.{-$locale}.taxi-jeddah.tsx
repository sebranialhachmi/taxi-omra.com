import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, Users, Luggage, MapPin, Clock, Shield, Plane, ArrowRight, Building2, Star } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";

const FAQ_AR = [
  { q: "كيف يمكنني حجز تاكسي في جدة؟", a: "يمكنك حجز تاكسي جدة بسهولة عبر واتساب أو الاتصال المباشر. نوفر خدمة فورية أو حجوزات مسبقة للرحلات الخاصة والعائلية وخدمات النقل لرجال الأعمال داخل أحياء جدة." },
  { q: "هل تتوفر خدمة التوصيل بين أحياء جدة؟", a: "نعم، نقدم خدمة التوصيل الاحترافي بين جميع أحياء ومناطق جدة الكبرى بما في ذلك الحمراء، الروضة، أبحر، حي الشاطئ، ومنطقة البلد التاريخية." },
  { q: "هل توفرون خدمة استقبال من فنادق جدة؟", a: "بالتأكيد، نوفر خدمة الاستقبال من باب الفندق في أي مكان داخل جدة، مع سائقين محترفين ومساعدة كاملة في نقل الحقائب." },
  { q: "ما هي أنواع السيارات المتوفرة في أسطول جدة؟", a: "يتضمن أسطولنا سيارات سيدان حديثة مريحة، سيارات دفع رباعي واسعة للعائلات، وفانات كبيرة للرحلات الجماعية ونقل المعتمرين." },
];

const FAQ_EN = [
  { q: "How can I book a private taxi in Jeddah?", a: "Booking is simple via WhatsApp or a direct phone call. We offer on-demand pickups and pre-arranged private transfers for tourists, business travelers, and families across Jeddah districts." },
  { q: "Does your service cover all Jeddah districts?", a: "Yes, our professional chauffeurs operate throughout Jeddah, including major residential and business hubs like Al Hamra, Al Rawdah, Obhur, Ash Shati, and the historic Al Balad district." },
  { q: "Can I book a taxi for local trips within Jeddah?", a: "Yes, we specialize in local transportation within Jeddah, including shopping trips, business meetings, and visiting local attractions with door-to-door service." },
  { q: "What should I expect for hotel pickups in Jeddah?", a: "We provide door-to-door service. Your driver will meet you at your hotel entrance or lobby at the scheduled time, assisting with luggage for a stress-free start to your journey." },
];

export const Route = createFileRoute("/_public/{-$locale}/taxi-jeddah")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taxi-jeddah`;
    const title = ar
      ? "تاكسي جدة | حجز توصيل داخل جدة بسيارات حديثة - تاكسي العمرة"
      : "Jeddah Taxi | Private City & Hotel Transfers - Umrah Taxi Saudi";
    const description = ar
      ? "احجز تاكسي جدة الآن. نوفر سيارات حديثة مع سائقين محترفين للتوصيل داخل أحياء جدة، الرحلات العائلية، والشركات. خدمة موثوقة على مدار الساعة لخدمة سكان وزوار جدة."
      : "Private taxi in Jeddah for hotel pickups, city travel and intercity transfers. Book your private Jeddah taxi online or via WhatsApp for reliable 24/7 service.";
    
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
              { name: ar ? "تاكسي جدة" : "Jeddah Taxi", url },
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
              name: ar ? "تاكسي جدة" : "Jeddah Private Taxi Service",
              description,
              url,
              areaServed: "Jeddah",
            })
          ),
        },
      ],
    };
  },
  component: TaxiJeddahPage,
});

function TaxiJeddahPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav aria-label={ar ? "مسار التنقل" : "Breadcrumb"} className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-foreground">{ar ? "تاكسي جدة" : "Taxi Jeddah"}</span>
      </nav>

      <header className="max-w-3xl space-y-5 mb-12">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "خدمات التوصيل في جدة" : "Premium Jeddah City Transfers"}</span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight text-balance">
          {ar
            ? "تاكسي جدة"
            : "Jeddah Taxi"}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {ar
            ? "سواء كنت في رحلة عمل، زيارة عائلية، أو تحتاج للتنقل بين أحياء جدة ومطار الملك عبدالعزيز، نوفر لك أسطولاً من السيارات الحديثة والسائقين ذوي الخبرة لضمان وصولك في الموعد المحدد."
            : "Navigate the vibrant city of Jeddah with our professional chauffeur services. Whether you are traveling for business, a family vacation, or need a reliable transfer between Jeddah districts, our fleet is at your service 24/7."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في جدة" : "I'd like to book a taxi in Jeddah")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "حجز عبر واتساب" : "Book via WhatsApp"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <a href={telLink()}><Phone className="h-5 w-5 me-2" /> {SITE.phone}</a>
          </Button>
        </div>
      </header>

      <section className="grid gap-8 md:grid-cols-3 mb-16">
        {[
          { icon: Building2, title_ar: "توصيل الفنادق", title_en: "Hotel Transfers", desc_ar: "خدمة من الباب إلى الباب لجميع فنادق ومنتجعات جدة.", desc_en: "Door-to-door private transfers for all Jeddah hotels and coastal resorts." },
          { icon: Star, title_ar: "خدمة رجال الأعمال", title_en: "Business Travel", desc_ar: "تنقل بخصوصية تامة بين مراكز الأعمال والمؤتمرات.", desc_en: "Professional chauffeur service for meetings and corporate hubs." },
          { icon: Plane, title_ar: "اتصال المطار", title_en: "Airport Connections", desc_ar: "ربط سلس مع مطار الملك عبدالعزيز الدولي.", desc_en: "Seamlessly connect with King Abdulaziz International Airport (JED).", path: "/jeddah-airport-taxi" },
        ].map((item, idx) => (
          <div key={idx} className="p-6 rounded-2xl border border-border bg-card shadow-sm">
            {item.path ? (
              <Link to={withLocale(locale, item.path)} className="group">
                <item.icon className="h-10 w-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">{ar ? item.title_ar : item.title_en}</h3>
              </Link>
            ) : (
              <>
                <item.icon className="h-10 w-10 text-gold mb-4" />
                <h3 className="text-xl font-bold mb-2">{ar ? item.title_ar : item.title_en}</h3>
              </>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">{ar ? item.desc_ar : item.desc_en}</p>
          </div>
        ))}
      </section>

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "تغطية شاملة لخدمات النقل في جدة" : "Explore Jeddah with Private Transportation"}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-bold inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> {ar ? "الأحياء والمناطق الحيوية" : "Districts & Key Destinations"}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {ar 
                ? "نخدم جميع أحياء جدة بما في ذلك الواجهة البحرية، الكورنيش، منطقة البلد التاريخية، ومراكز التسوق الكبرى. تنقل براحة تامة بين وجهاتك المفضلة."
                : "Our Jeddah taxi service covers all major residential and commercial areas. From the modern Jeddah Waterfront and Corniche to the historical charm of Al Balad, we ensure you reach your destination comfortably."}
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold inline-flex items-center gap-2"><Plane className="h-5 w-5 text-gold" /> {ar ? "النقل من المطار" : "Airport Transfers"}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {ar 
                ? "إذا كنت بحاجة إلى وسيلة نقل مخصصة من مطار جدة إلى وسط المدينة أو العكس، فإن سائقينا يضمنون لك رحلة هادئة وتوقيتات دقيقة."
                : "Arriving at JED? We provide specialized airport taxi services to take you directly to your residence or hotel without the hassle of long queues."}
            </p>
            <Link to={withLocale(locale, "/jeddah-airport-taxi")} className="text-gold text-sm font-medium hover:underline inline-flex items-center">
              {ar ? "تفاصيل تاكسي المطار" : "Jeddah Airport Taxi Details"} <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
            </Link>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold inline-flex items-center gap-2"><ArrowRight className="h-5 w-5 text-gold" /> {ar ? "مسارات من جدة إلى المدن الأخرى" : "Intercity Transfers from Jeddah"}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {ar 
                ? "نوفر مسارات مباشرة من جدة إلى مكة المكرمة والمدينة المنورة والطائف، مما يجعلنا الخيار الأول للمعتمرين والسياح الدوليين."
                : "We are the preferred choice for pilgrims and international travelers requiring intercity transfers from Jeddah to Makkah, Madinah, or Taif."}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              <Link to={withLocale(locale, "/jeddah-to-makkah-taxi")} className="text-gold text-xs font-medium hover:underline">
                {ar ? "تاكسي جدة إلى مكة" : "Jeddah to Makkah Taxi"}
              </Link>
              <Link to={withLocale(locale, "/routes/jeddah-to-madinah")} className="text-gold text-xs font-medium hover:underline">
                {ar ? "تاكسي جدة إلى المدينة" : "Jeddah to Madinah Taxi"}
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold inline-flex items-center gap-2"><Users className="h-5 w-5 text-gold" /> {ar ? "النقل العائلي" : "Family & Group Transport"}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {ar 
                ? "سيارات واسعة ومريحة تضمن الخصوصية والأمان لجميع أفراد الأسرة خلال تجولهم في مدينة جدة أو حضور المناسبات."
                : "Traveling with family? Our spacious SUVs and vans are perfect for groups, providing ample room for luggage and ensuring a safe, private environment."}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8">{ar ? "لماذا تختار تاكسي العمرة في جدة؟" : "Why Choose Our Jeddah Taxi Service?"}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { t_ar: "دقة المواعيد", t_en: "Always Punctual", d_ar: "نلتزم بمواعيدنا لضمان عدم تأخرك.", d_en: "We value your time and guarantee on-time arrivals." },
            { t_ar: "سائقون محترفون", t_en: "Expert Drivers", d_ar: "سائقونا على دراية كاملة بجميع طرق جدة.", d_en: "Local chauffeurs with deep knowledge of Jeddah." },
            { t_ar: "أسعار شفافة", t_en: "Fixed Pricing", d_ar: "السعر المتفق عليه هو ما ستدفعه.", d_en: "No hidden fees—know your fare before you travel." },
            { t_ar: "أسطول حديث", t_en: "Modern Fleet", d_ar: "سيارات نظيفة ومعقمة ومكيفة بالكامل.", d_en: "Clean, air-conditioned vehicles for ultimate comfort." },
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-1" />
              <div>
                <h4 className="font-bold">{ar ? item.t_ar : item.t_en}</h4>
                <p className="text-xs text-muted-foreground">{ar ? item.d_ar : item.d_en}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CityLongContent page="taxi-jeddah" />

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي جدة" : "Jeddah Taxi FAQ"}</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
          <span>{ar ? "روابط مفيدة:" : "Related Services:"}</span>
          <Link to={withLocale(locale, "/taxi-makkah")} className="text-gold hover:underline">{ar ? "تاكسي مكة" : "Makkah Taxi"}</Link>
          <Link to={withLocale(locale, "/jeddah-airport-taxi")} className="text-gold hover:underline">{ar ? "تاكسي مطار جدة" : "Jeddah Airport Taxi"}</Link>
        </div>
      </section>

      <div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 text-center shadow-xl">
        <h2 className="font-display text-3xl mb-4">{ar ? "احجز تاكسي جدة الآن" : "Ready to Explore Jeddah?"}</h2>
        <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
          {ar 
            ? "فريقنا بانتظار خدمتك على مدار الساعة. احصل على رحلة مريحة وآمنة داخل مدينة جدة." 
            : "Whether it's a quick trip to the mall or a full day of meetings, book your private Jeddah taxi now for a stress-free experience."}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="bg-gold text-primary hover:bg-gold-soft h-14 px-8 text-lg rounded-full">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في جدة" : "I'd like to book a private taxi in Jeddah")} target="_blank" rel="noopener">
              <MessageCircle className="h-6 w-6 me-2" /> {ar ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-white/10 h-14 px-8 text-lg rounded-full">
            <a href={telLink()}>
              <Phone className="h-6 w-6 me-2" /> {SITE.phone}
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
