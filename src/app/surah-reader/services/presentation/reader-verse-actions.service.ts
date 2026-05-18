import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import {
  VERSE_PRESENTATION_STRATEGY,
  type VersePresentationContext,
} from '../../../core/verse-presentation/verse-presentation.strategy';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderVerseActionsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly versePresentation = inject(VERSE_PRESENTATION_STRATEGY);
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly quoteSheetVerse = signal<ReaderDisplayVerse | null>(null);
  readonly copiedAyah = signal<string | null>(null);

  copyAyah(v: ReaderDisplayVerse, ctx: VersePresentationContext): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard?.writeText) {
      return;
    }
    const text = this.versePresentation.buildCopyText(v, ctx);
    const key = `${v.surah}:${v.ayah}`;
    void navigator.clipboard.writeText(text).then(() => {
      this.copiedAyah.set(key);
      setTimeout(() => {
        if (this.copiedAyah() === key) {
          this.copiedAyah.set(null);
        }
      }, 1600);
    });
  }

  shareAyah(v: ReaderDisplayVerse, ctx: VersePresentationContext): void {
    if (!isPlatformBrowser(this.platformId) || typeof navigator.share !== 'function') {
      return;
    }
    const sharePayload = this.versePresentation.buildShareData(v, ctx);
    void navigator.share(sharePayload);
  }

  openQuoteImage(v: ReaderDisplayVerse): void {
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

  presentationContext(
    formatUiNum: (n: number) => string,
    v?: ReaderDisplayVerse,
  ): VersePresentationContext {
    const surahNumber = v?.surah ?? this.corpus.surahNumber();
    return {
      surahNumber,
      surahNameAr: this.corpus.surahNameFor(surahNumber),
      origin: this.document.location.origin,
      formatUiNum,
    };
  }
}
