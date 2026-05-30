import { Injectable, inject } from '@angular/core';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { surahJsonLd } from '../../../core/seo/seo-jsonld';
import { SeoService } from '../../../core/seo/seo.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderDocumentTitleService {
  private readonly seo = inject(SeoService);
  private readonly ui = inject(UiLocaleService);
  private readonly corpus = inject(ReaderCorpusStateService);

  sync(formatUiNum: (n: number) => string): void {
    const kind = this.corpus.viewKind();
    if (kind === 'page') {
      const page = this.corpus.pageNumber();
      this.seo.apply({
        title: this.ui.translate('documentTitlePage', { page: formatUiNum(page) }),
        description: this.ui.translate('seoPageDescription', { page: formatUiNum(page) }),
        path: `/page/${page}`,
      });
      return;
    }
    if (kind === 'juz') {
      const juz = this.corpus.juzNumber();
      this.seo.apply({
        title: this.ui.translate('documentTitleJuz', { juz: formatUiNum(juz) }),
        description: this.ui.translate('seoJuzDescription', { juz: formatUiNum(juz) }),
        path: `/juz/${juz}`,
      });
      return;
    }
    const s = this.corpus.surah();
    if (s) {
      this.seo.apply({
        title: this.ui.translate('documentTitleSurah', {
          name: s.nameAr,
          num: formatUiNum(s.number),
        }),
        description: this.ui.translate('seoSurahDescription', {
          name: s.nameAr,
          translit: s.nameTranslit,
          num: formatUiNum(s.number),
        }),
        path: `/${s.number}`,
        type: 'book',
        jsonLd: surahJsonLd({
          origin: this.seo.siteOrigin(),
          path: `/${s.number}`,
          nameAr: s.nameAr,
          nameTranslit: s.nameTranslit,
          number: s.number,
          versesCount: s.versesCount,
        }),
      });
    } else if (this.corpus.error()) {
      this.seo.apply({
        title: this.ui.translate('documentTitleError'),
        description: this.ui.translate('seoNotFoundDescription'),
        path: '/',
        noindex: true,
      });
    } else {
      this.seo.apply({
        title: this.ui.translate('documentTitle'),
        description: this.ui.translate('seoHomeDescription'),
        path: '/',
      });
    }
  }
}
