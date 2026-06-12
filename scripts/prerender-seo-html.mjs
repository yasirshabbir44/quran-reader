/**
 * Generates per-route index.html files with unique SEO meta tags for crawlers.
 * Run after `ng build`: node scripts/prerender-seo-html.mjs
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist', 'surah-mulk-reader', 'browser');
const SEO_CONFIG = join(ROOT, 'src', 'app', 'core', 'seo', 'seo.config.ts');
const EN_I18N = join(ROOT, 'src', 'app', 'i18n', 'en.json');
const BLOG_INDEX = join(ROOT, 'public', 'blog-index.json');
const THEMATIC_INDEX = join(ROOT, 'public', 'thematic-index.json');
const MUSHAF_INDEX = join(ROOT, 'public', 'mushaf-index.json');
const QURAN_FULL = join(ROOT, 'public', 'quran-full.json');

function readSiteUrl() {
  const fromEnv = process.env.SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const config = readFileSync(SEO_CONFIG, 'utf8');
  const match = config.match(/siteUrl:\s*['"]([^'"]+)['"]/);
  return (match?.[1] ?? 'https://qurandaily.live').replace(/\/$/, '');
}

function translate(template, params = {}) {
  let s = template;
  for (const [k, v] of Object.entries(params)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function upsertMeta(html, attr, key, content) {
  const selector = `${attr}="${key}"`;
  const tag = `<meta ${attr}="${key}" content="${xmlEscape(content)}">`;
  const pattern = new RegExp(`<meta ${attr}="${key}" content="[^"]*">`);
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertLink(html, rel, href) {
  const tag = `<link rel="${rel}" href="${xmlEscape(href)}">`;
  const pattern = new RegExp(`<link rel="${rel}" href="[^"]*">`);
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${xmlEscape(title)}</title>`);
}

function upsertJsonLd(html, jsonLd) {
  const cleaned = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,
    '',
  );
  const script = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return cleaned.replace('</head>', `    ${script}\n  </head>`);
}

function applySeo(template, { title, description, path, type = 'website', noindex = false, jsonLd }) {
  const siteUrl = readSiteUrl();
  const url = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const image = `${siteUrl}/og-image.svg`;
  let html = template;
  html = upsertTitle(html, title);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  html = upsertLink(html, 'canonical', url);
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:type', type);
  html = upsertMeta(html, 'property', 'og:url', url);
  html = upsertMeta(html, 'property', 'og:site_name', 'QuranDaily');
  html = upsertMeta(html, 'property', 'og:locale', 'en_US');
  html = upsertMeta(html, 'property', 'og:image', image);
  html = upsertMeta(html, 'property', 'og:image:alt', title);
  html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMeta(html, 'name', 'twitter:title', title);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = upsertMeta(html, 'name', 'twitter:image', image);
  html = upsertMeta(html, 'name', 'twitter:image:alt', title);
  if (jsonLd) {
    html = upsertJsonLd(html, jsonLd);
  }
  return html;
}

function writeRouteHtml(routePath, html) {
  const outDir =
    routePath === '/'
      ? DIST
      : join(DIST, ...routePath.split('/').filter(Boolean));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
}

function main() {
  const siteUrl = readSiteUrl();
  const template = readFileSync(join(DIST, 'index.html'), 'utf8');
  const i18n = JSON.parse(readFileSync(EN_I18N, 'utf8'));
  const blog = JSON.parse(readFileSync(BLOG_INDEX, 'utf8'));
  const themes = JSON.parse(readFileSync(THEMATIC_INDEX, 'utf8'));
  const mushaf = JSON.parse(readFileSync(MUSHAF_INDEX, 'utf8'));
  const quran = JSON.parse(readFileSync(QURAN_FULL, 'utf8'));

  let count = 0;

  writeRouteHtml(
    '/',
    applySeo(template, {
      title: i18n.documentTitleHome,
      description: i18n.seoHomeDescription,
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'QuranDaily',
        url: siteUrl,
        description: i18n.seoHomeDescription,
      },
    }),
  );
  count++;

  writeRouteHtml(
    '/blog',
    applySeo(template, {
      title: i18n.blogDocumentTitle,
      description: i18n.seoBlogIndexDescription,
      path: '/blog',
    }),
  );
  count++;

  writeRouteHtml(
    '/themes',
    applySeo(template, {
      title: i18n.themesDocumentTitle,
      description: i18n.seoThemesIndexDescription,
      path: '/themes',
    }),
  );
  count++;

  for (const surah of quran.surahs) {
    writeRouteHtml(
      `/${surah.number}`,
      applySeo(template, {
        title: translate(i18n.documentTitleSurah, {
          name: surah.nameAr,
          num: surah.number,
        }),
        description: translate(i18n.seoSurahDescription, {
          name: surah.nameAr,
          translit: surah.nameTranslit,
          num: surah.number,
        }),
        path: `/${surah.number}`,
        type: 'book',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Chapter',
          name: surah.nameTranslit,
          alternateName: surah.nameAr,
          position: surah.number,
          isPartOf: {
            '@type': 'Book',
            name: 'The Holy Quran',
            inLanguage: 'ar',
            url: siteUrl,
          },
          url: `${siteUrl}/${surah.number}`,
          numberOfPages: surah.versesCount,
        },
      }),
    );
    count++;
  }

  for (const page of mushaf.pages) {
    writeRouteHtml(
      `/page/${page.page}`,
      applySeo(template, {
        title: translate(i18n.documentTitlePage, { page: page.page }),
        description: translate(i18n.seoPageDescription, { page: page.page }),
        path: `/page/${page.page}`,
      }),
    );
    count++;
  }

  for (const juz of mushaf.juz ?? []) {
    writeRouteHtml(
      `/juz/${juz.juz}`,
      applySeo(template, {
        title: translate(i18n.documentTitleJuz, { juz: juz.juz }),
        description: translate(i18n.seoJuzDescription, { juz: juz.juz }),
        path: `/juz/${juz.juz}`,
      }),
    );
    count++;
  }

  for (const post of blog.posts) {
    const title = post.title?.en ?? post.id;
    const excerpt = post.excerpt?.en ?? '';
    writeRouteHtml(
      `/blog/${post.id}`,
      applySeo(template, {
        title: translate(i18n.blogDetailDocumentTitle, { title }),
        description: excerpt,
        path: `/blog/${post.id}`,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: excerpt,
          image: post.image?.startsWith('http') ? post.image : `${siteUrl}${post.image}`,
          datePublished: post.publishedAt,
          author: { '@type': 'Organization', name: 'QuranDaily' },
          publisher: {
            '@type': 'Organization',
            name: 'QuranDaily',
            logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` },
          },
          mainEntityOfPage: `${siteUrl}/blog/${post.id}`,
        },
      }),
    );
    count++;
  }

  for (const theme of themes.themes) {
    writeRouteHtml(
      `/themes/${theme.id}`,
      applySeo(template, {
        title: translate(i18n.themesDetailDocumentTitle, {
          name: theme.name,
        }),
        description: translate(i18n.seoThemeDetailDescription, {
          name: theme.name,
          description: theme.description,
        }),
        path: `/themes/${theme.id}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: theme.name,
          description: theme.description,
          url: `${siteUrl}/themes/${theme.id}`,
          isPartOf: { '@type': 'WebSite', name: 'QuranDaily', url: siteUrl },
        },
      }),
    );
    count++;
  }

  console.log(`Prerendered SEO HTML for ${count} routes into ${DIST}`);
}

main();
