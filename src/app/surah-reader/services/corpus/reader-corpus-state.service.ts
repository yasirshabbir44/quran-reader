import { Injectable, computed, signal } from '@angular/core';
import type { QuranFullPayload, QuranSurahPayload } from '../../../core/quran/quran-data.service';
import type { MushafIndexPayload } from '../../../core/mushaf/mushaf-index.types';
import {
  juzForVerse,
  pageForVerse,
  versesForJuz,
  versesForPage,
} from '../../../core/mushaf/mushaf-slice.util';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import type { ReaderViewKind } from '../../models/reader-view-kind.model';
import type { SurahNavItem } from '../../models/surah-nav-item.model';

/** Corpus load state and the currently displayed verse slice (signals). */
@Injectable()
export class ReaderCorpusStateService {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly viewKind = signal<ReaderViewKind>('surah');
  readonly surahNumber = signal(67);
  readonly pageNumber = signal(1);
  readonly juzNumber = signal(1);
  readonly surah = signal<QuranSurahPayload | null>(null);
  readonly surahList = signal<readonly SurahNavItem[]>([]);
  readonly displayVerses = signal<readonly ReaderDisplayVerse[]>([]);

  readonly verses = computed(() => this.displayVerses());

  readonly mushafMeta = computed(() => {
    const index = this.loadedMushaf;
    const first = this.displayVerses()[0];
    if (!index || !first) {
      return null;
    }
    return {
      page: pageForVerse(index, first.surah, first.ayah),
      juz: juzForVerse(index, first.surah, first.ayah),
    };
  });

  private loadedCorpus: QuranFullPayload | null = null;
  private loadedMushaf: MushafIndexPayload | null = null;

  corpus(): QuranFullPayload | null {
    return this.loadedCorpus;
  }

  mushafIndex(): MushafIndexPayload | null {
    return this.loadedMushaf;
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

  setMushafPayload(payload: MushafIndexPayload | null): void {
    this.loadedMushaf = payload;
    if (payload === null && this.viewKind() !== 'surah') {
      this.error.set(true);
    }
  }

  beginRetry(): void {
    this.error.set(false);
    this.loading.set(true);
  }

  applySurahNumber(n: number): { resetViewport: boolean } {
    const prevKind = this.viewKind();
    const prevN = this.surahNumber();
    const payload = this.loadedCorpus;
    if (!payload) {
      return { resetViewport: false };
    }
    const resetViewport =
      prevKind !== 'surah' || n !== prevN || this.surah() === null || this.displayVerses().length === 0;
    this.viewKind.set('surah');
    const s = payload.surahs[n - 1] ?? null;
    this.surahNumber.set(n);
    this.surah.set(s);
    this.displayVerses.set(
      (s?.verses ?? []).map((v) => ({ ...v, surah: n })),
    );
    return { resetViewport };
  }

  applyPageNumber(page: number): { resetViewport: boolean } {
    const payload = this.loadedCorpus;
    const index = this.loadedMushaf;
    if (!payload || !index) {
      return { resetViewport: false };
    }
    const prev = this.pageNumber();
    const resetViewport =
      this.viewKind() !== 'page' || page !== prev || this.displayVerses().length === 0;
    const slice = versesForPage(page, payload, index);
    const primary = slice[0]?.surah ?? 1;
    this.viewKind.set('page');
    this.pageNumber.set(page);
    this.surahNumber.set(primary);
    this.surah.set(payload.surahs[primary - 1] ?? null);
    this.displayVerses.set(slice);
    return { resetViewport };
  }

  applyJuzNumber(juz: number): { resetViewport: boolean } {
    const payload = this.loadedCorpus;
    const index = this.loadedMushaf;
    if (!payload || !index) {
      return { resetViewport: false };
    }
    const prev = this.juzNumber();
    const resetViewport =
      this.viewKind() !== 'juz' || juz !== prev || this.displayVerses().length === 0;
    const slice = versesForJuz(juz, payload, index);
    const primary = slice[0]?.surah ?? 1;
    this.viewKind.set('juz');
    this.juzNumber.set(juz);
    this.surahNumber.set(primary);
    this.surah.set(payload.surahs[primary - 1] ?? null);
    this.displayVerses.set(slice);
    return { resetViewport };
  }

  surahNameFor(number: number): string {
    return this.loadedCorpus?.surahs[number - 1]?.nameAr ?? '';
  }
}
