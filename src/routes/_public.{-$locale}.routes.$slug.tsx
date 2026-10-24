import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getCmsPageByType, listRelatedCmsPages } from "@/lib/public.functions";
import { buildCmsHead, breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";
import { faqJsonLdFor } from "@/lib/page-content";
import { ContentDetail } from "@/components/public/ContentDetail";
import { useI18n } from "@/lib/i18n";

const opts = (slug: string) =>
  queryOptions({
    queryKey: ["public", "route", slug],
    queryFn: async () => {
      const [page, related] = await Promise.all([
        getCmsPageByType({ data: { slug, type: "route_page" } }),
        listRelatedCmsPages({ data: { type: "route_page", excludeSlug: slug, limit: 6 } }),
      ]);
      if (!page) throw notFound();
      return { page, related };
    },
  });

export const Route = createFileRoute("/_public/{-$locale}/routes/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.slug)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const p: any = loaderData.page;
    const head = buildCmsHead(p, (params.locale ?? "ar") === "en" ? "en" : "ar");
    const locale = params.locale ?? "ar";
    const url = `/${locale}/routes/${p.slug}`;
    head.scripts = [
      ...(head.scripts ?? []),
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({ name: p.title_en, description: p.subtitle_en ?? undefined, url }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", url: `/${locale}` },
            { name: "Routes", url: `/${locale}/routes` },
            { name: p.title_en, url },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqJsonLdFor(p as any, (params.locale ?? "ar") as "ar" | "en")),
      },
    ];
    return head;
  },
  component: RouteDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
    </div>
  ),
});

function RouteDetail() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const params = Route.useParams();
  const { data } = useSuspenseQuery(opts(params.slug));
  return (
    <ContentDetail
      page={data.page as any}
      section={{ slug: "routes", ar: "الرحلات بين المدن", en: "Intercity Routes" }}
      breadcrumbs={[
        { name: ar ? "الرئيسية" : "Home", to: "/" },
        { name: ar ? "الرحلات" : "Routes", to: "/routes" },
        { name: ar ? data.page.title_ar : data.page.title_en, to: `/routes/${data.page.slug}` },
      ]}
      related={data.related as any}
      relatedRoutePattern="/routes/$slug"
    />
  );
}
