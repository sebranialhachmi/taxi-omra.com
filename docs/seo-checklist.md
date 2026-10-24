# SEO checklist (taxi-omra.com)

Derived from the claude-seo skill set (technical, schema, hreflang, local, content, images, GEO) and the audit run on 2026-10-24.
Re-run the checks after every content batch; the admin editor also shows a live checklist per article/page.

## What the site already does
- Server-rendered HTML; canonical, robots meta, title, description and JSON-LD are in the first response.
- Self-referencing canonical and `hreflang` ar / en / x-default on every page, absolute HTTPS URLs.
- Single `/sitemap-index.xml` (pages, posts, fleet, images), `sitemap.xml` redirects to it, one `robots.txt` route.
- Only pages/posts with the "السماح لجوجل بفهرستها" flag are indexable and listed in sitemaps. Route and city pages are
  templated, so keep most of them `noindex` (doorway-page risk grows past ~30 location pages).
- Articles: Article + BreadcrumbList schema, absolute images, publisher, 5+ internal links, related articles.
- LocalBusiness + TaxiService entity (TaxiService alone has no address/geo).

## Targets used for review
| Item | Target |
|---|---|
| Title | 30-60 characters, unique, brand at the end |
| Meta description | 120-160 characters, written for the page |
| H1 | exactly one (the page/article title); H2/H3 inside the body |
| Service / location page | 800 / 500+ words |
| Blog post | 1,500 words is the review gate; current articles average ~730 |
| Images | alt on every non-decorative image, hero under 200 KB, WebP, no lazy-loading of the LCP image |
| Internal links | 5-10 per article |
| Core Web Vitals | LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 |

## Notes from the skills
- FAQPage rich results were retired by Google (May 2026): keep the existing markup, do not add new FAQPage for SERP gains.
- Never add HowTo schema. Use INP, not FID.
- `llms.txt` is ignored by Google Search; it is optional for other AI crawlers.
- robots.txt: allow `OAI-SearchBot`, `Claude-SearchBot` and `PerplexityBot` for AI search visibility. `GPTBot`, `ClaudeBot`,
  `CCBot` and `Applebot-Extended` are training-only; allow or block on licensing preference.
- Review counts/ratings in schema only if they are real and visible on the page.

## Owner tasks (outside the code)
- Google Business Profile (primary category: taxi service) and Bing Places, with the same name, phone and address as the site.
- Submit `https://taxi-omra.com/sitemap-index.xml` in Search Console and Bing Webmaster Tools.
- Redirect the old domain to this one with 301s, then watch the Pages report for "Soft 404" and "Crawled - not indexed".
- Expand the highest-intent articles (fares, airport pickup, Jeddah-Makkah, Makkah-Madinah) toward 1,500 words with real,
  first-hand detail (prices, timings, routes, drivers' experience).

## Automatic release (gradual indexing)
- Pages and articles stay hidden from Google (`seo_released` off) until the scheduler releases them. Static pages (home,
  Jeddah taxi, Jeddah airport taxi, Makkah/Madinah/Taif taxi, fares, about, fleet, contact, FAQ) are indexable from day one.
- `src/server/release.server.ts` checks hourly; every N days (default 3) it releases the next M ready items (default 2) in
  `release_priority` order. The first run releases the six most important items. Priority 900+ means manual only.
- An item is "ready" only if titles are 25-70 characters, descriptions 100-170, enough words in both languages, no H1 inside the
  body and every image has alt text (`db/release-rules.mjs`). Items that fail are skipped and the reasons are shown in
  /admin/release.
- A release puts the URL in the sitemaps and pings IndexNow (Bing/Yandex). Google has no API for "Request indexing" of normal
  pages (the Indexing API is for job postings and live streams only), so it discovers released URLs through the sitemap; the
  admin lists the released URLs so they can be pasted into Search Console's URL Inspection to speed it up.
- Settings: /admin/release (on/off, every N days, M per release, release now).
