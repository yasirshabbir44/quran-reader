import type { QuranSurahPayload } from '../quran/quran-data.service';
import type { MushafIndexPayload, VerseRef } from '../mushaf/mushaf-index.types';
import { verseRefKey } from '../mushaf/mushaf-slice.util';

export function buildVerseOrdinals(surahs: readonly QuranSurahPayload[]): {
  readonly ordinalByKey: ReadonlyMap<string, number>;
  readonly total: number;
} {
  const ordinalByKey = new Map<string, number>();
  let ordinal = 0;
  for (const s of surahs) {
    for (let ayah = 1; ayah <= s.versesCount; ayah++) {
      ordinal += 1;
      ordinalByKey.set(verseRefKey({ surah: s.number, ayah }), ordinal);
    }
  }
  return { ordinalByKey, total: ordinal };
}

export function verseOrdinal(
  ref: VerseRef,
  ordinalByKey: ReadonlyMap<string, number>,
): number {
  return ordinalByKey.get(verseRefKey(ref)) ?? 0;
}

export function compareVerseRefs(
  a: VerseRef,
  b: VerseRef,
  ordinalByKey: ReadonlyMap<string, number>,
): number {
  return verseOrdinal(a, ordinalByKey) - verseOrdinal(b, ordinalByKey);
}

/** Last verse (inclusive) of each juz in mushaf order. */
export function buildJuzEndOrdinals(
  index: MushafIndexPayload,
  ordinalByKey: ReadonlyMap<string, number>,
): ReadonlyMap<number, number> {
  const ends = new Map<number, number>();
  for (let i = 0; i < index.juz.length; i++) {
    const juz = index.juz[i]!.juz;
    const next = index.juz[i + 1];
    const endRef: VerseRef = next
      ? stepBackFromStart(next.start, ordinalByKey)
      : { surah: 114, ayah: 6 };
    const ord = verseOrdinal(endRef, ordinalByKey);
    if (ord > 0) {
      ends.set(juz, ord);
    }
  }
  return ends;
}

function stepBackFromStart(start: VerseRef, ordinalByKey: ReadonlyMap<string, number>): VerseRef {
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

export function juzCompletedCount(
  furthestOrdinal: number,
  juzEndOrdinals: ReadonlyMap<number, number>,
): number {
  let count = 0;
  for (const endOrd of juzEndOrdinals.values()) {
    if (furthestOrdinal >= endOrd) {
      count += 1;
    }
  }
  return count;
}
