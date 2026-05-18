import { Injectable, computed, signal } from '@angular/core';
import type { QuranFullPayload, QuranSurahPayload } from '../../../core/quran/quran-data.service';
import type { SurahNavItem } from '../../models/surah-nav-item.model';

/** Corpus load state and the currently selected surah (signals). */
@Injectable()
export class ReaderCorpusStateService {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly surahNumber = signal(67);
  readonly surah = signal<QuranSurahPayload | null>(null);
  readonly surahList = signal<readonly SurahNavItem[]>([]);
  readonly verses = computed(() => this.surah()?.verses ?? []);

  private loadedCorpus: QuranFullPayload | null = null;

  corpus(): QuranFullPayload | null {
    return this.loadedCorpus;
  }

  setCorpusPayload(payload: QuranFullPayload | null): void {
    if (payload === null) {
      this.loadedCorpus = null;
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    this.loadedCorpus = payload;
    this.loading.set(false);
    this.error.set(false);
    this.surahList.set(
      payload.surahs.map((s) => ({
        number: s.number,
        nameAr: s.nameAr,
        nameTranslit: s.nameTranslit,
        versesCount: s.versesCount,
        revelationType: s.revelationType,
      })),
    );
  }

  beginRetry(): void {
    this.error.set(false);
    this.loading.set(true);
  }

  applySurahNumber(n: number): { resetViewport: boolean } {
    const prevN = this.surahNumber();
    const payload = this.loadedCorpus;
    if (!payload) {
      return { resetViewport: false };
    }
    const resetViewport = n !== prevN || this.surah() === null;
    const s = payload.surahs[n - 1] ?? null;
    this.surahNumber.set(n);
    this.surah.set(s);
    return { resetViewport };
  }

  isMulk(): boolean {
    return this.surahNumber() === 67;
  }
}
