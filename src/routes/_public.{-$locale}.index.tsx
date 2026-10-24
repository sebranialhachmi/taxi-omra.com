import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { listCmsPages, listTestimonials, listFaqs, listVehicleCategories } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Phone, MessageCircle, Clock, Shield, MapPin, Award, Star, ArrowRight, Plane, Building2, Briefcase,
  Users, Sparkles, CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { organizationJsonLd, localBusinessJsonLd, breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd, webApplicationJsonLd } from "@/lib/seo";
import heroImg from "@/assets/hero-luxury-car.webp";
import airportImg from "@/assets/airport-transfer.jpg";
import businessImg from "@/assets/business-travel.jpg";
import { categoryImage, categoryAlt, FALLBACK_FLEET_IMAGES } from "@/lib/fleet-images";
import { getPriceForRoute } from "@/lib/pricing.functions";


const homeOpts = () => queryOptions({
  queryKey: ["public", "home"],
  queryFn: async () => ({
    services: await listCmsPages({ data: { type: "service" } }),
    airports: await listCmsPages({ data: { type: "airport" } }),
    cities: await listCmsPages({ data: { type: "city" } }),
    testimonials: await listTestimonials(),
    faqs: await listFaqs(),
    fleet: await listVehicleCategories(),
  }),
});

const KEYWORDS_AR = [
  "التوصيل من مطار جدة إلى مكة","تاكسي من مطار جدة إلى مكة","حجز تاكسي مطار جدة",
  "نقل من مطار الملك عبدالعزيز إلى مكة","تاكسي العمرة","نقل من مطار جدة إلى مكة",
  "سيارة من مطار جدة إلى مكة","مواصلات من مطار جدة إلى مكة","استقبال من مطار جدة",
  "تاكسي مطار جدة","نقل المعتمرين","تاكسي مكة","تاكسي جدة",
];
const KEYWORDS_EN = [
  "Umrah Taxi","Jeddah Airport Taxi","Taxi from Jeddah Airport to Makkah","Jeddah Airport Transfer",
  "Airport Transfer Jeddah to Makkah","King Abdulaziz Airport to Makkah transfer","Makkah Taxi","Jeddah Taxi",
  "Umrah Transportation","Private Transfer Jeddah Airport","Taxi to Makkah","Airport Taxi Saudi Arabia",
];


