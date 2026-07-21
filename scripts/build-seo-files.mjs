/**
 * Generates robots.txt and sitemap.xml for search engines.
 * Run: node scripts/build-seo-files.mjs
 *
 * Override production URL: SITE_URL=https://your-domain.com npm run build-seo-files
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SEO_CONFIG = join(ROOT, 'src', 'app', 'core', 'seo', 'seo.config.ts');
const BLOG_INDEX = join(ROOT, 'public', 'blog-index.json');
const ADHKAR_INDEX = join(ROOT, 'public', 'adhkar-index.json');
const LEARNER_INDEX = join(ROOT, 'public', 'learner-index.json');
const THEMATIC_INDEX = join(ROOT, 'public', 'thematic-index.json');
const MUSHAF_INDEX = join(ROOT, 'public', 'mushaf-index.json');
const PUBLIC = join(ROOT, 'public');

function readSiteUrl() {
  const fromEnv = process.env.SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const config = readFileSync(SEO_CONFIG, 'utf8');
  const match = config.match(/siteUrl:\s*['"]([^'"]+)['"]/);
  return (match?.[1] ?? 'https://qurandaily.live').replace(/\/$/, '');
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, { changefreq, priority, lastmod } = {}) {
  let xml = `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n`;
  if (lastmod) {
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
  }
  if (changefreq) {
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
  }
  if (priority !== undefined) {
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
  }
  xml += '  </url>\n';
  return xml;
}

function main() {
  const siteUrl = readSiteUrl();
  const today = new Date().toISOString().slice(0, 10);
  const blog = JSON.parse(readFileSync(BLOG_INDEX, 'utf8'));
  const adhkar = JSON.parse(readFileSync(ADHKAR_INDEX, 'utf8'));
  const learner = JSON.parse(readFileSync(LEARNER_INDEX, 'utf8'));
  const themes = JSON.parse(readFileSync(THEMATIC_INDEX, 'utf8'));
  const mushaf = JSON.parse(readFileSync(MUSHAF_INDEX, 'utf8'));

  const entries = [];

  entries.push(urlEntry(`${siteUrl}/`, { changefreq: 'daily', priority: 1.0, lastmod: today }));
  entries.push(urlEntry(`${siteUrl}/blog`, { changefreq: 'weekly', priority: 0.9, lastmod: today }));
  entries.push(urlEntry(`${siteUrl}/adhkar`, { changefreq: 'weekly', priority: 0.9, lastmod: today }));
  entries.push(urlEntry(`${siteUrl}/learn`, { changefreq: 'weekly', priority: 0.9, lastmod: today }));
  entries.push(urlEntry(`${siteUrl}/themes`, { changefreq: 'weekly', priority: 0.9, lastmod: today }));

  for (let n = 1; n <= 114; n++) {
    entries.push(urlEntry(`${siteUrl}/${n}`, { changefreq: 'monthly', priority: 0.8 }));
  }

  for (const page of mushaf.pages) {
    entries.push(urlEntry(`${siteUrl}/page/${page.page}`, { changefreq: 'monthly', priority: 0.5 }));
  }

  for (const juz of mushaf.juz ?? []) {
    entries.push(urlEntry(`${siteUrl}/juz/${juz.juz}`, { changefreq: 'monthly', priority: 0.5 }));
  }

  for (const post of blog.posts) {
    entries.push(
      urlEntry(`${siteUrl}/blog/${post.id}`, {
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: post.publishedAt,
      }),
    );
  }

  for (const collection of adhkar.collections) {
    entries.push(
      urlEntry(`${siteUrl}/adhkar/${collection.id}`, { changefreq: 'monthly', priority: 0.7 }),
    );
  }

  for (const lesson of learner.lessons) {
    entries.push(
      urlEntry(`${siteUrl}/learn/${lesson.id}`, { changefreq: 'monthly', priority: 0.7 }),
    );
  }

  for (const theme of themes.themes) {
    entries.push(urlEntry(`${siteUrl}/themes/${theme.id}`, { changefreq: 'monthly', priority: 0.7 }));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('')}</urlset>
`;

  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  const prerenderRoutes = [
    '/',
    '/blog',
    '/adhkar',
    '/learn',
    '/themes',
    ...Array.from({ length: 114 }, (_, i) => `/${i + 1}`),
    ...mushaf.pages.map((page) => `/page/${page.page}`),
    ...(mushaf.juz ?? []).map((juz) => `/juz/${juz.juz}`),
    ...blog.posts.map((post) => `/blog/${post.id}`),
    ...adhkar.collections.map((collection) => `/adhkar/${collection.id}`),
    ...learner.lessons.map((lesson) => `/learn/${lesson.id}`),
    ...themes.themes.map((theme) => `/themes/${theme.id}`),
  ];

  writeFileSync(join(PUBLIC, 'sitemap.xml'), sitemap, 'utf8');
  writeFileSync(join(PUBLIC, 'robots.txt'), robots, 'utf8');
  writeFileSync(join(ROOT, 'prerender-routes.txt'), `${prerenderRoutes.join('\n')}\n`, 'utf8');
  console.log(
    `Wrote sitemap.xml, robots.txt, and prerender-routes.txt — ${entries.length} URLs for ${siteUrl}`,
  );
}

main();
