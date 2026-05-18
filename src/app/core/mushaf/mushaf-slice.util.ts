import type { QuranFullPayload } from '../quran/quran-data.service';
import type { ReaderDisplayVerse } from '../../surah-reader/models/reader-display-verse.model';
import type { MushafIndexPayload, VerseRef } from './mushaf-index.types';

export function verseRefKey(ref: VerseRef): string {
  return `${ref.surah}:${ref.ayah}`;
}

export function pageForVerse(
  index: MushafIndexPayload,
  surah: number,
  ayah: number,
): number | null {
  return index.versePage[verseRefKey({ surah, ayah })] ?? null;
}

export function juzForVerse(
  index: MushafIndexPayload,
  surah: number,
  ayah: number,
): number | null {
  return index.verseJuz[verseRefKey({ surah, ayah })] ?? null;
}

function endBeforeNextStart(
  index: MushafIndexPayload,
  starts: readonly { readonly start: VerseRef }[],
  idx: number,
): VerseRef {
  const next = starts[idx + 1];
  if (next) {
    return next.start;
  }
  return { surah: 114, ayah: 6 };
}

export function versesForPage(
  page: number,
  corpus: QuranFullPayload,
  index: MushafIndexPayload,
): readonly ReaderDisplayVerse[] {
  const idx = index.pages.findIndex((p) => p.page === page);
  if (idx < 0) {
    return [];
  }
  const start = index.pages[idx]!.start;
  const end = endBeforeNextStart(index, index.pages, idx);
  return collectVersesInRange(corpus, start, end);
}

export function versesForJuz(
  juz: number,
  corpus: QuranFullPayload,
  index: MushafIndexPayload,
): readonly ReaderDisplayVerse[] {
  const idx = index.juz.findIndex((j) => j.juz === juz);
  if (idx < 0) {
    return [];
  }
  const start = index.juz[idx]!.start;
  const end = endBeforeNextStart(index, index.juz, idx);
  return collectVersesInRange(corpus, start, end);
}

function collectVersesInRange(
  corpus: QuranFullPayload,
  start: VerseRef,
  endExclusive: VerseRef,
): readonly ReaderDisplayVerse[] {
  const out: ReaderDisplayVerse[] = [];
  let surah = start.surah;
  let ayah = start.ayah;

  while (surah < endExclusive.surah || (surah === endExclusive.surah && ayah < endExclusive.ayah)) {
    const payload = corpus.surahs[surah - 1];
    if (!payload) {
      break;
    }
    const row = payload.verses.find((v) => v.ayah === ayah);
    if (row) {
      out.push({ ...row, surah });
    }
    if (ayah < payload.versesCount) {
      ayah += 1;
    } else {
      surah += 1;
      ayah = 1;
    }
  }

  return out;
}
