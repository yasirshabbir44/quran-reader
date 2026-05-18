import { Injectable, computed, inject } from '@angular/core';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { SURAH_MULK_META } from '../../../data/surah-mulk-meta';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderIntroContentService {
  private readonly ui = inject(UiLocaleService);
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly mulkMeta = SURAH_MULK_META;

  readonly summary = computed(() => {
    const s = this.corpus.surah();
    if (!s) {
      return '';
    }
    if (this.corpus.isMulk()) {
      return SURAH_MULK_META.themes;
    }
    return this.ui.translate('surahIntroGeneric', {
      name: s.nameAr,
      translit: s.nameTranslit,
      num: this.formatUiNum(s.number),
      verses: this.formatUiNum(s.versesCount),
      type: this.ui.translate(s.revelationType === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan'),
    });
  });

  readonly deepSummary = computed(() =>
    this.corpus.isMulk()
      ? this.ui.translate('aboutSummary')
      : this.ui.translate('aboutSummaryGeneric'),
  );

  formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }
}
