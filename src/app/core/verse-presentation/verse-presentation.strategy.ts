import { Injectable, InjectionToken } from '@angular/core';
import type { QuranVerseRow } from '../quran/quran-data.service';
import { buildVerseDeepLink } from '../routing/verse-deep-link.util';
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
  buildVerseLink(verse: QuranVerseRow, ctx: VersePresentationContext): string;
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

/**
 * Pick meaning text for the active UI locale.
 * Corpus has en/ur only — Arabic UI uses English meaning with correct lang/dir.
 */
export function pickVerseTranslationForLocale(
  tr: { readonly en: string; readonly ur: string },
  locale: 'en' | 'ar' | 'ur',
): { text: string; lang: 'en' | 'ur'; dir: 'ltr' | 'rtl' } {
  if (locale === 'ur' && tr.ur) {
    return { text: tr.ur, lang: 'ur', dir: 'rtl' };
  }
  return { text: tr.en, lang: 'en', dir: 'ltr' };
}

export function normalizeVerseTransliteration(v: QuranVerseRow): string {
  return (v.tr ?? '').trim();
}

@Injectable({ providedIn: 'root' })
export class DefaultVersePresentationStrategy implements VersePresentationStrategy {
  buildCopyText(verse: QuranVerseRow, ctx: VersePresentationContext): string {
    const tr = normalizeVerseTranslations(verse);
    const translit = normalizeVerseTransliteration(verse);
    const ref = `${ctx.formatUiNum(ctx.surahNumber)}:${ctx.formatUiNum(verse.ayah)}`;
    const parts = [verse.ar];
    if (translit) {
      parts.push(translit);
    }
    parts.push(tr.en, tr.ur, `${ctx.surahNameAr} ${ref}`);
    return parts.join('\n\n');
  }

  buildVerseLink(verse: QuranVerseRow, ctx: VersePresentationContext): string {
    return buildVerseDeepLink(ctx.origin, ctx.surahNumber, verse.ayah);
  }

  buildShareData(verse: QuranVerseRow, ctx: VersePresentationContext): ShareData {
    const tr = normalizeVerseTranslations(verse);
    const translit = normalizeVerseTransliteration(verse);
    const ref = `${ctx.formatUiNum(ctx.surahNumber)}:${ctx.formatUiNum(verse.ayah)}`;
    const shareUrl = buildVerseDeepLink(ctx.origin, ctx.surahNumber, verse.ayah);
    const textParts = [verse.ar];
    if (translit) {
      textParts.push(translit);
    }
    textParts.push(tr.en, `${ctx.surahNameAr} ${ref}`);
    return new ShareDataBuilder()
      .setTitle(`${ctx.surahNameAr} ${verse.ayah}`)
      .setText(textParts.join('\n\n'))
      .setUrl(shareUrl)
      .build();
  }
}
