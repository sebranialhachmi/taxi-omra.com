# 04 · Competitor SEO Audit

| SEO element | Best in set | Median | Jeddah Travels target |
|---|---|---|---|
| Titles | Focused (`{Service} in Jeddah · Brand`) | Generic / duplicated | Unique per route, ≤60 chars, keyword-first |
| Descriptions | Present, generic | Truncated or missing | Unique, ≤160 chars, CTA + phone hint |
| Canonicals | Set on most | Missing on some | Every page, env-driven `SITE_URL` |
| Robots | Standard `Allow: /` | Some block staging leaks | Clean allow + dynamic sitemap ref |
| XML Sitemap | Monolithic | Missing on 3+ | Split index (pages, cities, airports, routes, blog) |
| Schema | LocalBusiness only | Minimal / none | LocalBusiness + BreadcrumbList + FAQPage + Service + Trip + Article + Vehicle + WebSite/SearchAction |
| Breadcrumb | Visual on 2 sites | Missing | Visual + BreadcrumbList JSON-LD site-wide |
| Internal Links | Sparse | Sparse | Reciprocal city↔airport↔route hubs |
| Image SEO | Filenames + partial alt | Missing alt | Bilingual alt, descriptive filenames, LQIP, AVIF/WebP |
| Open Graph | Present, generic | Present | Per-route og:title/description; leaf og:image only |
| Twitter Cards | `summary_large_image` on premium sites | Missing | Consistent site-wide |
| hreflang | None on most | None | Reciprocal AR/EN + `x-default` |
| Core Web Vitals | Mid-tier | Weak on mobile | Green LCP/CLS/INP on 4G mobile |
| Page Experience | Ok | Weak | AA a11y, HTTPS, no interstitials |

## Notable competitor SEO defects to exploit

1. **No route-pair pages** at scale → programmatic route SEO is uncontested.
2. **No per-terminal KAIA pages** → clear ranking opportunity for terminal-level queries.
3. **Weak or missing FAQPage schema** → rich results gap.
4. **Monolingual or partial bilingual** → reciprocal hreflang gives us both markets.
5. **Sparse internal linking** → topical hubs (airport → routes → cities → vehicles) will accrue authority faster.
