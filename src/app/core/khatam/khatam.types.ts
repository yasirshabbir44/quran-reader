import type { VerseRef } from '../mushaf/mushaf-index.types';

/** Reading pace preset for daily targets and ETA. */
export type KhatamPacePlan = 'free' | 'juz' | '30day' | '60day';

export type KhatamSession = {
  readonly version: 2;
  readonly active: boolean;
  readonly startedAt: string;
  readonly furthest: VerseRef;
  readonly completedAt: string | null;
  readonly pacePlan: KhatamPacePlan;
  /** Local calendar day (YYYY-MM-DD) for the daily progress window. */
  readonly dayKey: string;
  /** Furthest ordinal at the start of `dayKey` (verses today = current − this). */
  readonly dayStartOrdinal: number;
  /** Lifetime completed khatams on this device. */
  readonly completedCount: number;
};

export type KhatamProgress = {
  readonly percent: number;
  readonly versesRead: number;
  readonly totalVerses: number;
  readonly versesRemaining: number;
  readonly juzCompleted: number;
  readonly totalJuz: number;
  readonly currentJuz: number | null;
  readonly daysSinceStart: number | null;
  readonly pacePlan: KhatamPacePlan;
  /** Daily verse target for the active pace plan; null when free/open pace. */
  readonly dailyTarget: number | null;
  readonly versesReadToday: number;
  /** Progress toward today's target (0–100); 0 when free pace. */
  readonly todayPercent: number;
  /** Estimated days left at current goal or recent pace. */
  readonly daysRemainingEstimate: number | null;
  readonly completedCount: number;
};

export type KhatamStartOptions = {
  readonly from?: VerseRef;
  readonly pacePlan?: KhatamPacePlan;
};
