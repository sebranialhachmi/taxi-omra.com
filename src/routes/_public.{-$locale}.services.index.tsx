import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCmsPages } from "@/lib/public.functions";
import { ArrowRight, Plane, Building2, Briefcase, MapPin, Car, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";

const opts = () => queryOptions({
  queryKey: ["public", "services"],
  queryFn: async () => ({
    services: await listCmsPages({ data: { type: "service" } }),
    airports: await listCmsPages({ data: { type: "airport" } }),
  }),
});

const ICON: Record<string, any> = { service: Sparkles, airport: Plane, city: MapPin, route: Car, hotel: Building2, corporate: Briefcase };

export const Route = createFileRoute("/_public/{-$locale}/services/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params }) => {
    const ar = (params.locale ?? "ar") === "ar";
    const title = ar
      ? `الخدمات — نقل المطار والعمرة والسائق الخاص | ${SITE.brand.ar}`
      : `Services — Airport Transfers, Umrah & Private Chauffeur | ${SITE.brand.en}`;
    const description = ar
      ? "خدمات نقل احترافية: توصيل من مطار جدة إلى مكة والمدينة، باقات العمرة بسائق، عقود الشركات، والسائق بالساعة. أسعار ثابتة وسيارات حديثة."
      : "Professional transfer services: Jeddah Airport to Makkah and Madinah, Umrah packages with driver, corporate contracts, and hourly hire. Fixed fares, modern fleet.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({
          name: ar ? "خدمات النقل" : "Chauffeur & Airport Transfer Services",
          description,
          url: `${SITE.url}/${ar ? "ar" : "en"}/services`,
        })) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([
          { name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${ar ? "ar" : "en"}` },
          { name: ar ? "الخدمات" : "Services", url: `${SITE.url}/${ar ? "ar" : "en"}/services` },
        ])) },
      ],
    };
  },
  component: Services,
});

function Services() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data } = useSuspenseQuery(opts());
  const all = [...data.services, ...data.airports];
  return (
    <section className="container-tight py-16 md:py-24">
      <div className="max-w-3xl space-y-5 mb-14">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "الخدمات" : "Services"}</span>
        <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
          {ar ? "خدمات نقل مصممة بعناية، لكل مناسبة." : "Carefully crafted transportation, for every occasion."}
        </h1>
        <p className="text-lg text-muted-foreground">
          {ar ? "استعرض مجموعتنا الكاملة من خدمات النقل الفاخرة." : "Explore our complete range of premium chauffeur services."}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {all.filter((s: any) => !isConsolidatedDuplicate(`/services/${s.slug}`)).map((s, i) => {
          const Icon = ICON[s.slug] ?? ICON[s.page_type] ?? Sparkles;
          return (
            <Link key={s.id} to="/{-$locale}/p/$slug" params={(prev: Record<string, string>) => ({ ...prev, slug: s.slug })} className="group">
              <article className="hover-lift h-full flex flex-col rounded-2xl border border-border bg-card p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">0{i + 1}</span>
                </div>
                <div className="text-xs uppercase tracking-wider text-gold mb-2">{s.page_type}</div>
                <h2 className="font-display text-2xl mb-3">{ar ? s.title_ar : s.title_en}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{ar ? s.subtitle_ar : s.subtitle_en}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {ar ? "تفاصيل" : "Discover"} <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
