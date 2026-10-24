// HTML sitemap for humans — bilingual, lists all indexable pages.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_LOCALE, type Locale, withLocale } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_public/{-$locale}/sitemap")({
  head: ({ params }) => {
    const locale = (params.locale ?? DEFAULT_LOCALE) as Locale;
    const title = locale === "ar" ? `خريطة الموقع | ${SITE.brand.ar}` : `Site Map | ${SITE.brand.en}`;
    const description = locale === "ar"
      ? `خريطة كاملة لجميع صفحات موقع ${SITE.brand.ar}.`
      : `Complete site map — every page on ${SITE.brand.en}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: HtmlSitemap,
});

function HtmlSitemap() {
  const { locale = DEFAULT_LOCALE } = Route.useParams();
  const l = locale as Locale;
  const isAr = l === "ar";

  const { data } = useQuery({
    queryKey: ["sitemap-html"],
    queryFn: async () => {
      const [pages, posts, cats] = await Promise.all([
        supabase.from("cms_pages").select("slug,page_type,title_en,title_ar").eq("published", true).order("sort_order"),
        supabase.from("blog_posts").select("slug,title_en,title_ar").eq("published", true).order("created_at", { ascending: false }),
        supabase.from("vehicle_categories").select("code,name_en,name_ar").eq("is_active", true).order("sort_order"),
      ]);
      return {
        pages: pages.data ?? [],
        posts: posts.data ?? [],
        cats: cats.data ?? [],
      };
    },
  });

  const t = isAr
    ? { title: "خريطة الموقع", main: "الصفحات الرئيسية", services: "الخدمات", cities: "المدن", airports: "المطارات", routes: "المسارات", fleet: "الأسطول", blog: "المدونة", legal: "قانوني" }
    : { title: "Site Map", main: "Main Pages", services: "Services", cities: "Cities", airports: "Airports", routes: "Routes", fleet: "Fleet", blog: "Blog", legal: "Legal" };

  const pfx = (p: string) => withLocale(l, p);
  const main = [
    { p: "/", label: isAr ? "الرئيسية" : "Home" },
    { p: "/about", label: isAr ? "من نحن" : "About" },
    { p: "/services", label: isAr ? "الخدمات" : "Services" },
    { p: "/fleet", label: isAr ? "الأسطول" : "Fleet" },
    { p: "/airport-transfers", label: isAr ? "نقل المطار" : "Airport Transfers" },
    { p: "/taxi-jeddah", label: isAr ? "تاكسي جدة" : "Taxi Jeddah" },
    { p: "/jeddah-airport-taxi", label: isAr ? "تاكسي مطار جدة" : "Jeddah Airport Taxi" },
    { p: "/taxi-makkah", label: isAr ? "تاكسي مكة" : "Taxi Makkah" },
    { p: "/taxi-madinah", label: isAr ? "تاكسي المدينة المنورة" : "Taxi Madinah" },
    { p: "/blog", label: isAr ? "المدونة" : "Blog" },
    { p: "/faq", label: "FAQ" },
    { p: "/contact", label: isAr ? "اتصل بنا" : "Contact" },
  ];
  const legal = [
    { p: "/privacy", label: isAr ? "الخصوصية" : "Privacy" },
    { p: "/terms", label: isAr ? "الشروط" : "Terms" },
    { p: "/refund", label: isAr ? "الاسترداد" : "Refund" },
    { p: "/cancellation", label: isAr ? "الإلغاء" : "Cancellation" },
  ];

  const by = (type: string) => (data?.pages ?? []).filter((p: any) => p.page_type === type);
  const services = by("service");
  const cities = by("city");
  const airports = by("airport");
  const routes = by("route_page");

  const Section = ({ title, items }: { title: string; items: { p: string; label: string }[] }) => (
    <section className="mb-8">
      <h2 className="mb-3 border-b border-border pb-2 font-serif text-xl">{title}</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {items.map((i: any) => (
          <li key={i.p || i.path}>
            <Link to={pfx(i.p || i.path)} className="text-sm text-muted-foreground hover:text-foreground hover:underline">{i.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-serif text-4xl">{t.title}</h1>
      <Section title={t.main} items={main} />
      {services.length > 0 && <Section title={t.services} items={services.map((s: any) => ({ p: `/services/${s.slug}`, label: isAr ? s.title_ar : s.title_en }))} />}
      {cities.length > 0 && <Section title={t.cities} items={cities.map((s: any) => ({ p: `/cities/${s.slug}`, label: isAr ? s.title_ar : s.title_en }))} />}
      {airports.length > 0 && <Section title={t.airports} items={airports.map((s: any) => ({ p: `/airports/${s.slug}`, label: isAr ? s.title_ar : s.title_en }))} />}
      {routes.length > 0 && <Section title={t.routes} items={routes.map((s: any) => ({ p: `/routes/${s.slug}`, label: isAr ? s.title_ar : s.title_en }))} />}
      {(data?.cats?.length ?? 0) > 0 && <Section title={t.fleet} items={(data?.cats ?? []).map((c: any) => ({ p: `/fleet/${c.code}`, label: isAr ? c.name_ar : c.name_en }))} />}
      {(data?.posts?.length ?? 0) > 0 && <Section title={t.blog} items={(data?.posts ?? []).map((p: any) => ({ p: `/blog/${p.slug}`, label: isAr ? p.title_ar : p.title_en }))} />}
      <Section title={t.legal} items={legal} />
    </div>
  );
}
