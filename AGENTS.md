<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Blog articles without uploaded cover media use stable topic-based local fallback photography, so listing cards and article pages never render blank image areas.
- The router uses the SSR query integration so server-loaded page data is reused in the browser; a failed client refetch must never replace rendered content (Google flagged that as Soft 404).
- robots.txt must keep `/_serverFn/` crawlable; Google needs those requests to render pages.
- CMS/blog indexability combines the baseline allowlist with database-reviewed releases; metadata and every XML sitemap use the same policy to prevent premature discovery.
- SEO releases run transactionally in PostgreSQL with a single-flight lock, persisted cadence, explicit review and content-revision invalidation; no AI calls or page-view-triggered work.
