/**
 * Merges story posts from public/blog-index.json with topic articles from
 * blog-articles.seed.mjs, generates cover SVGs, and writes public/blog-index.json.
 *
 * Run: node scripts/build-blog-index.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import seed from './blog-articles.seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STORIES_PATH = join(ROOT, 'src', 'app', 'data', 'blog-stories.seed.json');
const BLOG_DIR = join(ROOT, 'public', 'blog');
const OUT = join(ROOT, 'public', 'blog-index.json');

const CATEGORY_COLORS = {
  'quranic-stories': ['#1a3a2e', '#0d1f18'],
  prophets: ['#2a2840', '#120a1a'],
  companions: ['#3a1a2a', '#1a0a12'],
  'islamic-history': ['#4a3520', '#1a1208'],
  'islamic-beliefs': ['#1e2a4a', '#0f1528'],
  'quranic-teachings': ['#1a3a28', '#0a1a12'],
  salah: ['#2a4060', '#0a1525'],
  sawm: ['#3a2a10', '#1a1008'],
  'sunnah-hadith': ['#2a1a3a', '#120a1a'],
  tawhid: ['#1a2840', '#081018'],
  hajj: ['#3a3010', '#1a1808'],
  lifestyle: ['#2a3a30', '#101a14'],
  history: ['#3d2e1a', '#1a1208'],
};

const CATEGORY_TAGS = {
  'quranic-stories': ['stories', 'tafseer', 'quran'],
  prophets: ['prophets', 'stories', 'history'],
  companions: ['companions', 'stories', 'history'],
  'islamic-history': ['history', 'stories'],
  'islamic-beliefs': ['aqeedah'],
  'quranic-teachings': ['tafseer', 'quran'],
  salah: ['worship', 'fiqh'],
  sawm: ['worship', 'fiqh'],
  'sunnah-hadith': ['hadith', 'fiqh'],
  tawhid: ['aqeedah', 'tafseer'],
  hajj: ['worship', 'fiqh'],
  lifestyle: ['daily-life', 'fiqh'],
  history: ['history'],
};

const ARTICLE_TAG_OVERRIDES = {
  'how-women-pray-islam': ['women-in-islam'],
  'marriage-rules-islam': ['women-in-islam'],
  'rights-of-women-islam': ['women-in-islam'],
  'rights-of-children-islam': ['daily-life'],
  'honor-parents-islam': ['daily-life'],
  'kufi-hat-men-islam': ['daily-life'],
  'taharah-cleanliness': ['daily-life'],
  'evil-eye-islam': ['daily-life'],
  'sadaqah-jariyah': ['daily-life'],
  'types-of-hadith': ['hadith'],
  'hadith-and-quran-importance': ['hadith'],
};

function resolvePostTags(postId, categoryId) {
  const base = CATEGORY_TAGS[categoryId] ?? [];
  const extra = ARTICLE_TAG_OVERRIDES[postId] ?? [];
  return [...new Set([...base, ...extra])];
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapTitle(title, maxLen = 42) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxLen && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function writeCoverSvg(postId, titleEn, categoryId) {
  const [c1, c2] = CATEGORY_COLORS[categoryId] ?? ['#1a3a2e', '#0d1f18'];
  const lines = wrapTitle(titleEn);
  const titleY = 200 - (lines.length - 1) * 14;
  const titleSvg = lines
    .map(
      (ln, i) =>
        `<text x="400" y="${titleY + i * 32}" text-anchor="middle" fill="#e8d5a3" font-family="Georgia,serif" font-size="26" font-weight="bold">${escapeXml(ln)}</text>`,
    )
    .join('\n  ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="${escapeXml(titleEn)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <circle cx="680" cy="70" r="35" fill="#c9a227" opacity="0.35"/>
  ${titleSvg}
</svg>
`;
  const path = join(BLOG_DIR, `${postId}.svg`);
  writeFileSync(path, svg, 'utf8');
  return `/blog/${postId}.svg`;
}

function loc(text) {
  if (typeof text === 'string') {
    return { en: text, ur: text, ar: text };
  }
  return text;
}

function buildSections(article) {
  const sections = [];
  for (const p of article.paragraphs) {
    sections.push({
      type: 'paragraph',
      text: loc(p),
    });
  }
  if (article.quote) {
    const q = article.quote;
    sections.push({
      type: 'quote',
      arabic: q.arabic,
      ref: q.ref,
      text: { en: q.en, ur: q.ur, ar: q.ar },
    });
  }
  return sections;
}

function topicToPost(article) {
  const image = writeCoverSvg(article.id, article.title.en, article.categoryId);
  const wordCount = article.paragraphs.reduce((n, p) => n + (p.en?.length ?? 0), 0);
  const readMinutes = Math.max(3, Math.min(8, Math.round(wordCount / 900) + 3));
  return {
    id: article.id,
    categoryId: article.categoryId,
    publishedAt: article.publishedAt,
    image,
    imageAlt: {
      en: article.title.en,
      ur: article.title.ur,
      ar: article.title.ar,
    },
    readMinutes,
    tags: resolvePostTags(article.id, article.categoryId),
    ...(article.relatedSurah ? { relatedSurah: article.relatedSurah } : {}),
    title: loc(article.title),
    excerpt: loc(article.excerpt),
    sections: buildSections(article),
  };
}

function calcStoryReadMinutes(sections) {
  let words = 0;
  for (const s of sections) {
    if (s.text?.en) {
      words += s.text.en.split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(4, Math.min(18, Math.round(words / 200) + 2));
}

function loadStoryPosts() {
  if (!existsSync(STORIES_PATH)) {
    console.warn(`No stories at ${STORIES_PATH}; skipping story posts.`);
    return [];
  }
  return JSON.parse(readFileSync(STORIES_PATH, 'utf8')).map((post) => ({
    ...post,
    tags: resolvePostTags(post.id, post.categoryId),
    readMinutes: calcStoryReadMinutes(post.sections),
  }));
}

function main() {
  mkdirSync(BLOG_DIR, { recursive: true });

  const storyPosts = loadStoryPosts();
  const topicPosts = seed.topicArticles.map(topicToPost);

  const allPosts = [...storyPosts, ...topicPosts].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  const payload = {
    categories: seed.categories,
    tags: seed.tags,
    posts: allPosts,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(
    `Wrote ${OUT} — ${allPosts.length} posts (${storyPosts.length} stories + ${topicPosts.length} topics), ${seed.categories.length} categories, ${seed.tags.length} tags.`,
  );
}

main();
