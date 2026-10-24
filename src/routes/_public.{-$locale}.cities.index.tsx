import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCmsPages } from "@/lib/public.functions";
import { ArrowRight, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE, absoluteUrl, brandTitle } from "@/lib/site-info";
import { breadcrumbJsonLd } from "@/lib/seo";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";

const opts = () =>
  queryOptions({
    queryKey: ["public", "cities"],
    queryFn: async () => await listCmsPages({ data: { type: "city" } }),
  });

export const Route = createFileRoute("/_public/{-$locale}/cities/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const isAr = locale === "ar";
    const path = `/${locale}/cities`;
    const url = absoluteUrl(path);
    const title = isAr
      ? `المدن التي نخدمها — تاكسي جدة ومكة والمدينة والطائف والرياض | ${SITE.brand.ar}`
      : brandTitle("Cities we serve — Jeddah, Makkah, Madinah, Taif, Riyadh", "en");
    const description = isAr
      ? "تغطية تاكسي وسائق خاص في جدة ومكة المكرمة والمدينة المنورة والطائف والرياض — توصيل مطار على مدار الساعة ورحلات بين المدن."
      : "Explore taxi and chauffeur coverage across Jeddah, Makkah, Madinah, Taif and Riyadh — 24/7 airport transfers and intercity rides.";
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
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: `/${locale}` },
              { name: "Cities", url: path },
            ]),
          ),
        },
      ],
    };
  },
  component: CitiesIndex,
});

function CitiesIndex() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data: cities } = useSuspenseQuery(opts());

  return (
    <section className="container-tight py-16 md:py-24">
      <div className="max-w-3xl space-y-5 mb-14">
        <span className="eyebrow">
          <span className="h-px w-8 bg-gold" />
          {ar ? "المدن" : "Cities"}
        </span>
        <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
          {ar ? "مدن نخدمها في المملكة." : "Cities we serve across the Kingdom."}
        </h1>
        <p className="text-lg text-muted-foreground">
          {ar
            ? `نغطي ${SITE.city} والمدن المقدسة والوجهات السياحية الرئيسية على مدار الساعة.`
            : `Coverage across ${SITE.city}, the holy cities, and the Kingdom's key destinations — 24/7.`}
        </p>
      </div>

      {cities.length === 0 ? (
        <p className="text-muted-foreground">
          {ar ? "سيتم إضافة صفحات المدن قريبًا." : "City pages will appear here soon."}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cities.filter((c: any) => !isConsolidatedDuplicate(`/cities/${c.slug}`)).map((c: any, i: number) => (
            <Link key={c.id} to="/{-$locale}/cities/$slug" params={(prev: Record<string, string>) => ({ ...prev, slug: c.slug })} className="group">
              <article className="hover-lift h-full flex flex-col rounded-2xl border border-border bg-card p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-primary transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider text-gold mb-2">
                  {ar ? "مدينة" : "City"}
                </div>
                <h2 className="font-display text-2xl mb-3">{ar ? c.title_ar : c.title_en}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {ar ? c.subtitle_ar : c.subtitle_en}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {ar ? "تفاصيل" : "Discover"}{" "}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}

      <div className="max-w-3xl mt-20 space-y-5 text-muted-foreground leading-relaxed">
        {ar ? (
          <>
            <h2 className="font-display text-3xl text-foreground">دليل التنقل بالتاكسي بين مدن المملكة</h2>
            <p>نقدّم خدمة تاكسي خاص بسائقين محترفين في أبرز مدن المملكة العربية السعودية، مع تركيز خاص على رحلات المعتمرين والزوار بين جدة ومكة المكرمة والمدينة المنورة. يمكنك الحجز مسبقًا بسعر ثابت معلن قبل الرحلة، دون عدّاد ودون رسوم مفاجئة، مع استقبال من المطار أو الفندق أو أي عنوان تحدده.</p>
            <h3 className="font-display text-xl text-foreground">المدن المقدسة: مكة المكرمة والمدينة المنورة</h3>
            <p>أكثر الرحلات طلبًا هي من مطار الملك عبدالعزيز في جدة إلى فنادق الحرم بمكة، ومن مكة إلى المدينة المنورة عبر طريق الهجرة السريع. تستغرق رحلة جدة إلى مكة نحو ساعة، ورحلة مكة إلى المدينة نحو أربع ساعات ونصف، ويتوقف السائق عند الحاجة للصلاة أو الاستراحة، مع سيارات واسعة تتسع للعائلات والأمتعة.</p>
            <h3 className="font-display text-xl text-foreground">جدة والطائف والمدن الساحلية</h3>
            <p>في جدة نخدم المطار والكورنيش والفنادق والأحياء التجارية، ونوفّر رحلات إلى الطائف عبر طريق الهدا الجبلي، وإلى ينبع ورابغ على الساحل الغربي. هذه الرحلات مناسبة للعائلات والسياحة الصيفية ورحلات العمل.</p>
            <h3 className="font-display text-xl text-foreground">الرياض والمنطقة الشرقية والجنوب</h3>
            <p>نغطي أيضًا الرياض والدمام والخبر والقصيم وأبها وخميس مشيط وجازان ونجران والعلا وتبوك، بما في ذلك التوصيل من المطارات وبين المدن. اختر مدينتك من القائمة أعلاه لمعرفة المسارات المتاحة والأسعار التقريبية ومدة الرحلة، ثم احجز عبر النموذج أو واتساب.</p>
          </>
        ) : (
          <>
            <h2 className="font-display text-3xl text-foreground">A guide to taxi travel between Saudi cities</h2>
            <p>We run private taxi transfers with professional drivers across Saudi Arabia's main cities, with a strong focus on Umrah pilgrims and visitors travelling between Jeddah, Makkah and Madinah. Every ride is booked in advance at a fixed price confirmed before you travel — no meter and no surprise fees — with pickup from the airport, your hotel or any address you choose.</p>
            <h3 className="font-display text-xl text-foreground">The holy cities: Makkah and Madinah</h3>
            <p>The most requested trips are from King Abdulaziz International Airport in Jeddah to hotels near the Haram in Makkah, and from Makkah to Madinah on the Hijrah highway. Jeddah to Makkah takes about an hour; Makkah to Madinah takes around four and a half hours. Drivers stop for prayer or rest on request, and spacious vehicles fit families and luggage.</p>
            <h3 className="font-display text-xl text-foreground">Jeddah, Taif and the Red Sea coast</h3>
            <p>In Jeddah we cover the airport, the Corniche, hotels and business districts, with trips up the Al Hada mountain road to Taif and along the coast to Yanbu and Rabigh — ideal for families, summer trips and business travel.</p>
            <h3 className="font-display text-xl text-foreground">Riyadh, the Eastern Province and the south</h3>
            <p>We also serve Riyadh, Dammam, Khobar, Qassim, Abha, Khamis Mushait, Jazan, Najran, AlUla and Tabuk, including airport pickups and intercity rides. Pick your city above to see available routes, typical fares and journey times, then book online or on WhatsApp.</p>
          </>
        )}
      </div>
    </section>
  );
}
