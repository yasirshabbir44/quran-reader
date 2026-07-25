/** Word timing relative to an ayah MP3 from Quran.com. */
export interface AyahWordTiming {
  /** 1-based word position (matches Quran.com / WordStudyToken.position). */
  readonly position: number;
  readonly startMs: number;
  readonly endMs: number;
}

export interface AyahRecitationTiming {
  readonly surah: number;
  readonly ayah: number;
  readonly segments: readonly AyahWordTiming[];
}

/** Map Quran.com rows `[wordFrom, wordTo, startMs, endMs]` to word timings. */
export function mapRecitationSegments(
  raw: readonly (readonly unknown[])[],
): readonly AyahWordTiming[] {
  const out: AyahWordTiming[] = [];
  for (const row of raw) {
    if (!row || row.length < 4) {
      continue;
    }
    const from = Number(row[0]);
    const to = Number(row[1]);
    const startMs = Number(row[2]);
    const endMs = Number(row[3]);
    if (
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      to <= from ||
      endMs < startMs
    ) {
      continue;
    }
    for (let i = from; i < to; i++) {
      out.push({ position: i + 1, startMs, endMs });
    }
  }
  return out;
}

/** Active 1-based word position for `timeMs`, or null when unavailable. */
export function activeWordPositionAt(
  segments: readonly AyahWordTiming[],
  timeMs: number,
): number | null {
  if (segments.length === 0 || !Number.isFinite(timeMs)) {
    return null;
  }
  for (const segment of segments) {
    if (timeMs >= segment.startMs && timeMs < segment.endMs) {
      return segment.position;
    }
  }
  const first = segments[0]!;
  if (timeMs < first.startMs) {
    return first.position;
  }
  return segments[segments.length - 1]!.position;
}
