import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { SurahSummaryService } from '../../../core/surah-summary/surah-summary.service';
import type { SurahSummaryEntry, SurahSummaryLang } from '../../../core/surah-summary/surah-summary.types';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderIntroContentService {
  private readonly ui = inject(UiLocaleService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly summaries = inject(SurahSummaryService);

  /** Active summary language for bilingual intro (EN / UR). */
  readonly summaryLang = signal<SurahSummaryLang>(this.ui.locale() === 'ur' ? 'ur' : 'en');

  private readonly surahNumber = computed(() => this.corpus.surah()?.number ?? null);

  private readonly summaryEntry = toSignal(
    toObservable(this.surahNumber).pipe(
      switchMap((n) => {
        if (n == null) {
          return of(null as SurahSummaryEntry | null);
        }
        return this.summaries.getByNumber(n).pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null as SurahSummaryEntry | null },
  );

  readonly hasRichSummary = computed(() => {
    const e = this.summaryEntry();
    return !!(e && (e.summaryEn || e.summaryUr));
  });

  readonly activeSummary = computed(() => this.pickSummary(this.summaryLang()));

  /** Short preview on the closed intro card — follows app UI locale, not the details tabs. */
  readonly previewSummary = computed(() => {
    const locale = this.ui.locale();
    return this.pickSummary(locale === 'ur' ? 'ur' : 'en');
  });

  readonly previewLang = computed<SurahSummaryLang>(() => (this.ui.locale() === 'ur' ? 'ur' : 'en'));

  readonly activeDetail = computed(() => {
    const e = this.summaryEntry();
    const lang = this.summaryLang();
    if (!e) {
      return this.ui.translate('aboutBodyGeneric');
    }
    const preferred = lang === 'ur' ? e.detailUr : e.detailEn;
    const fallback = lang === 'ur' ? e.detailEn : e.detailUr;
    return preferred || fallback || this.ui.translate('aboutBodyGeneric');
  });

  readonly activeSource = computed(() => {
    const e = this.summaryEntry();
    if (!e) {
      return '';
    }
    return this.summaryLang() === 'ur' ? e.sourceUr : e.sourceEn;
  });

  readonly localizedName = computed(() => {
    const e = this.summaryEntry();
    if (!e) {
      return '';
    }
    return this.summaryLang() === 'ur' ? e.nameUr || e.nameEn : e.nameEn;
  });

  readonly facts = computed(() => {
    const e = this.summaryEntry();
    const s = this.corpus.surah();
    if (!s) {
      return null;
    }
    return {
      juz: e?.juz ?? null,
      revelationOrder: e?.revelationOrder ?? null,
      mushafPageStart: e?.mushafPageStart ?? null,
      revelationType: s.revelationType,
      versesCount: s.versesCount,
    };
  });

  /** Body text shown in the collapsed intro panel. */
  readonly summary = computed(() => this.previewSummary());

  readonly deepSummary = computed(() =>
    this.hasRichSummary()
      ? this.ui.translate('aboutSummary')
      : this.ui.translate('aboutSummaryGeneric'),
  );

  constructor() {
    // Keep EN/UR tab aligned when the user changes app locale.
    effect(() => {
      const locale = this.ui.locale();
      this.summaryLang.set(locale === 'ur' ? 'ur' : 'en');
    });
  }

  setSummaryLang(lang: SurahSummaryLang): void {
    this.summaryLang.set(lang);
  }

  formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  private pickSummary(lang: SurahSummaryLang): string {
    const e = this.summaryEntry();
    if (!e) {
      return this.fallbackSummary();
    }
    const preferred = lang === 'ur' ? e.summaryUr : e.summaryEn;
    const fallback = lang === 'ur' ? e.summaryEn : e.summaryUr;
    return preferred || fallback || this.fallbackSummary();
  }

  private fallbackSummary(): string {
    const s = this.corpus.surah();
    if (!s) {
      return '';
    }
    return this.ui.translate('surahIntroGeneric', {
      name: s.nameAr,
      translit: s.nameTranslit,
      num: this.formatUiNum(s.number),
      verses: this.formatUiNum(s.versesCount),
      type: this.ui.translate(s.revelationType === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan'),
    });
  }
}
