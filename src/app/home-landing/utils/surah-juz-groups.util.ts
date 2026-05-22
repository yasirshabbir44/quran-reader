import { juzForVerse } from '../../core/mushaf/mushaf-slice.util';
import type { MushafIndexPayload } from '../../core/mushaf/mushaf-index.types';
import type { QuranSurahPayload } from '../../core/quran/quran-data.service';

export interface SurahJuzGroup {
  readonly juz: number;
  readonly surahs: readonly QuranSurahPayload[];
}

/** Assign each surah to every juz its verses span (monotonic within a surah). */
export function groupSurahsByJuz(
  surahs: readonly QuranSurahPayload[],
  index: MushafIndexPayload,
): readonly SurahJuzGroup[] {
  const buckets = new Map<number, QuranSurahPayload[]>();
  for (let j = 1; j <= 30; j++) {
    buckets.set(j, []);
  }

  for (const s of surahs) {
    const startJuz = juzForVerse(index, s.number, 1);
    const endJuz = juzForVerse(index, s.number, s.versesCount);
    if (startJuz === null || endJuz === null) {
      continue;
    }
    for (let j = startJuz; j <= endJuz; j++) {
      buckets.get(j)!.push(s);
    }
  }

  return Array.from({ length: 30 }, (_, i) => ({
    juz: i + 1,
    surahs: buckets.get(i + 1)!,
  }));
}

/** Keep only surahs that pass the active index filters; drop empty juz sections. */
export function filterSurahJuzGroups(
  groups: readonly SurahJuzGroup[],
  visible: readonly QuranSurahPayload[],
): readonly SurahJuzGroup[] {
  const allowed = new Set(visible.map((s) => s.number));
  return groups
    .map((g) => ({
      juz: g.juz,
      surahs: g.surahs.filter((s) => allowed.has(s.number)),
    }))
    .filter((g) => g.surahs.length > 0);
}
