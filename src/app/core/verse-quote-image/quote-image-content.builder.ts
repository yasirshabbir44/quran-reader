import { Injectable, inject } from '@angular/core';
import type { QuranVerseRow } from '../quran/quran-data.service';
import { buildVerseDeepLink } from '../routing/verse-deep-link.util';
import { UiLocaleService } from '../ui/ui-locale.service';
import { normalizeVerseTranslations } from '../verse-presentation/verse-presentation.strategy';
import type { QuoteImageContent } from './quote-image.types';

export interface QuoteImageContentParams {
  readonly verse: QuranVerseRow;
  readonly surahNumber: number;
  readonly surahNameAr: string;
  readonly origin: string;
  readonly formatUiNum: (n: number) => string;
}

@Injectable({ providedIn: 'root' })
export class QuoteImageContentBuilder {
  private readonly ui = inject(UiLocaleService);

  build(params: QuoteImageContentParams): QuoteImageContent {
    const tr = normalizeVerseTranslations(params.verse);
    return {
      arabic: params.verse.ar,
      translationEn: tr.en,
      translationUr: tr.ur,
      surahNameAr: params.surahNameAr,
      surahNumber: params.surahNumber,
      ayah: params.verse.ayah,
      siteLabel: this.ui.translate('documentTitle'),
      deepLink: buildVerseDeepLink(params.origin, params.surahNumber, params.verse.ayah),
      formatUiNum: params.formatUiNum,
    };
  }
}
