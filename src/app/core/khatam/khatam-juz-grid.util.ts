export type KhatamJuzSegmentState = 'done' | 'current' | 'pending';

const TOTAL_JUZ = 30;

/** Visual state for each of the 30 juz segments in the progress grid. */
export function buildJuzSegmentStates(
  juzCompleted: number,
  currentJuz: number | null,
  isComplete: boolean,
): readonly KhatamJuzSegmentState[] {
  if (isComplete) {
    return Array.from({ length: TOTAL_JUZ }, () => 'done' as const);
  }
  const current = currentJuz ?? Math.min(TOTAL_JUZ, Math.max(1, juzCompleted + 1));
  return Array.from({ length: TOTAL_JUZ }, (_, i) => {
    const juz = i + 1;
    if (juz <= juzCompleted) {
      return 'done';
    }
    if (juz === current) {
      return 'current';
    }
    return 'pending';
  });
}

export function daysSinceIsoDate(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) {
    return null;
  }
  const started = new Date(iso);
  if (Number.isNaN(started.getTime())) {
    return null;
  }
  const startDay = Date.UTC(started.getUTCFullYear(), started.getUTCMonth(), started.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = Math.floor((today - startDay) / 86_400_000);
  return Math.max(0, diff);
}
