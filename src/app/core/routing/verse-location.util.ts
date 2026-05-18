import type { ReaderViewKind } from '../../surah-reader/models/reader-view-kind.model';
import type { VerseRef } from '../mushaf/mushaf-index.types';

/** DOM id for a verse in the reader list. */
export function verseElementId(ref: VerseRef, viewKind: ReaderViewKind): string {
  if (viewKind === 'surah') {
    return String(ref.ayah);
  }
  return `${ref.surah}:${ref.ayah}`;
}

/** URL fragment for deep links. */
export function verseLocationFragment(ref: VerseRef, viewKind: ReaderViewKind): string {
  return verseElementId(ref, viewKind);
}

export function parseVerseLocationFragment(
  fragment: string | null | undefined,
  surahContext: number | null,
  viewKind: ReaderViewKind,
): VerseRef | null {
  if (fragment === null || fragment === undefined || fragment === '') {
    return null;
  }
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  const colon = raw.indexOf(':');
  if (colon > 0) {
    const surah = Number(raw.slice(0, colon));
    const ayah = Number(raw.slice(colon + 1));
    if (Number.isInteger(surah) && surah >= 1 && surah <= 114 && Number.isInteger(ayah) && ayah >= 1) {
      return { surah, ayah };
    }
    return null;
  }
  const ayah = Number(raw);
  if (!Number.isFinite(ayah) || ayah < 1) {
    return null;
  }
  if (viewKind === 'surah' && surahContext !== null) {
    return { surah: surahContext, ayah: Math.floor(ayah) };
  }
  return null;
}

export function parseVerseLocationFromHash(
  hash: string | null | undefined,
  surahContext: number | null,
  viewKind: ReaderViewKind,
): VerseRef | null {
  if (hash === null || hash === undefined || hash === '') {
    return null;
  }
  return parseVerseLocationFragment(hash.startsWith('#') ? hash.slice(1) : hash, surahContext, viewKind);
}
