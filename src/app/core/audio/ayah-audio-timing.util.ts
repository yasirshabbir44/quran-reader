/** Word timing relative to an ayah MP3 (Alafasy / Quran.com recitation id 7). */
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

/**
 * Map Quran.com segment rows `[wordFrom, wordTo, startMs, endMs]` to per-word timings.
 * Typical form is `[i, i+1, start, end]` for a single word at 0-based index `i`.
 */
export function mapRecitationSegments(
  raw: readonly (readonly number[])[],
): readonly AyahWordTiming[] {
  const out: AyahWordTiming[] = [];
  for (const row of raw) {
    if (!row || row.length < 4) {
      continue;
    }
    const from = row[0]!;
    const to = row[1]!;
    const startMs = row[2]!;
    const endMs = row[3]!;
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
      out.push({
        position: i + 1,
        startMs,
        endMs,
      });
    }
  }
  return out;
}

/** Active 1-based word position for `timeMs`, or null if outside all segments. */
export function activeWordPositionAt(
  segments: readonly AyahWordTiming[],
  timeMs: number,
): number | null {
  if (segments.length === 0 || !Number.isFinite(timeMs)) {
    return null;
  }
  for (const seg of segments) {
    if (timeMs >= seg.startMs && timeMs < seg.endMs) {
      return seg.position;
    }
  }
  // Between / after last segment: keep last word if past its start
  const last = segments[segments.length - 1]!;
  if (timeMs >= last.startMs) {
    return last.position;
  }
  const first = segments[0]!;
  if (timeMs < first.startMs) {
    return first.position;
  }
  return null;
}
