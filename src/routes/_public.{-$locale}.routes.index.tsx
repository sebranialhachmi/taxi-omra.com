import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCmsPages } from "@/lib/public.functions";
import { ArrowRight, Route as RouteIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { absoluteUrl, brandTitle } from "@/lib/site-info";
import { breadcrumbJsonLd } from "@/lib/seo";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";

const opts = () =>
  queryOptions({
    queryKey: ["public", "routes"],
    queryFn: async () => await listCmsPages({ data: { type: "route_page" } }),
  });

export const Route = createFileRoute("/_public/{-$locale}/routes/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const path = `/${locale}/routes`;
    const url = absoluteUrl(path);
    const title = brandTitle(locale === "ar" ? "المسارات" : "Popular Routes", locale === "ar" ? "ar" : "en");
    const description = locale === "ar"
      ? "أشهر مسارات النقل الفاخر: جدة — مكة — المدينة — الطائف بأسعار شفافة."
      : "Popular chauffeur routes across Jeddah, Makkah, Madinah and Taif with transparent pricing.";
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
              { name: "Routes", url: path },
            ]),
          ),
        },
      ],
    };
  },
  component: RoutesIndex,
});

function RoutesIndex() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data: routes } = useSuspenseQuery(opts());

  return (
    <section className="container-tight py-16 md:py-24">
      <div className="max-w-3xl space-y-5 mb-14">
        <span className="eyebrow">
          <span className="h-px w-8 bg-gold" />
          {ar ? "المسارات" : "Routes"}
        </span>
        <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
          {ar ? "أشهر المسارات بأسعار شفافة." : "Popular routes, transparent prices."}
        </h1>
        <p className="text-lg text-muted-foreground">
          {ar
            ? "احجز مسارًا محددًا من وإلى المطارات والمدن المقدسة براحة وأمان."
            : "Book a fixed-price chauffeur transfer between our most-requested cities and holy sites."}
        </p>
      </div>

      {routes.length === 0 ? (
        <p className="text-muted-foreground">
          {ar ? "سيتم إضافة صفحات المسارات قريبًا." : "Route pages will appear here soon."}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {routes.filter((r: any) => !isConsolidatedDuplicate(`/routes/${r.slug}`)).map((r: any, i: number) => (
            <Link key={r.id} to="/{-$locale}/routes/$slug" params={(prev: Record<string, string>) => ({ ...prev, slug: r.slug })} className="group">
              <article className="hover-lift h-full flex flex-col rounded-2xl border border-border bg-card p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-primary transition-colors">
                    <RouteIcon className="h-5 w-5" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider text-gold mb-2">
                  {ar ? "مسار" : "Route"}
                </div>
                <h2 className="font-display text-2xl mb-3">{ar ? r.title_ar : r.title_en}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {ar ? r.subtitle_ar : r.subtitle_en}
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
    </section>
  );
}
