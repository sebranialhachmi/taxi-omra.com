import { createFileRoute, notFound } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getVehicleCategoryByCode, listVehicleCategories } from "@/lib/public.functions";
import { breadcrumbJsonLd, vehicleJsonLd } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, ChevronRight, Users } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { categoryImage, categoryGallery, categoryAlt } from "@/lib/fleet-images";

const opts = (code: string) =>
  queryOptions({
    queryKey: ["public", "vehicle", code],
    queryFn: async () => {
      const [row, all] = await Promise.all([
        getVehicleCategoryByCode({ data: { code } }),
        listVehicleCategories(),
      ]);
      if (!row) throw notFound();
      return { row, related: (all ?? []).filter((r: any) => r.code !== code).slice(0, 6) };
    },
  });

function pickTr(row: any, locale: "ar" | "en") {
  const tr = (row?.vehicle_category_translations ?? []).find((t: any) => t.locale === locale);
  return {
    name: tr?.name ?? row?.code ?? "",
    description: tr?.description ?? "",
  };
}

export const Route = createFileRoute("/_public/{-$locale}/fleet/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.slug)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const row: any = loaderData.row;
    const locale = (params.locale ?? "ar") as "ar" | "en";
    const en = pickTr(row, "en");
    const cur = pickTr(row, locale);
    const url = `/${locale}/fleet/${row.code}`;
    const title = `${cur.name} — ${SITE.brand[locale]}`;
    const desc = cur.description || `${en.name} with ${row.seats} seats.`;
    const hero = categoryImage(row);
    const ogImage = hero?.startsWith("http") ? hero : `${SITE.url}${hero}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
      ],
      links: [],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            vehicleJsonLd({
              name: en.name,
              description: en.description,
              seatingCapacity: row.seats,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: `/${locale}` },
              { name: "Fleet", url: `/${locale}/fleet` },
              { name: en.name, url },
            ]),
          ),
        },
      ],
    };
  },
  component: VehicleDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
    </div>
  ),
});

function VehicleDetail() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const params = Route.useParams();
  const { data } = useSuspenseQuery(opts(params.slug));
  const row: any = data.row;
  const cur = pickTr(row, locale);
  const bookText = `${cur.name} — ${ar ? "أرغب بالحجز" : "I'd like to book"}`;

  return (
    <>
      <nav
        aria-label={ar ? "مسار التنقل" : "Breadcrumb"}
        className="container mx-auto px-4 pt-6 text-sm text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <a href={withLocale(locale, "/")} className="hover:text-foreground">
              {ar ? "الرئيسية" : "Home"}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            <a href={withLocale(locale, "/fleet")} className="hover:text-foreground">
              {ar ? "الأسطول" : "Fleet"}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            <span aria-current="page" className="text-foreground">{cur.name}</span>
          </li>
        </ol>
      </nav>

      <section className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
        <div className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1 mb-4 uppercase tracking-wide">
          {ar ? "من أسطولنا" : "From our fleet"}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{cur.name}</h1>

        {(() => {
          const gallery = categoryGallery(row);
          const alt = categoryAlt(row, locale);
          return (
            <div className="mb-8 space-y-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted">
                <img src={gallery[0]} alt={alt} width={1600} height={1000} decoding="async" loading="eager" fetchPriority="high" className="h-full w-full object-cover" />
              </div>
              {gallery.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {gallery.slice(0, 6).map((src, i) => (
                    <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                      <img src={src} alt={`${alt} — ${i + 1}`} width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <p className="text-lg text-muted-foreground mb-6">{cur.description}</p>
        <dl className="grid gap-4 sm:grid-cols-3 my-8">
          <div className="rounded-xl border p-4">
            <dt className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> {ar ? "المقاعد" : "Seats"}
            </dt>
            <dd className="text-2xl font-bold">{row.seats}</dd>
          </div>
          <div className="rounded-xl border p-4">
            <dt className="text-xs uppercase text-muted-foreground mb-1">{ar ? "التعرفة الأساسية" : "Base fare"}</dt>
            <dd className="text-2xl font-bold">{Number(row.base_fare).toFixed(2)}</dd>
          </div>
          <div className="rounded-xl border p-4">
            <dt className="text-xs uppercase text-muted-foreground mb-1">{ar ? "سعر الكيلومتر" : "Per km"}</dt>
            <dd className="text-2xl font-bold">{Number(row.price_per_km).toFixed(2)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <a href={waLink(bookText)} target="_blank" rel="noopener">
              <MessageCircle className="h-4 w-4 me-2" />
              {ar ? "احجز عبر واتساب" : "Book on WhatsApp"}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={telLink()}>
              <Phone className="h-4 w-4 me-2" />{SITE.phone}
            </a>
          </Button>
        </div>
      </section>

      <CityLongContent page={`fleet-${data.row.code}`} />
      {data.related.length > 0 && (
        <section className="container mx-auto px-4 pb-20 max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">
            {ar ? "مركبات أخرى" : "Other vehicles"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.related.map((r: any, i: number) => {
              const t = pickTr(r, locale);
              const img = categoryImage(r, i);
              const alt = categoryAlt(r, locale);
              return (
                <a
                  key={r.id}
                  href={withLocale(locale, `/fleet/${r.code}`)}
                  className="group block rounded-xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={img} alt={alt} width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold mb-1 group-hover:text-primary">{t.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {r.seats}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
