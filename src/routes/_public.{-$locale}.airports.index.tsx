import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCmsPages } from "@/lib/public.functions";
import { ArrowRight, Plane } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { absoluteUrl, brandTitle } from "@/lib/site-info";
import { breadcrumbJsonLd } from "@/lib/seo";
import { isConsolidatedDuplicate } from "@/lib/canonical-redirects";

const opts = () =>
  queryOptions({
    queryKey: ["public", "airports"],
    queryFn: async () => await listCmsPages({ data: { type: "airport" } }),
  });

export const Route = createFileRoute("/_public/{-$locale}/airports/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const isAr = locale === "ar";
    const path = `/${locale}/airports`;
    const url = absoluteUrl(path);
    const title = isAr
      ? `توصيل المطارات — مطار جدة والمدينة والطائف والرياض | ${'تاكسي العمرة'}`
      : brandTitle("Airport transfers — Jeddah, Madinah, Taif, Riyadh", "en");
    const description = isAr
      ? "خدمة توصيل من مطار الملك عبدالعزيز بجدة ومطار الأمير محمد بن عبدالعزيز بالمدينة ومطاري الطائف والرياض مع استقبال في الصالة وأسعار ثابتة."
      : "Meet-and-greet chauffeur transfers from King Abdulaziz (Jeddah), Prince Mohammad Bin Abdulaziz (Madinah), Taif and Riyadh airports.";
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
              { name: "Airports", url: path },
            ]),
          ),
        },
      ],
    };
  },
  component: AirportsIndex,
});

function AirportsIndex() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data: airports } = useSuspenseQuery(opts());

  return (
    <section className="container-tight py-16 md:py-24">
      <div className="max-w-3xl space-y-5 mb-14">
        <span className="eyebrow">
          <span className="h-px w-8 bg-gold" />
          {ar ? "المطارات" : "Airports"}
        </span>
        <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
          {ar ? "توصيل من وإلى المطارات." : "Airport transfers, on time, every time."}
        </h1>
        <p className="text-lg text-muted-foreground">
          {ar
            ? "خدمة استقبال وتوديع من جميع المطارات الرئيسية في المملكة، ٢٤ ساعة."
            : "Meet-and-greet chauffeur service at every major Saudi airport, 24/7."}
        </p>
      </div>

      {airports.length === 0 ? (
        <p className="text-muted-foreground">
          {ar ? "سيتم إضافة صفحات المطارات قريبًا." : "Airport pages will appear here soon."}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {airports.filter((a: any) => !isConsolidatedDuplicate(`/airports/${a.slug}`)).map((a: any, i: number) => (
            <Link key={a.id} to="/{-$locale}/airports/$slug" params={(prev: Record<string, string>) => ({ ...prev, slug: a.slug })} className="group">
              <article className="hover-lift h-full flex flex-col rounded-2xl border border-border bg-card p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-primary transition-colors">
                    <Plane className="h-5 w-5" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider text-gold mb-2">
                  {ar ? "مطار" : "Airport"}
                </div>
                <h2 className="font-display text-2xl mb-3">{ar ? a.title_ar : a.title_en}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {ar ? a.subtitle_ar : a.subtitle_en}
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
