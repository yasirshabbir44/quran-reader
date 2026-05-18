/**
 * Builds mushaf page and juz boundaries (15-line Madinah) from Quran.com metadata.
 * Run: node scripts/build-mushaf-index.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'mushaf-index.json');

const API = 'https://api.quran.com/api/v4';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  return res.json();
}

async function fetchChapterMeta(chapter) {
  const data = await fetchJson(
    `${API}/verses/by_chapter/${chapter}?per_page=300&words=false&translations=false`,
  );
  return data.verses.map((v) => ({
    surah: chapter,
    ayah: v.verse_number,
    page: v.page_number,
    juz: v.juz_number,
  }));
}

function verseKey(surah, ayah) {
  return `${surah}:${ayah}`;
}

function main() {
  return (async () => {
    const all = [];
    for (let chapter = 1; chapter <= 114; chapter++) {
      const rows = await fetchChapterMeta(chapter);
      all.push(...rows);
      process.stdout.write(`\rChapter ${chapter}/114`);
      await new Promise((r) => setTimeout(r, 80));
    }
    process.stdout.write('\n');

    const pageStarts = [];
    const juzStarts = [];
    let lastPage = 0;
    let lastJuz = 0;

    for (const row of all) {
      if (row.page !== lastPage) {
        pageStarts.push({ page: row.page, start: { surah: row.surah, ayah: row.ayah }, juz: row.juz });
        lastPage = row.page;
      }
      if (row.juz !== lastJuz) {
        juzStarts.push({ juz: row.juz, start: { surah: row.surah, ayah: row.ayah }, page: row.page });
        lastJuz = row.juz;
      }
    }

    const versePage = new Map();
    const verseJuz = new Map();
    for (const row of all) {
      const key = verseKey(row.surah, row.ayah);
      versePage.set(key, row.page);
      verseJuz.set(key, row.juz);
    }

    const payload = {
      edition: 'madinah-15-line',
      source: 'quran.com/api/v4',
      pages: pageStarts,
      juz: juzStarts,
      versePage: Object.fromEntries(versePage),
      verseJuz: Object.fromEntries(verseJuz),
    };

    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(payload), 'utf8');
    const kb = (Buffer.byteLength(JSON.stringify(payload), 'utf8') / 1024).toFixed(1);
    console.log(`Wrote ${OUT} (${kb} KiB), ${pageStarts.length} pages, ${juzStarts.length} juz.`);
  })();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
