# 09 · Decision Checklist — "Would this beat competitors?"

Attach this checklist to every design, SEO, or dev decision before merge. If any answer is **No**, iterate until it becomes **Yes**.

## For any new page

- [ ] Unique title ≤ 60 chars, keyword-first, better than the best competitor's title for this query.
- [ ] Unique description ≤ 160 chars with a clear CTA.
- [ ] Single H1 matching primary query; H2/H3 hierarchy consistent.
- [ ] ≥ 800 words of unique bilingual content (AR + EN), no auto-translation.
- [ ] Canonical URL set via env-driven `SITE_URL`.
- [ ] Reciprocal `hreflang` alternates + `x-default`.
- [ ] JSON-LD: at minimum BreadcrumbList + the type this page represents (Service, Trip, Airport, Vehicle, Article, FAQPage).
- [ ] Included in the correct split sitemap.
- [ ] Internal links: at least 3 inbound from related hubs, at least 3 outbound to relevant hubs.
- [ ] Images: descriptive filenames, bilingual alt, AVIF/WebP, LQIP.
- [ ] Sticky Phone FAB + WhatsApp FAB present; primary CTA in hero.

## For any design change

- [ ] Uses design tokens (Noir & Gold), no hardcoded colours.
- [ ] RTL and LTR verified on mobile + desktop.
- [ ] Focus rings visible, colour contrast ≥ AA.
- [ ] No layout shift ≥ 0.05 introduced.

## For any SEO change

- [ ] Beats the best competitor on the target axis (see §07 scoreboard).
- [ ] JSON-LD validates.
- [ ] Sitemap updated.
- [ ] No regression in canonical / hreflang / og tags on adjacent pages.

## For any performance change

- [ ] LCP < 2.0 s, INP < 200 ms, CLS < 0.05 at p75 on 4G mobile.
- [ ] Bundle budget respected; no new blocking scripts on public routes.

## For any booking / conversion change

- [ ] On-site form path preserved; WhatsApp deep-link fallback preserved.
- [ ] Thank-you page returns `noindex` and confirms next steps.
- [ ] Phone + WhatsApp remain one tap from any page.

## Governance

- Reviewer must reference this checklist by section in the PR/turn description.
- Any deviation requires an explicit note in `docs/competitor-analysis/` and a follow-up ticket.

**Frozen:** v1.0 · re-audit cadence quarterly.