export const Route = createFileRoute("/_public/{-$locale}/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeOpts()),
  head: ({ params, loaderData }: any) => {
    const locale = (params?.locale === "en" ? "en" : "ar") as "ar" | "en";
    const isEn = locale === "en";
    const titleAr = `تاكسي مطار جدة إلى مكة | تاكسي العمرة - توصيل 24 ساعة`;
    const titleEn = `Umrah Taxi | Jeddah, Makkah & Madinah Taxi`;
    const descAr = "احجز خدمة التوصيل من مطار جدة إلى مكة مع تاكسي العمرة. نوفر سيارات حديثة، سائقين محترفين، استقبال من مطار الملك عبدالعزيز، أسعار ثابتة، وخدمة متوفرة 24 ساعة لجميع رحلات العمرة والزيارة.";
    const descEn = "Private Umrah Taxi in Saudi Arabia – Jeddah Airport to Makkah, Makkah to Madinah & Madinah to Jeddah. Book your private taxi online or via WhatsApp.";
    const ogTitleAr = `التوصيل من مطار جدة إلى مكة | تاكسي العمرة`;
    const ogTitleEn = `Jeddah Airport to Makkah Transfer | Omra Taxi`;
    const ogDescAr = "أفضل خدمة تاكسي من مطار جدة إلى مكة بسيارات حديثة وأسعار ثابتة وخدمة 24/7. احجز رحلتك الآن مع تاكسي العمرة.";
    const ogDescEn = "The best taxi service from Jeddah Airport to Makkah — modern cars, fixed fares and 24/7 service. Book your ride now with Omra Taxi.";
    const ogImage = `${SITE.url}/og-cover.jpg`;
    const url = SITE.url + `/${locale}`;
    const title = isEn ? titleEn : titleAr;
    const desc = isEn ? descEn : descAr;
    const ogTitle = isEn ? ogTitleEn : ogTitleAr;
    const ogDesc = isEn ? ogDescEn : ogDescAr;
    const siteName = `${SITE.brand.ar} | ${SITE.brand.en}`;
    const keywords = (isEn ? KEYWORDS_EN : KEYWORDS_AR).join(", ");


    // Rich JSON-LD stack — canonical/hreflang emitted by parent layout (avoid dupes).
    const graph: any[] = [
      organizationJsonLd(),
      localBusinessJsonLd(),
      webApplicationJsonLd({
        description: isEn
          ? "Umrah taxi and airport transfer service from Jeddah Airport to Makkah and across Saudi Arabia — easy bookings, fixed fares and modern cars available 24 hours."
          : "خدمة تاكسي العمرة والتوصيل من مطار جدة إلى مكة المكرمة وجميع مدن المملكة، مع حجوزات سهلة، أسعار ثابتة، وسيارات حديثة تعمل على مدار 24 ساعة.",
      }),
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.brand.en,
        alternateName: SITE.brand.ar,
        description: descEn,
        inLanguage: ["ar", "en"],
        publisher: { "@id": `${SITE.url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/${locale}/search?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      breadcrumbJsonLd([{ name: isEn ? "Home" : "الرئيسية", url }]),
      serviceJsonLd({
        name: isEn ? "Taxi from Jeddah Airport to Makkah" : "التوصيل من مطار جدة إلى مكة المكرمة",
        description: desc,
        areaServed: "Jeddah, Makkah, Madinah, Taif",
        url,
      }),
      serviceJsonLd({
        name: isEn ? "Umrah Transportation" : "نقل المعتمرين",
        description: isEn ? "Chauffeur transfers for Umrah pilgrims from KAIA to Makkah and Madinah." : "خدمة توصيل المعتمرين من مطار جدة إلى مكة المكرمة والمدينة المنورة.",
        url,
      }),
    ];

    const faqs = (loaderData?.faqs ?? []).slice(0, 12).map((f: any) => ({
      q: isEn ? (f.question_en || f.question_ar) : (f.question_ar || f.question_en),
      a: isEn ? (f.answer_en || f.answer_ar) : (f.answer_ar || f.answer_en),
    })).filter((x: any) => x.q && x.a);
    if (faqs.length) graph.push(faqPageJsonLd(faqs));


    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: keywords },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { name: "language", content: isEn ? "en" : "ar" },
        { property: "og:site_name", content: siteName },
        { property: "og:title", content: ogTitle },
        { property: "og:description", content: ogDesc },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: isEn ? "en_US" : "ar_SA" },
        { property: "og:locale:alternate", content: isEn ? "ar_SA" : "en_US" },
        { property: "og:image", content: ogImage },
        { property: "og:image:secure_url", content: ogImage },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: ogTitle },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ogTitle },
        { name: "twitter:description", content: ogDesc },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:image:alt", content: ogTitle },

      ],
      scripts: graph.map((g) => ({ type: "application/ld+json", children: JSON.stringify(g) })),
    };
  },
  component: Home,
});

// Fleet images now flow from the DB via categoryImage() with a legacy fallback.

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow"><span className="h-px w-8 bg-gold" />{children}</span>;
}

function Home() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  // The loader data is already embedded in the SSR response. Reading it here
  // avoids immediately repeating six RPC calls during hydration, which could
  // otherwise replace the rendered page with an error on a transient 404.
  const data = Route.useLoaderData();

  return (
    <>
      {/* ============ HERO — SPLIT ============ */}
      <section className="relative overflow-hidden -mt-20 pt-20 bg-background">
        <div className="container-tight grid gap-10 lg:grid-cols-12 lg:gap-14 py-14 md:py-24 items-center">
          <div className="lg:col-span-6 space-y-8 animate-fade-in">
            <Eyebrow>{ar ? "تاكسي العمرة" : "Umrah Taxi Saudi"}</Eyebrow>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-balance">
              {ar ? (
                <>تاكسي من <em className="text-gold not-italic">مطار جدة</em> إلى مكة المكرمة</>
              ) : (
                <>Private Umrah Taxi <em className="text-gold italic">in Saudi Arabia</em></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              {ar
                ? `خدمة التوصيل من مطار جدة إلى مكة على مدار الساعة بأسعار تبدأ من ${getPriceForRoute('apt-jed-to-makkah')} ريال فقط — سيارات حديثة، سائقون محترفون. احجز في دقيقة.`
                : `Private Umrah taxi and airport transfers from only ${getPriceForRoute('apt-jed-to-makkah')} SAR — modern vehicles, professional drivers. Book your Jeddah Airport to Makkah ride in under a minute.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant h-12 px-6">
                <a href={waLink(ar ? "أرغب بحجز تاكسي" : "I'd like to book a chauffeur")} target="_blank" rel="noopener">
                  <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز عبر واتساب" : "Book on WhatsApp"}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 border-border">
                <a href={telLink()}>
                  <Phone className="h-5 w-5 me-2" /> {SITE.phone}
                </a>
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-5 pt-6 border-t border-border/60">
              {[
                { k: ar ? "سيارات حديثة" : "Modern fleet", v: ar ? "أسطول حديث ومكيّف بالكامل لراحتكم" : "Fully air-conditioned modern fleet" },
                { k: ar ? "سائقون محترفون" : "Professional drivers", v: ar ? "سائقون مدرّبون يعرفون أفضل الطرق" : "Trained drivers who know every route" },
                { k: ar ? "خدمة 24/7" : "24/7 service", v: ar ? "متاحون على مدار الساعة طوال الأسبوع" : "Available around the clock, all week" },
                { k: ar ? "أمان وموثوقية" : "Safety & trust", v: ar ? "سلامتكم أولويتنا بمعايير صارمة" : "Your safety is our top priority" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="font-display text-lg leading-tight text-foreground">{s.k}</dt>
                  <dd className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.v}</dd>
                </div>
              ))}
            </dl>

          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-primary shadow-lift">
              <img
                src={heroImg}
                alt={ar ? "سائق فاخر أمام المطار" : "Luxury chauffeur at airport terminal"}
                width={800}
                height={1000}
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-primary/70 via-primary/10 to-transparent" />
              <div className="absolute bottom-6 start-6 end-6 flex items-end justify-between gap-4">
                <div className="text-primary-foreground">
                  <div className="text-xs uppercase tracking-[0.22em] text-gold">VIP Terminal</div>
                  <div className="font-display text-2xl mt-1">{ar ? "استقبال شخصي" : "Meet & greet"}</div>
                </div>
                <div className="flex items-center gap-1 text-primary-foreground/90">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />)}
                </div>
              </div>
            </div>
            <div className="hidden md:flex absolute -bottom-6 -start-6 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-elegant max-w-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/20 text-gold shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{ar ? "استجابة فورية" : "Instant confirmation"}</div>
                <div className="text-xs text-muted-foreground">{ar ? "خلال دقيقة عبر واتساب" : "Under 1 min on WhatsApp"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST MARQUEE ============ */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="container-tight py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { icon: Shield, label: ar ? "سائقون معتمدون" : "Licensed & vetted drivers" },
            { icon: CheckCircle2, label: ar ? "أسعار ثابتة" : "Fixed transparent fares" },
            { icon: Clock, label: ar ? "متاح ٢٤/٧" : "Available 24/7" },
            { icon: Award, label: ar ? "خبرة أكثر من ١٠ سنوات" : "10+ years of service" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <f.icon className="h-5 w-5 text-gold shrink-0" />
              <span className="text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="container-tight py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-3 md:items-end mb-12">
          <div className="md:col-span-2 space-y-4">
            <Eyebrow>{ar ? "خدماتنا" : "Services"}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-balance">
              {ar ? "حلول نقل مصممة لكل مناسبة." : "Transportation crafted for every occasion."}
            </h2>
          </div>
          <p className="text-muted-foreground md:text-end">
            {ar ? "من المطار إلى غرفة الاجتماعات، نحن هنا لكل رحلة." : "From the terminal to the boardroom, we handle every journey."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Plane, slug: "airport-transfer", ar: "نقل المطار", en: "Airport Transfers", desc_ar: "توصيل من وإلى المطار على مدار الساعة مع تتبع الرحلة.", desc_en: "24/7 pickup & drop-off with live flight tracking." },
            { icon: Briefcase, slug: "corporate", ar: "نقل الشركات", en: "Business Travel", desc_ar: "عقود شهرية وحلول للمدراء التنفيذيين.", desc_en: "Monthly contracts and executive road-shows." },
            { icon: Building2, slug: "hotel-transfer", ar: "نقل الفنادق", en: "Hotel & Private", desc_ar: "خدمة مخصصة لضيوف الفنادق والفعاليات الخاصة.", desc_en: "White-glove pickups for hotels and events." },
          ].map((s) => (
            <Link key={s.slug} to="/{-$locale}/p/$slug" params={(prev: any) => ({ ...prev, slug: s.slug })} className="group">
              <article className="hover-lift h-full flex flex-col rounded-2xl border border-border bg-card p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-6 group-hover:bg-gold group-hover:text-primary transition-colors">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl mb-3">{ar ? s.ar : s.en}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{ar ? s.desc_ar : s.desc_en}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {ar ? "اعرف المزيد" : "Discover"} <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ AIRPORT TRANSFER FEATURE ============ */}
      <section className="bg-primary text-primary-foreground overflow-hidden">
        <div className="container-tight py-20 md:py-28 grid gap-12 lg:grid-cols-2 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img src={airportImg} alt="Airport transfer" width={1200} height={900} loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-6">
            <Eyebrow>{ar ? "نقل المطار" : "Airport Transfers"}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-balance">
              {ar ? "استقبال شخصي، بلا انتظار." : "Meet, greet, and glide away."}
            </h2>
            <p className="text-primary-foreground/70 leading-relaxed max-w-lg">
              {ar
                ? "سائقنا ينتظرك في صالة الوصول، يحمل حقائبك، ويتابع رحلتك مسبقاً حتى يكون في الموعد تماماً — دائماً."
                : "Your chauffeur meets you in arrivals, handles the luggage, and tracks your flight so the car is exactly where it needs to be — every time."}
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ar ? "تتبع الرحلات مباشر" : "Live flight tracking",
                ar ? "٦٠ دقيقة انتظار مجانية" : "60 min free wait time",
                ar ? "لافتة اسم شخصية" : "Personalised name sign",
                ar ? "أسعار ثابتة مسبقة" : "Fixed fare, paid on arrival",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-gold shrink-0" /><span className="text-primary-foreground/85">{f}</span></li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="rounded-full bg-gold text-primary hover:bg-gold-soft h-12 px-6">
                <a href={waLink()} target="_blank" rel="noopener"><MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز الآن" : "Book transfer"}</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 h-12 px-6">
                <Link to="/{-$locale}/p/$slug" params={(prev: Record<string, string>) => ({ ...prev, slug: "airport-transfer" })}>{ar ? "تفاصيل خدمة استقبال المطار" : "See airport transfer details"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FLEET SHOWCASE ============ */}
      <section className="container-tight py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-2xl">
            <Eyebrow>{ar ? "الأسطول" : "The Fleet"}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-balance">
              {ar ? "سيارات مصانة بعناية، لكل نوع رحلة." : "A meticulously maintained fleet, for every kind of journey."}
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full"><Link to="/{-$locale}/fleet">{ar ? "استعرض الأسطول" : "View full fleet"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></Link></Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {data.fleet.slice(0, 3).map((c: any, i: number) => {
            const tr = c.vehicle_category_translations?.find((t: any) => t.locale === locale) || c.vehicle_category_translations?.[0];
            const img = categoryImage(c, i);
            const alt = categoryAlt(c, locale);
            return (
              <Link key={c.id} to="/{-$locale}/fleet" className="group">
                <article className="hover-lift overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[4/3] overflow-hidden bg-primary">
                    <img src={img} alt={alt} width={1200} height={800} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-2xl">{tr?.name ?? c.code}</h3>
                      <span className="text-xs uppercase tracking-wider text-gold flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.seats}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{tr?.description ?? ""}</p>
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{ar ? "من" : "From"}</span>
                      <span className="font-display text-xl">{c.base_fare} <span className="text-xs text-muted-foreground">/ ride</span></span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
          {data.fleet.length === 0 && (
            [{ img: FALLBACK_FLEET_IMAGES[0], name: ar ? "سيدان أعمال" : "Business Sedan" }, { img: FALLBACK_FLEET_IMAGES[1], name: "Executive SUV" }, { img: FALLBACK_FLEET_IMAGES[2], name: ar ? "فان جماعي" : "Group Van" }].map((v, i) => (
              <article key={i} className="hover-lift overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-[4/3] overflow-hidden bg-primary"><img src={v.img} alt={v.name} width={1200} height={800} loading="lazy" className="h-full w-full object-cover" /></div>
                <div className="p-6"><h3 className="font-display text-2xl">{v.name}</h3></div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ============ BUSINESS TRAVEL ============ */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="container-tight py-20 md:py-28 grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <Eyebrow>{ar ? "سفر الأعمال" : "Business Travel"}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-balance">
              {ar ? "مكتبك المتحرك، بين الاجتماعات." : "A quiet office between meetings."}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg">
              {ar
                ? "عقود شهرية للشركات، مدراء تنفيذيين، وموظفي الاستقبال — فوترة موحدة، تقارير مفصلة، وأولوية دائمة."
                : "Monthly corporate contracts for executives and account teams — consolidated billing, detailed reporting, priority dispatch."}
            </p>
            <ul className="space-y-3 text-sm">
              {[
                ar ? "فوترة شهرية موحدة" : "Consolidated monthly invoicing",
                ar ? "مدير حساب مخصص" : "Dedicated account manager",
                ar ? "تقارير الاستخدام" : "Usage & spend reports",
                ar ? "أولوية في الحجز" : "Priority dispatch",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-gold shrink-0" />{f}</li>
              ))}
            </ul>
            <Button asChild size="lg" className="rounded-full h-12 px-6 mt-2">
              <a href={waLink(ar ? "عقود الشركات" : "Corporate contract inquiry")} target="_blank" rel="noopener">{ar ? "تحدث مع المبيعات" : "Talk to sales"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></a>
            </Button>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl order-1 lg:order-2">
            <img src={businessImg} alt="Business travel" width={1200} height={900} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* ============ POPULAR ROUTES ============ */}
      <section className="container-tight py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Eyebrow>{ar ? "الوجهات" : "Destinations"}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">{ar ? "الطرق الأكثر طلباً" : "Most travelled routes"}</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { slug: "taxi-jeddah", ar: "تاكسي جدة", en: "Taxi Jeddah", sub_ar: "توصيل داخل جدة", sub_en: "Jeddah city transfers" },
            { slug: "jeddah-to-makkah-taxi", ar: "تاكسي من جدة إلى مكة", en: "Jeddah to Makkah Taxi", sub_ar: "توصيل مباشر 24 ساعة", sub_en: "24/7 Direct transfer" },
            { slug: "makkah-to-madinah-taxi", ar: "تاكسي مكة إلى المدينة", en: "Makkah to Madinah Taxi", sub_ar: "نقل بين الحرمين", sub_en: "Inter-Holy Mosque transfer" },
            { slug: "jeddah-airport-taxi", ar: "تاكسي مطار جدة", en: "Jeddah Airport Taxi", sub_ar: "استقبال من المطار", sub_en: "Airport meet & greet" },
            { slug: "taxi-makkah", ar: "تاكسي مكة", en: "Taxi Makkah", sub_ar: "نقل الحرم والفنادق", sub_en: "Haram & hotel transfers" },
            { slug: "taxi-madinah", ar: "تاكسي المدينة المنورة", en: "Taxi Madinah", sub_ar: "زيارات الحرم والمدينة", sub_en: "Prophet's Mosque transfers" },
            { slug: "taxi-taif", ar: "تاكسي الطائف", en: "Taxi Taif", sub_ar: "توصيل المطار والمنتزهات", sub_en: "Airport & resort transfers" },
            { slug: "taxi-riyadh", ar: "تاكسي الرياض", en: "Taxi Riyadh", sub_ar: "توصيل العاصمة والمطار", sub_en: "Capital & airport rides" },
            { slug: "taxi-dammam", ar: "تاكسي الدمام", en: "Taxi Dammam", sub_ar: "نقل المنطقة الشرقية", sub_en: "Eastern Province transfers" },
          ].map((c) => (
            <a key={c.slug} href={`/${locale}/${c.slug}`} className="group rounded-2xl border border-border bg-card p-6 hover:border-gold transition-colors">
              <MapPin className="h-5 w-5 text-gold mb-3" />
              <div className="font-display text-xl mb-1">{ar ? c.ar : c.en}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">{ar ? c.sub_ar : c.sub_en}</div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                {ar ? "عرض" : "View"} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </span>
            </a>
          ))}
          {data.cities.slice(0, 4).map((c) => (
            <Link key={c.id} to="/{-$locale}/p/$slug" params={(prev: Record<string, string>) => ({ ...prev, slug: c.slug })} className="group rounded-2xl border border-border bg-card p-6 hover:border-gold transition-colors">
              <MapPin className="h-5 w-5 text-gold mb-3" />
              <div className="font-display text-xl mb-1">{ar ? c.title_ar : c.title_en}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">{ar ? c.subtitle_ar : c.subtitle_en}</div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                {ar ? "عرض" : "View"} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
      </section>


      {/* ============ TESTIMONIALS ============ */}
      {data.testimonials.length > 0 && (
        <section className="bg-primary text-primary-foreground">
          <div className="container-tight py-20 md:py-28">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
              <Eyebrow>{ar ? "الشهادات" : "Testimonials"}</Eyebrow>
              <h2 className="font-display text-4xl md:text-5xl leading-tight">{ar ? "كلمات من عملائنا" : "In our clients' words"}</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {data.testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.03] p-8">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
                  </div>
                  <blockquote className="font-display text-lg leading-snug text-primary-foreground/95 mb-6">
                    “{ar ? t.quote_ar : t.quote_en}”
                  </blockquote>
                  <figcaption className="text-sm">
                    <div className="font-semibold text-primary-foreground">{t.name}</div>
                    <div className="text-primary-foreground/60 text-xs mt-0.5">{ar ? t.role_ar : t.role_en}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FAQ ============ */}
      {data.faqs.length > 0 && (
        <section className="container-tight py-20 md:py-28 max-w-4xl">
          <div className="text-center space-y-4 mb-10">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">{ar ? "أسئلة متكررة" : "Common questions"}</h2>
          </div>
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card divide-y divide-border">
            {data.faqs.slice(0, 5).map((f) => (
              <AccordionItem key={f.id} value={f.id} className="border-b-0 px-6">
                <AccordionTrigger className="text-start font-medium text-base py-5">{ar ? f.question_ar : f.question_en}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{ar ? f.answer_ar : f.answer_en}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="rounded-full"><Link to="/{-$locale}/faq">{ar ? "كل الأسئلة" : "See all questions"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></Link></Button>
          </div>
        </section>
      )}

      {/* ============ FINAL CTA ============ */}
      <section className="container-tight pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 shadow-lift">
          <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <Eyebrow>{ar ? "احجز الآن" : "Book now"}</Eyebrow>
              <h2 className="font-display text-4xl md:text-5xl leading-tight text-balance">
                {ar ? "رحلتك القادمة تبدأ بمحادثة." : "Your next ride is one message away."}
              </h2>
              <p className="text-primary-foreground/70 max-w-md">
                {ar ? "تواصل معنا الآن — استجابة فورية على مدار الساعة." : "Reach our dispatch desk 24/7 — instant confirmation."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild size="lg" className="rounded-full bg-gold text-primary hover:bg-gold-soft h-12 px-6">
                <a href={waLink()} target="_blank" rel="noopener"><MessageCircle className="h-5 w-5 me-2" />WhatsApp</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 h-12 px-6">
                <a href={telLink()}><Phone className="h-5 w-5 me-2" />{SITE.phone}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
