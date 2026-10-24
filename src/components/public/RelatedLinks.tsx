import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listBlogPosts } from "@/lib/public.functions";
import { withLocale, type Locale } from "@/lib/i18n";

const WORDS = /[a-z]{3,}/g;
const STOP = new Set(["the", "and", "transfer", "taxi", "guide", "saudi"]);
const tokens = (slug: string) => new Set((slug.match(WORDS) ?? []).filter((w) => !STOP.has(w)));

/** Internal links under an article: the money pages plus the most related articles. */
export function RelatedLinks({ slug, locale }: { slug: string; locale: Locale }) {
  const ar = locale === "ar";
  const { data } = useQuery({ queryKey: ["public", "blog"], queryFn: () => listBlogPosts() });
  const mine = tokens(slug);
  const related = (data ?? [])
    .filter((p: any) => p.slug !== slug)
    .map((p: any) => ({ p, score: [...tokens(p.slug)].filter((t) => mine.has(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);

  const links = [
    { to: "/guide/taxi-fares", label: ar ? "أسعار التاكسي بين المدن والمطارات" : "Taxi fares between cities and airports" },
    { to: "/fleet", label: ar ? "أسطول السيارات والفئات" : "Our fleet and car classes" },
    { to: "/jeddah-to-makkah-taxi", label: ar ? "تاكسي من جدة إلى مكة" : "Taxi from Jeddah to Makkah" },
    { to: "/contact", label: ar ? "احجز رحلتك الآن" : "Book your trip now" },
  ];
  return (
    <aside className="mt-12 space-y-8 border-t pt-8" aria-label={ar ? "روابط ذات صلة" : "Related links"}>
      <div>
        <h2 className="mb-3 text-xl font-semibold">{ar ? "خدماتنا وأسعارنا" : "Our services and prices"}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map((l) => (
            <li key={l.to}><Link to={withLocale(locale, l.to) as any} className="text-primary underline-offset-4 hover:underline">{l.label}</Link></li>
          ))}
        </ul>
      </div>
      {related.length > 0 && (
        <div>
          <h2 className="mb-3 text-xl font-semibold">{ar ? "مقالات ذات صلة" : "Related articles"}</h2>
          <ul className="space-y-2">
            {related.map((p: any) => (
              <li key={p.slug}>
                <Link to={withLocale(locale, `/blog/${p.slug}`) as any} className="text-primary underline-offset-4 hover:underline">
                  {ar ? p.title_ar : p.title_en}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
