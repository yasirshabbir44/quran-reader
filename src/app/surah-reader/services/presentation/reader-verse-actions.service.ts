import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import {
  VERSE_PRESENTATION_STRATEGY,
  type VersePresentationContext,
} from '../../../core/verse-presentation/verse-presentation.strategy';
import type { QuranVerseRow } from '../../../core/quran/quran-data.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderVerseActionsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly versePresentation = inject(VERSE_PRESENTATION_STRATEGY);
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly quoteSheetVerse = signal<QuranVerseRow | null>(null);
  readonly copiedAyah = signal<number | null>(null);

  copyAyah(v: QuranVerseRow, ctx: VersePresentationContext): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard?.writeText) {
      return;
    }
    const text = this.versePresentation.buildCopyText(v, ctx);
    void navigator.clipboard.writeText(text).then(() => {
      this.copiedAyah.set(v.ayah);
      setTimeout(() => {
        if (this.copiedAyah() === v.ayah) {
          this.copiedAyah.set(null);
        }
      }, 1600);
    });
  }

  shareAyah(v: QuranVerseRow, ctx: VersePresentationContext): void {
    if (!isPlatformBrowser(this.platformId) || typeof navigator.share !== 'function') {
      return;
    }
    const sharePayload = this.versePresentation.buildShareData(v, ctx);
    void navigator.share(sharePayload);
  }

  openQuoteImage(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.quoteSheetVerse.set(v);
  }

  closeQuoteSheet(): void {
    this.quoteSheetVerse.set(null);
  }

  readerOrigin(): string {
    return isPlatformBrowser(this.platformId) ? this.document.location.origin : '';
  }

  presentationContext(formatUiNum: (n: number) => string): VersePresentationContext {
    return {
      surahNumber: this.corpus.surahNumber(),
      surahNameAr: this.corpus.surah()?.nameAr ?? '',
      origin: this.document.location.origin,
      formatUiNum,
    };
  }
}
