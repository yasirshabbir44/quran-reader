/**
 * Validates khatam progress math against bundled Quran + mushaf data.
 * Run: node scripts/validate-khatam.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function verseRefKey(ref) {
  return `${ref.surah}:${ref.ayah}`;
}

function buildVerseOrdinals(surahs) {
  const ordinalByKey = new Map();
  let ordinal = 0;
  for (const s of surahs) {
    for (let ayah = 1; ayah <= s.versesCount; ayah++) {
      ordinal += 1;
      ordinalByKey.set(verseRefKey({ surah: s.number, ayah }), ordinal);
    }
  }
  return { ordinalByKey, total: ordinal };
}

function verseOrdinal(ref, ordinalByKey) {
  return ordinalByKey.get(verseRefKey(ref)) ?? 0;
}

function stepBackFromStart(start, ordinalByKey) {
  const startOrd = verseOrdinal(start, ordinalByKey);
  if (startOrd <= 1) {
    return { surah: 1, ayah: 1 };
  }
  for (const [key, ord] of ordinalByKey) {
    if (ord === startOrd - 1) {
      const colon = key.indexOf(':');
      return {
        surah: Number(key.slice(0, colon)),
        ayah: Number(key.slice(colon + 1)),
      };
    }
  }
  return start;
}

function buildJuzEndOrdinals(index, ordinalByKey) {
  const ends = new Map();
  for (let i = 0; i < index.juz.length; i++) {
    const juz = index.juz[i].juz;
    const next = index.juz[i + 1];
    const endRef = next
      ? stepBackFromStart(next.start, ordinalByKey)
      : { surah: 114, ayah: 6 };
    const ord = verseOrdinal(endRef, ordinalByKey);
    if (ord > 0) {
      ends.set(juz, ord);
    }
  }
  return ends;
}

function juzCompletedCount(furthestOrdinal, juzEndOrdinals) {
  let count = 0;
  for (const endOrd of juzEndOrdinals.values()) {
    if (furthestOrdinal >= endOrd) {
      count += 1;
    }
  }
  return count;
}

const corpus = JSON.parse(readFileSync(join(ROOT, 'public/quran-full.json'), 'utf8'));
const mushaf = JSON.parse(readFileSync(join(ROOT, 'public/mushaf-index.json'), 'utf8'));
const { ordinalByKey, total } = buildVerseOrdinals(corpus.surahs);
const juzEnds = buildJuzEndOrdinals(mushaf, ordinalByKey);
const lastOrd = verseOrdinal({ surah: 114, ayah: 6 }, ordinalByKey);

const checks = [
  ['6236 verses in corpus', total === 6236],
  ['30 juz boundaries', juzEnds.size === 30],
  ['last verse is ordinal 6236', lastOrd === total],
  ['114:6 completes khatam', lastOrd >= total],
  ['114:6 completes all juz', juzCompletedCount(lastOrd, juzEnds) === 30],
  ['juz 1 ends at 2:141', juzEnds.get(1) === verseOrdinal({ surah: 2, ayah: 141 }, ordinalByKey)],
];

let failed = 0;
for (const [label, ok] of checks) {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${label}`);
  if (!ok) {
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log('\nAll khatam validation checks passed.');
