import { InjectionToken } from '@angular/core';
import type { VerseRef } from '../mushaf/mushaf-index.types';
import type { KhatamProgress, KhatamSession } from './khatam.types';

export interface KhatamRepository {
  readonly session: () => KhatamSession | null;
  readonly progress: () => KhatamProgress;
  readonly isActive: () => boolean;
  readonly isComplete: () => boolean;
  readonly furthest: () => VerseRef;

  hydrateFromStorage(): void;
  bindCorpus(surahs: readonly { readonly number: number; readonly versesCount: number }[]): void;
  bindMushafIndex(index: { readonly juz: readonly { readonly juz: number; readonly start: VerseRef }[] }): void;
  startNew(): void;
  recordProgress(surah: number, ayah: number): void;
  markComplete(): void;
}

export const KHATAM_REPOSITORY = new InjectionToken<KhatamRepository>('KHATAM_REPOSITORY');
