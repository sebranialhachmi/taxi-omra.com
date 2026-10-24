// Which database-driven pages Google may index. A page or post is indexable only
// when its `seo_released` flag is on (editable in the admin); everything else is
// served as "noindex, follow" and kept out of every sitemap. This keeps Google
// judging the site on a small set of strong pages instead of hundreds of
// templated ones.
export const isIndexedCms = (_slug: string, released = false) => released;
export const isIndexedBlog = (_slug: string, released = false) => released;
