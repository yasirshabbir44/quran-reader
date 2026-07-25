import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuranWordStudyService } from '../../../core/word-study/quran-word-study.service';
import type { WordStudyToken } from '../../../core/word-study/quran-word-study.types';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';
import { ReaderLayoutBreakpointsService } from '../layout/reader-layout-breakpoints.service';

/** Word-by-word panel state for the active verse (inline or mobile sheet). */
@Injectable()
export class ReaderWordStudyPanelService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly wordStudyApi = inject(QuranWordStudyService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly breakpoints = inject(ReaderLayoutBreakpointsService);

  readonly expandedVerse = signal<VerseRef | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly words = signal<readonly WordStudyToken[]>([]);
  readonly mobileSheetOpen = signal(false);

  readonly verseForPanel = computed(() => {
    const ref = this.expandedVerse();
    if (ref == null) {
      return null;
    }
    return (
      this.corpus.displayVerses().find((v) => v.surah === ref.surah && v.ayah === ref.ayah) ?? null
    );
  });

  private loadGeneration = 0;

  useMobileSheet(): boolean {
    return this.breakpoints.mobileChrome();
  }

  isOpen(v: ReaderDisplayVerse): boolean {
    const ref = this.expandedVerse();
    return ref !== null && ref.surah === v.surah && ref.ayah === v.ayah;
  }

  showInline(v: ReaderDisplayVerse): boolean {
    return this.isOpen(v) && !this.useMobileSheet();
  }

  toggle(v: ReaderDisplayVerse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.isOpen(v)) {
      this.close();
      return;
    }
    this.open({ surah: v.surah, ayah: v.ayah });
  }

  open(ref: VerseRef): void {
    this.expandedVerse.set(ref);
    this.fetch(ref);
    if (this.useMobileSheet()) {
      this.mobileSheetOpen.set(true);
      this.lockBodyScroll();
    }
  }

  close(): void {
    this.expandedVerse.set(null);
    this.mobileSheetOpen.set(false);
    this.unlockBodyScroll();
    this.loading.set(false);
    this.error.set(false);
    this.words.set([]);
    this.loadGeneration += 1;
  }

  closeOnViewChange(): void {
    this.close();
  }

  onBreakpointChange(): void {
    if (!this.breakpoints.mobileChrome() && this.mobileSheetOpen()) {
      this.mobileSheetOpen.set(false);
      this.unlockBodyScroll();
    }
  }

  retry(ref: VerseRef): void {
    this.wordStudyApi.invalidateVerse(ref.surah, ref.ayah);
    this.fetch(ref);
  }

  private fetch(ref: VerseRef): void {
    const gen = ++this.loadGeneration;
    this.loading.set(true);
    this.error.set(false);
    this.words.set([]);
    this.wordStudyApi
      .loadVerse(ref.surah, ref.ayah)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tokens) => {
        const open = this.expandedVerse();
        if (
          gen !== this.loadGeneration ||
          open === null ||
          open.surah !== ref.surah ||
          open.ayah !== ref.ayah
        ) {
          return;
        }
        this.loading.set(false);
        if (!tokens?.length) {
          this.error.set(true);
          return;
        }
        this.words.set(tokens);
      });
  }

  private lockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = 'hidden';
    }
  }

  private unlockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = '';
    }
  }
}
