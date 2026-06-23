import { Injectable, inject } from '@angular/core';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import {
  juzCollectionJsonLd,
  mushafPageCollectionJsonLd,
  surahJsonLd,
} from '../../../core/seo/seo-jsonld';
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
      const description = this.ui.translate('seoPageDescription', { page: formatUiNum(page) });
      const verses = this.corpus.displayVerses().map((v) => ({ surah: v.surah, ayah: v.ayah }));
      this.seo.apply({
        title: this.ui.translate('documentTitlePage', { page: formatUiNum(page) }),
        description,
        path: `/page/${page}`,
        jsonLd: mushafPageCollectionJsonLd({
          origin: this.seo.siteOrigin(),
          page,
          description,
          verses,
        }),
      });
      return;
    }
    if (kind === 'juz') {
      const juz = this.corpus.juzNumber();
      const description = this.ui.translate('seoJuzDescription', { juz: formatUiNum(juz) });
      const verses = this.corpus.displayVerses().map((v) => ({ surah: v.surah, ayah: v.ayah }));
      this.seo.apply({
        title: this.ui.translate('documentTitleJuz', { juz: formatUiNum(juz) }),
        description,
        path: `/juz/${juz}`,
        jsonLd: juzCollectionJsonLd({
          origin: this.seo.siteOrigin(),
          juz,
          description,
          verses,
        }),
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
          verses: s.verses.map((v) => ({ surah: s.number, ayah: v.ayah })),
        }),
      });
    } else if (this.corpus.error()) {
      // Keep indexable — prerendered HTML already has index,follow; a transient
      // corpus load failure must not downgrade robots for crawlers that render JS.
      this.seo.apply({
        title: this.ui.translate('documentTitleError'),
        description: this.ui.translate('seoNotFoundDescription'),
        path: '/',
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
