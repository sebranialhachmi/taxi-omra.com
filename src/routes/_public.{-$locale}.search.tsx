// /search — client-side filter over published CMS pages + blog posts.
// PAGES.md requires this route (noindex).
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { listCmsPages, listBlogPosts } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const opts = queryOptions({
  queryKey: ["public", "search-index"],
  queryFn: async () => {
    const [pages, posts] = await Promise.all([listCmsPages({ data: {} }), listBlogPosts()]);
    return { pages: pages ?? [], posts: posts ?? [] };
  },
});

export const Route = createFileRoute("/_public/{-$locale}/search")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  head: ({ params }) => {
    const isAr = (params?.locale ?? "ar") === "ar";
    return {
      meta: [
        { title: isAr ? "بحث — تاكسي العمرة" : "Search — Omra Taxi" },
        { name: "robots", content: "noindex,follow" },
        { name: "description", content: isAr ? "ابحث في موقع تاكسي العمرة عن المدن والمطارات والمسارات والمدونة." : "Search Omra Taxi for cities, airports, routes and blog articles." },
        { property: "og:title", content: isAr ? "بحث — تاكسي العمرة" : "Search — Omra Taxi" },
        { property: "og:description", content: isAr ? "ابحث في موقع تاكسي العمرة." : "Search the Omra Taxi site." },
      ],
    };
  },
  component: SearchPage,
});

function pageHref(pageType: string, slug: string): string {
  switch (pageType) {
    case "city": return `/cities/${slug}`;
    case "airport": return `/airports/${slug}`;
    case "route": return `/routes/${slug}`;
    case "service": return `/services/${slug}`;
    case "vehicle": return `/fleet/${slug}`;
    default: return `/p/${slug}`;
  }
}

function SearchPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data } = useSuspenseQuery(opts);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as Array<{ title: string; href: string; kind: string }>;
    const out: Array<{ title: string; href: string; kind: string }> = [];
    for (const p of data.pages as any[]) {
      const t = ar ? (p.title_ar ?? p.title_en) : (p.title_en ?? p.title_ar);
      const hay = `${p.title_en ?? ""} ${p.title_ar ?? ""} ${p.subtitle_en ?? ""} ${p.subtitle_ar ?? ""} ${p.slug}`.toLowerCase();
      if (hay.includes(term)) out.push({ title: t, href: `/${locale}${pageHref(p.page_type, p.slug)}`, kind: p.page_type });
    }
    for (const b of data.posts as any[]) {
      const t = ar ? (b.title_ar ?? b.title_en) : (b.title_en ?? b.title_ar);
      const hay = `${b.title_en ?? ""} ${b.title_ar ?? ""} ${b.excerpt_en ?? ""} ${b.excerpt_ar ?? ""} ${b.slug}`.toLowerCase();
      if (hay.includes(term)) out.push({ title: t, href: `/${locale}/blog/${b.slug}`, kind: "blog" });
    }
    return out.slice(0, 50);
  }, [q, data, ar, locale]);

  return (
    <div className="container-tight py-16 min-h-[60vh]">
      <h1 className="font-display text-3xl md:text-4xl mb-6">{ar ? "بحث" : "Search"}</h1>
      <div className="relative max-w-xl">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? "ابحث عن مدينة، مطار، خدمة، مقال…" : "Search a city, airport, service, article…"}
          className="ps-9"
          aria-label={ar ? "بحث" : "Search"}
        />
      </div>

      <div className="mt-8">
        {q.trim() && results.length === 0 && (
          <p className="text-muted-foreground">{ar ? "لا توجد نتائج." : "No results."}</p>
        )}
        <ul className="divide-y divide-border/60">
          {results.map((r, i) => (
            <li key={i} className="py-3">
              <Link to={r.href} className="flex items-center justify-between gap-4 hover:text-primary">
                <span className="font-medium">{r.title}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{r.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
