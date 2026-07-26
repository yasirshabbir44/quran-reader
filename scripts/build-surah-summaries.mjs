/**
 * Fetches Maududi chapter intros (EN + UR) and chapter metadata from Quran.com,
 * derives short summaries when missing, and writes public/surah-summaries.json
 * for offline use in the surah reader intro panel.
 *
 * Run: node scripts/build-surah-summaries.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'surah-summaries.json');
const MUSHAF = join(ROOT, 'public', 'mushaf-index.json');
const API = 'https://api.quran.com/api/v4';
const SHORT_MAX = 420;
const CONCURRENCY = 3;
const MAX_RETRIES = 5;

function stripHtml(html) {
  if (!html) {
    return '';
  }
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<\/\s*h[1-6]\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function deriveShort(shortText, detailText) {
  const short = stripHtml(shortText || '').replace(/\s+/g, ' ').trim();
  if (short) {
    return short.length > SHORT_MAX ? `${short.slice(0, SHORT_MAX - 1).trim()}…` : short;
  }
  const detail = (detailText || '').replace(/\s+/g, ' ').trim();
  if (!detail) {
    return '';
  }
  // Prefer text after the first heading-like label block when present.
  const withoutLeadLabel = detail.replace(
    /^(?:Name|Period of Revelation|Theme|نام|زمانہ\s*ٴ?نزول|مضمون)\s*[:：]?\s*/i,
    '',
  );
  const candidate = withoutLeadLabel || detail;
  if (candidate.length <= SHORT_MAX) {
    return candidate;
  }
  const cut = candidate.slice(0, SHORT_MAX);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('۔'), cut.lastIndexOf('؟'));
  if (lastStop > SHORT_MAX * 0.45) {
    return cut.slice(0, lastStop + 1).trim();
  }
  return `${cut.trim()}…`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      const wait = attempt * 1200;
      console.warn(`Retry ${attempt}/${MAX_RETRIES} for ${url}: ${err.message || err}`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function loadJuzLookup() {
  if (!existsSync(MUSHAF)) {
    console.warn('mushaf-index.json missing — juz fields will be omitted');
    return null;
  }
  const payload = JSON.parse(readFileSync(MUSHAF, 'utf8'));
  return payload.verseJuz ?? null;
}

async function main() {
  console.log('Fetching chapter catalogs…');
  const [enChapters, urChapters] = await Promise.all([
    fetchJson(`${API}/chapters?language=en`),
    fetchJson(`${API}/chapters?language=ur`),
  ]);

  const enById = new Map((enChapters.chapters || []).map((c) => [c.id, c]));
  const urById = new Map((urChapters.chapters || []).map((c) => [c.id, c]));
  const verseJuz = loadJuzLookup();
  const ids = Array.from({ length: 114 }, (_, i) => i + 1);

  console.log('Fetching chapter info (EN + UR)…');
  const surahs = await mapPool(ids, CONCURRENCY, async (id) => {
    const [enInfo, urInfo] = await Promise.all([
      fetchJson(`${API}/chapters/${id}/info?language=en`),
      fetchJson(`${API}/chapters/${id}/info?language=ur`),
    ]);

    const chapter = enById.get(id);
    const urChapter = urById.get(id);
    if (!chapter) {
      throw new Error(`Missing chapter ${id} in EN catalog`);
    }

    const enCi = enInfo.chapter_info || {};
    const urCi = urInfo.chapter_info || {};
    const detailEn = stripHtml(enCi.text || '');
    const detailUr = stripHtml(urCi.text || '');
    const summaryEn = deriveShort(enCi.short_text, detailEn);
    const summaryUr = deriveShort(urCi.short_text, detailUr);
    const pageStart = Array.isArray(chapter.pages) ? chapter.pages[0] : null;
    const juzKey = `${id}:1`;
    const juz = verseJuz?.[juzKey] ?? null;

    if (!summaryEn && !summaryUr) {
      console.warn(`Surah ${id}: no summary text`);
    }

    return {
      number: id,
      nameEn: chapter.translated_name?.name || chapter.name_simple,
      nameUr: urChapter?.translated_name?.name || '',
      nameTranslit: chapter.name_simple,
      revelationPlace: chapter.revelation_place === 'madinah' ? 'medinan' : 'meccan',
      revelationOrder: chapter.revelation_order,
      versesCount: chapter.verses_count,
      mushafPageStart: pageStart,
      juz,
      summaryEn,
      summaryUr,
      detailEn,
      detailUr,
      sourceEn: enCi.source || "Sayyid Abul Ala Maududi - Tafhim al-Qur'an",
      sourceUr: urCi.source || 'سید ابو اعلیٰ مودودیؒ - تفہیم القرآن',
    };
  });

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'quran.com/api/v4 chapter info (Maududi)',
    surahs,
  };

  writeFileSync(OUT, `${JSON.stringify(payload)}\n`, 'utf8');
  const bytes = Buffer.byteLength(JSON.stringify(payload));
  console.log(`Wrote ${OUT} (${surahs.length} surahs, ${Math.round(bytes / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
