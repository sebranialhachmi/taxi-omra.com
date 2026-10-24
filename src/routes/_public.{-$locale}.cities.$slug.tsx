import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getCmsPageByType, listRelatedCmsPages } from "@/lib/public.functions";
import { buildCmsHead, breadcrumbJsonLd } from "@/lib/seo";
import { faqJsonLdFor } from "@/lib/page-content";
import { ContentDetail } from "@/components/public/ContentDetail";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

const opts = (slug: string) =>
  queryOptions({
    queryKey: ["public", "city", slug],
    queryFn: async () => {
      const [page, related] = await Promise.all([
        getCmsPageByType({ data: { slug, type: "city" } }),
        listRelatedCmsPages({ data: { type: "city", excludeSlug: slug, limit: 6 } }),
      ]);
      if (!page) throw notFound();
      return { page, related };
    },
  });

export const Route = createFileRoute("/_public/{-$locale}/cities/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.slug)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const p: any = loaderData.page;
    const head = buildCmsHead(p, (params.locale ?? "ar") === "en" ? "en" : "ar");
    const locale = params.locale ?? "ar";
    const url = `/${locale}/cities/${p.slug}`;
    head.scripts = [
      ...(head.scripts ?? []),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Place",
          name: p.title_en,
          description: p.subtitle_en ?? undefined,
          image: p.hero_image_url ?? undefined,
          address: { "@type": "PostalAddress", addressCountry: SITE.country, addressLocality: p.title_en },
          url,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", url: `/${locale}` },
            { name: "Cities", url: `/${locale}/cities` },
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
  component: CityDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
    </div>
  ),
});

function CityDetail() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const params = Route.useParams();
  const { data } = useSuspenseQuery(opts(params.slug));
  return (
    <ContentDetail
      page={data.page as any}
      section={{ slug: "cities", ar: "مدن الخدمة", en: "Service Cities" }}
      breadcrumbs={[
        { name: ar ? "الرئيسية" : "Home", to: "/" },
        { name: ar ? "المدن" : "Cities", to: "/cities" },
        { name: ar ? data.page.title_ar : data.page.title_en, to: `/cities/${data.page.slug}` },
      ]}
      related={data.related as any}
      relatedRoutePattern="/cities/$slug"
    />
  );
}
