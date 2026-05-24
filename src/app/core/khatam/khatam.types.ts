import type { VerseRef } from '../mushaf/mushaf-index.types';

export type KhatamSession = {
  readonly version: 1;
  readonly active: boolean;
  readonly startedAt: string;
  readonly furthest: VerseRef;
  readonly completedAt: string | null;
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
};
