/**
 * Validates adhkar.seed.json and writes public/adhkar-index.json.
 *
 * Run: node scripts/build-adhkar-index.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SEED = join(ROOT, 'src', 'app', 'data', 'adhkar.seed.json');
const OUT = join(ROOT, 'public', 'adhkar-index.json');

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
  if (!Array.isArray(seed.collections) || seed.collections.length === 0) {
    throw new Error('seed.collections must be a non-empty array');
  }

  const collectionIds = new Set();
  for (const collection of seed.collections) {
    const ctx = `collection "${collection?.id}"`;
    if (!collection?.id || typeof collection.id !== 'string') {
      throw new Error('Each collection needs a string id');
    }
    if (collectionIds.has(collection.id)) {
      throw new Error(`Duplicate collection id "${collection.id}"`);
    }
    collectionIds.add(collection.id);
    assertLocalized(collection.title, `${ctx} title`);
    assertLocalized(collection.description, `${ctx} description`);
    if (!Array.isArray(collection.items) || collection.items.length === 0) {
      throw new Error(`${ctx}: items must be a non-empty array`);
    }

    const itemIds = new Set();
    for (const item of collection.items) {
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
      assertLocalized(item.translation, `${itemCtx} translation`);
      if (item.repeat !== undefined && (!Number.isInteger(item.repeat) || item.repeat < 1)) {
        throw new Error(`${itemCtx}: repeat must be a positive integer`);
      }
    }
  }
}

function main() {
  const seed = loadJson(SEED, 'adhkar.seed.json');
  validateSeed(seed);

  const collections = [...seed.collections]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((collection) => ({
      id: collection.id,
      icon: collection.icon ?? 'hands',
      sortOrder: collection.sortOrder ?? 0,
      title: collection.title,
      description: collection.description,
      itemCount: collection.items.length,
      items: collection.items.map((item) => ({
        id: item.id,
        arabic: item.arabic,
        ...(item.transliteration ? { transliteration: item.transliteration } : {}),
        translation: item.translation,
        ...(item.repeat ? { repeat: item.repeat } : {}),
        ...(item.source ? { source: item.source } : {}),
      })),
    }));

  const payload = {
    version: seed.version,
    collections,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload), 'utf8');

  const itemCount = collections.reduce((n, c) => n + c.itemCount, 0);
  console.log(`Wrote ${OUT} — ${collections.length} collections, ${itemCount} adhkar items.`);
}

main();
