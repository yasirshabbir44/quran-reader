/**
 * Validates thematic-index.seed.json, optionally checks verse refs against
 * public/quran-full.json, computes per-theme verse counts, and writes
 * public/thematic-index.json for offline use in the app.
 *
 * Run: node scripts/build-thematic-index.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SEED = join(ROOT, 'src', 'app', 'data', 'thematic-index.seed.json');
const QURAN = join(ROOT, 'public', 'quran-full.json');
const OUT = join(ROOT, 'public', 'thematic-index.json');

function verseKey(surah, ayah) {
  return `${surah}:${ayah}`;
}

function loadJson(path, label) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (e) {
    throw new Error(`Cannot read ${label} at ${path}: ${e.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${label}: ${e.message}`);
  }
}

function buildVerseIndex(quran) {
  const index = new Map();
  for (const s of quran.surahs) {
    const ayahSet = new Set(s.verses.map((v) => v.ayah));
    index.set(s.number, ayahSet);
  }
  return index;
}

function assertVerseExists(verseIndex, surah, ayah, ctx) {
  const ayahs = verseIndex.get(surah);
  if (!ayahs) {
    throw new Error(`${ctx}: unknown surah ${surah}`);
  }
  if (!ayahs.has(ayah)) {
    throw new Error(`${ctx}: surah ${surah} has no ayah ${ayah}`);
  }
}

function validateSeed(seed) {
  if (typeof seed.version !== 'number' || seed.version < 1) {
    throw new Error('seed.version must be a positive number');
  }
  if (!Array.isArray(seed.categories) || seed.categories.length === 0) {
    throw new Error('seed.categories must be a non-empty array');
  }
  if (!Array.isArray(seed.themes) || seed.themes.length === 0) {
    throw new Error('seed.themes must be a non-empty array');
  }
  if (!Array.isArray(seed.mappings)) {
    throw new Error('seed.mappings must be an array');
  }

  const categoryIds = new Set();
  for (const c of seed.categories) {
    if (!c?.id || typeof c.id !== 'string') {
      throw new Error('Each category needs a string id');
    }
    if (!c?.name || typeof c.name !== 'string') {
      throw new Error(`Category "${c.id}" needs a string name`);
    }
    if (categoryIds.has(c.id)) {
      throw new Error(`Duplicate category id "${c.id}"`);
    }
    categoryIds.add(c.id);
  }

  const themeIds = new Set();
  for (const t of seed.themes) {
    if (!t?.id || typeof t.id !== 'string') {
      throw new Error('Each theme needs a string id');
    }
    if (themeIds.has(t.id)) {
      throw new Error(`Duplicate theme id "${t.id}"`);
    }
    if (!t?.name || typeof t.name !== 'string') {
      throw new Error(`Theme "${t.id}" needs a string name`);
    }
    if (!categoryIds.has(t.categoryId)) {
      throw new Error(`Theme "${t.id}" references unknown category "${t.categoryId}"`);
    }
    themeIds.add(t.id);
  }

  const mappingKeys = new Set();
  const counts = new Map([...themeIds].map((id) => [id, new Set()]));

  for (const m of seed.mappings) {
    const ctx = `mapping themeId="${m?.themeId}" surah=${m?.surah} ayah=${m?.ayah}`;
    if (!m?.themeId || !themeIds.has(m.themeId)) {
      throw new Error(`${ctx}: unknown themeId`);
    }
    if (!Number.isInteger(m.surah) || m.surah < 1 || m.surah > 114) {
      throw new Error(`${ctx}: surah must be an integer 1–114`);
    }
    if (!Number.isInteger(m.ayah) || m.ayah < 1) {
      throw new Error(`${ctx}: ayah must be a positive integer`);
    }
    const key = `${m.themeId}|${verseKey(m.surah, m.ayah)}`;
    if (mappingKeys.has(key)) {
      throw new Error(`${ctx}: duplicate mapping for the same theme and verse`);
    }
    mappingKeys.add(key);
    counts.get(m.themeId).add(verseKey(m.surah, m.ayah));
  }

  for (const id of themeIds) {
    if (counts.get(id).size === 0) {
      throw new Error(`Theme "${id}" has no verse mappings`);
    }
  }

  return counts;
}

function main() {
  const seed = loadJson(SEED, 'thematic-index.seed.json');
  const verseCounts = validateSeed(seed);

  let verseIndex = null;
  if (existsSync(QURAN)) {
    const quran = loadJson(QURAN, 'quran-full.json');
    verseIndex = buildVerseIndex(quran);
    for (const m of seed.mappings) {
      assertVerseExists(
        verseIndex,
        m.surah,
        m.ayah,
        `mapping themeId="${m.themeId}"`,
      );
    }
  } else {
    console.warn(`Warning: ${QURAN} not found; skipping verse ref validation.`);
  }

  const themes = seed.themes.map((t) => ({
    id: t.id,
    name: t.name,
    categoryId: t.categoryId,
    ...(t.icon ? { icon: t.icon } : {}),
    ...(t.description ? { description: t.description } : {}),
    verseCount: verseCounts.get(t.id).size,
  }));

  const categories = [...seed.categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const payload = {
    version: seed.version,
    categories,
    themes,
    mappings: seed.mappings.map((m) => ({
      themeId: m.themeId,
      surah: m.surah,
      ayah: m.ayah,
    })),
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload), 'utf8');

  const mappingCount = payload.mappings.length;
  const themeCount = payload.themes.length;
  console.log(
    `Wrote ${OUT} — ${themeCount} themes, ${mappingCount} mappings, ${categories.length} categories.`,
  );
}

main();
