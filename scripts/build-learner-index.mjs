/**
 * Validates learner.seed.json and writes public/learner-index.json.
 *
 * Run: node scripts/build-learner-index.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SEED = join(ROOT, 'src', 'app', 'data', 'learner.seed.json');
const OUT = join(ROOT, 'public', 'learner-index.json');

const KINDS = new Set(['letters', 'vowels', 'words', 'verse']);
const SKILLS = new Set(['reading', 'vocabulary']);

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

function assertLocalized(text, ctx) {
  if (!text?.en || typeof text.en !== 'string') {
    throw new Error(`${ctx}: missing en text`);
  }
  if (!text?.ur || typeof text.ur !== 'string') {
    throw new Error(`${ctx}: missing ur text`);
  }
  if (!text?.ar || typeof text.ar !== 'string') {
    throw new Error(`${ctx}: missing ar text`);
  }
}

function validateSeed(seed) {
  if (typeof seed.version !== 'number' || seed.version < 1) {
    throw new Error('seed.version must be a positive number');
  }
  if (!Array.isArray(seed.lessons) || seed.lessons.length === 0) {
    throw new Error('seed.lessons must be a non-empty array');
  }

  const lessonIds = new Set();
  for (const lesson of seed.lessons) {
    const ctx = `lesson "${lesson?.id}"`;
    if (!lesson?.id || typeof lesson.id !== 'string') {
      throw new Error('Each lesson needs a string id');
    }
    if (lessonIds.has(lesson.id)) {
      throw new Error(`Duplicate lesson id "${lesson.id}"`);
    }
    lessonIds.add(lesson.id);
    if (!KINDS.has(lesson.kind)) {
      throw new Error(`${ctx}: kind must be one of ${[...KINDS].join(', ')}`);
    }
    if (!SKILLS.has(lesson.skill)) {
      throw new Error(`${ctx}: skill must be one of ${[...SKILLS].join(', ')}`);
    }
    if (!lesson?.icon || typeof lesson.icon !== 'string') {
      throw new Error(`${ctx}: missing icon`);
    }
    assertLocalized(lesson.title, `${ctx} title`);
    assertLocalized(lesson.description, `${ctx} description`);
    if (!Array.isArray(lesson.items) || lesson.items.length === 0) {
      throw new Error(`${ctx}: items must be a non-empty array`);
    }

    const itemIds = new Set();
    for (const item of lesson.items) {
      const itemCtx = `${ctx} item "${item?.id}"`;
      if (!item?.id || typeof item.id !== 'string') {
        throw new Error(`${ctx}: each item needs a string id`);
      }
      if (itemIds.has(item.id)) {
        throw new Error(`${itemCtx}: duplicate item id`);
      }
      itemIds.add(item.id);
      if (!item?.arabic || typeof item.arabic !== 'string') {
        throw new Error(`${itemCtx}: missing arabic text`);
      }
      if (!item?.transliteration || typeof item.transliteration !== 'string') {
        throw new Error(`${itemCtx}: missing transliteration`);
      }
      assertLocalized(item.meaning, `${itemCtx} meaning`);
      if (item.tip !== undefined) {
        assertLocalized(item.tip, `${itemCtx} tip`);
      }
      if (item.verseRef !== undefined && typeof item.verseRef !== 'string') {
        throw new Error(`${itemCtx}: verseRef must be a string`);
      }
    }
  }
}

function main() {
  const seed = loadJson(SEED, 'learner.seed.json');
  validateSeed(seed);

  const payload = {
    version: seed.version,
    lessons: seed.lessons.map((lesson) => ({
      ...lesson,
      itemCount: lesson.items.length,
    })),
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload), 'utf8');
  console.log(
    `Wrote ${OUT} — ${payload.lessons.length} lessons, ${payload.lessons.reduce((n, l) => n + l.itemCount, 0)} items`,
  );
}

main();
