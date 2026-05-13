import { Injectable, InjectionToken } from '@angular/core';
import type { QuranVerseRow } from '../quran/quran-data.service';
import { ShareDataBuilder } from './share-data.builder';

export interface VersePresentationContext {
  readonly surahNumber: number;
  readonly surahNameAr: string;
  readonly origin: string;
  formatUiNum(n: number): string;
}

/**
 * Strategy (GoF): isolate verse copy/share formatting so the component stays orchestration-only.
 */
export interface VersePresentationStrategy {
  buildCopyText(verse: QuranVerseRow, ctx: VersePresentationContext): string;
  buildShareData(verse: QuranVerseRow, ctx: VersePresentationContext): ShareData;
}

export const VERSE_PRESENTATION_STRATEGY = new InjectionToken<VersePresentationStrategy>(
  'VERSE_PRESENTATION_STRATEGY',
);

/** Shared normalization for UI and default presentation strategy. */
export function normalizeVerseTranslations(v: QuranVerseRow): { en: string; ur: string } {
  return {
    en: v.en.replace(/\s+-\s*$/, '').trim(),
    ur: v.ur.trim(),
  };
}

@Injectable({ providedIn: 'root' })
export class DefaultVersePresentationStrategy implements VersePresentationStrategy {
  buildCopyText(verse: QuranVerseRow, ctx: VersePresentationContext): string {
    const tr = normalizeVerseTranslations(verse);
    const ref = `${ctx.formatUiNum(ctx.surahNumber)}:${ctx.formatUiNum(verse.ayah)}`;
    return `${verse.ar}\n\n${tr.en}\n\n${tr.ur}\n\n${ctx.surahNameAr} ${ref}`;
  }

  buildShareData(verse: QuranVerseRow, ctx: VersePresentationContext): ShareData {
    const tr = normalizeVerseTranslations(verse);
    const ref = `${ctx.formatUiNum(ctx.surahNumber)}:${ctx.formatUiNum(verse.ayah)}`;
    const shareUrl = `${ctx.origin}/surah/${ctx.surahNumber}?startingVerse=${verse.ayah}`;
    return new ShareDataBuilder()
      .setTitle(`${ctx.surahNameAr} ${verse.ayah}`)
      .setText(`${verse.ar}\n\n${tr.en}\n\n${ctx.surahNameAr} ${ref}`)
      .setUrl(shareUrl)
      .build();
  }
}
