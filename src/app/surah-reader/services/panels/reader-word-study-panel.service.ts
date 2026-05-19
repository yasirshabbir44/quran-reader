import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuranWordStudyService } from '../../../core/word-study/quran-word-study.service';
import type { WordStudyToken } from '../../../core/word-study/quran-word-study.types';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

/** Inline word-by-word panel state for the active verse. */
@Injectable()
export class ReaderWordStudyPanelService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly wordStudyApi = inject(QuranWordStudyService);
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly expandedVerse = signal<VerseRef | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly words = signal<readonly WordStudyToken[]>([]);

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

  isOpen(v: ReaderDisplayVerse): boolean {
    const ref = this.expandedVerse();
    return ref !== null && ref.surah === v.surah && ref.ayah === v.ayah;
  }

  toggle(v: ReaderDisplayVerse): void {
    if (this.isOpen(v)) {
      this.close();
      return;
    }
    this.open({ surah: v.surah, ayah: v.ayah });
  }

  open(ref: VerseRef): void {
    this.expandedVerse.set(ref);
    this.fetch(ref);
  }

  close(): void {
    this.expandedVerse.set(null);
    this.loading.set(false);
    this.error.set(false);
    this.words.set([]);
    this.loadGeneration += 1;
  }

  closeOnViewChange(): void {
    this.close();
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
}
