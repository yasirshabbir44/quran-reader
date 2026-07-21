import { InjectionToken } from '@angular/core';
import type { VerseRef } from '../mushaf/mushaf-index.types';
import type {
  KhatamPacePlan,
  KhatamProgress,
  KhatamSession,
  KhatamStartOptions,
} from './khatam.types';

export interface KhatamRepository {
  readonly session: () => KhatamSession | null;
  readonly progress: () => KhatamProgress;
  readonly isActive: () => boolean;
  readonly isComplete: () => boolean;
  readonly furthest: () => VerseRef;

  hydrateFromStorage(): void;
  syncDay(): void;
  bindCorpus(surahs: readonly { readonly number: number; readonly versesCount: number }[]): void;
  bindMushafIndex(index: {
    readonly juz: readonly { readonly juz: number; readonly start: VerseRef }[];
  }): void;
  juzStart(juz: number): VerseRef | null;
  startNew(options?: KhatamStartOptions): void;
  setPacePlan(plan: KhatamPacePlan): void;
  recordProgress(surah: number, ayah: number): void;
  markComplete(): void;
}

export const KHATAM_REPOSITORY = new InjectionToken<KhatamRepository>('KHATAM_REPOSITORY');
