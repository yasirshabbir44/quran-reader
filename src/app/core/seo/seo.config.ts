/** Site-wide SEO defaults — update `siteUrl` to your production domain. */
export const SEO_SITE = {
  name: 'QuranDaily',
  /** Used in sitemap.xml at build time (override with SITE_URL env var). */
  siteUrl: 'https://qurandaily.live',
  defaultOgImage: '/og-image.svg',
  locale: 'en_US',
  twitterCard: 'summary_large_image',
} as const;
