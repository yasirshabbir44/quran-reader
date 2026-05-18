import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderDocumentTitleService {
  private readonly title = inject(Title);
  private readonly ui = inject(UiLocaleService);
  private readonly corpus = inject(ReaderCorpusStateService);

  sync(formatUiNum: (n: number) => string): void {
    const s = this.corpus.surah();
    if (s) {
      this.title.setTitle(
        this.ui.translate('documentTitleSurah', {
          name: s.nameAr,
          num: formatUiNum(s.number),
        }),
      );
    } else if (this.corpus.error()) {
      this.title.setTitle(this.ui.translate('documentTitleError'));
    } else {
      this.title.setTitle(this.ui.translate('documentTitle'));
    }
  }
}
