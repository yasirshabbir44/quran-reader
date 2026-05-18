import type { QuranVerseRow } from '../../core/quran/quran-data.service';

/** Verse row shown in the reader, always with surah context (for mushaf slices). */
export type ReaderDisplayVerse = QuranVerseRow & {
  readonly surah: number;
};
