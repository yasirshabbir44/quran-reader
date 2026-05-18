import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, DestroyRef, Injector, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParamMap, Router } from '@angular/router';
import { combineLatest, filter, map, startWith, tap } from 'rxjs';
import { QURAN_CORPUS_SOURCE } from '../../../core/quran/quran-corpus.source';
import type { QuranFullPayload } from '../../../core/quran/quran-data.service';
import { READING_BOOKMARK_REPOSITORY } from '../../../core/bookmark/reading-bookmark.repository';
import { DailyReminderService } from '../../../core/notifications/daily-reminder.service';
import { ActivatedRoute } from '@angular/router';
import { ReaderActiveAyahService } from '../navigation/reader-active-ayah.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';
import { ReaderSurahSearchService } from '../navigation/reader-surah-search.service';
import { ReaderTafsirPanelService } from '../panels/reader-tafsir-panel.service';
import { ReaderVerseFragmentService } from './reader-verse-fragment.service';
import { ReaderViewPreferencesService } from '../preferences/reader-view-preferences.service';
import { ReaderBookmarkUiService } from '../bookmark/reader-bookmark-ui.service';
import { ReaderScrollStateService } from '../navigation/reader-scroll-state.service';

/** Syncs router params, query, and fragment with corpus payload and reader services. */
@Injectable()
export class ReaderRouteCoordinatorService {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly corpusSource = inject(QURAN_CORPUS_SOURCE);
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);
  private readonly dailyReminder = inject(DailyReminderService);

  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly viewPrefs = inject(ReaderViewPreferencesService);
  private readonly activeAyah = inject(ReaderActiveAyahService);
  private readonly fragments = inject(ReaderVerseFragmentService);
  private readonly search = inject(ReaderSurahSearchService);
  private readonly tafsir = inject(ReaderTafsirPanelService);
  private readonly bookmarkUi = inject(ReaderBookmarkUiService);
  private readonly scroll = inject(ReaderScrollStateService);

  private lastConsumedStartKey = '';

  bind(onTitleSync: () => void): void {
    const corpus$ = this.corpusSource.load().pipe(
      tap((payload) => {
        this.corpus.setCorpusPayload(payload);
        if (payload === null) {
          onTitleSync();
        }
      }),
    );

    combineLatest([
      corpus$,
      this.route.paramMap,
      this.route.queryParamMap,
      this.route.fragment.pipe(startWith(this.route.snapshot.fragment)),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(([payload]) => {
          if (payload === null) {
            onTitleSync();
          }
        }),
        filter(([payload]) => payload !== null),
        map(([payload, pm, qm, fragment]) => ({
          payload: payload as QuranFullPayload,
          pm,
          qm,
          fragment,
        })),
      )
      .subscribe(({ payload, pm, qm, fragment }) => {
        this.applyCorpusAndRoute(payload, pm, qm, fragment);
        onTitleSync();
      });
  }

  retryCorpusLoad(): void {
    this.corpus.beginRetry();
    this.corpusSource.retryLoad();
  }

  private applyCorpusAndRoute(
    payload: QuranFullPayload,
    pm: ParamMap,
    qm: ParamMap,
    fragment: string | null,
  ): void {
    this.corpus.setCorpusPayload(payload);

    const raw = Number(pm.get('n'));
    const n = Number.isFinite(raw) && raw >= 1 && raw <= 114 ? Math.floor(raw) : 67;
    const targetAyah = this.fragments.resolveRouteTargetAyah(fragment, qm);
    const startParam = qm.get('startingVerse');
    const hasLegacyStartParam = startParam !== null && startParam !== '';
    const treatAsFreshNavigation = n !== this.corpus.surahNumber() || this.corpus.surah() === null;
    let shouldNormalizeLegacyQuery = false;

    let pendingAyah: number | null = null;
    if (targetAyah !== null) {
      const startKey = `${n}#${targetAyah}`;
      if (this.fragments.consumeScrollSuppression(n, targetAyah)) {
        this.lastConsumedStartKey = startKey;
      } else if (treatAsFreshNavigation || startKey !== this.lastConsumedStartKey) {
        const alreadyAtVerse =
          !treatAsFreshNavigation && targetAyah === this.activeAyah.activeAyah();
        if (!alreadyAtVerse) {
          pendingAyah = targetAyah;
        }
        this.lastConsumedStartKey = startKey;
        if (hasLegacyStartParam) {
          shouldNormalizeLegacyQuery = true;
        }
      }
    } else {
      this.lastConsumedStartKey = '';
      if (treatAsFreshNavigation) {
        this.fragments.verseFragmentSyncEnabled = false;
        const b = this.readingBookmark.read();
        pendingAyah = b !== null && b.surah === n ? b.ayah : 1;
      }
    }

    if (pendingAyah !== null) {
      this.activeAyah.pendingStartAyah = pendingAyah;
    }

    this.viewPrefs.applyFromQueryParams(qm);

    if (n !== raw) {
      void this.router.navigate(['/', n], { replaceUrl: true });
      return;
    }

    const prevN = this.corpus.surahNumber();
    if (n !== prevN) {
      this.search.resetOnSurahChange();
      this.tafsir.closeOnSurahChange();
    }

    const { resetViewport } = this.corpus.applySurahNumber(n);
    if (resetViewport) {
      this.activeAyah.resetOnSurahChange();
      this.scroll.resetViewportScroll();
    }

    this.bookmarkUi.refreshFromStorage();
    void this.dailyReminder.syncFromCorpus(payload, this.readingBookmark.read());

    if (shouldNormalizeLegacyQuery && pendingAyah !== null) {
      this.fragments.normalizeLegacyVerseUrl(n, pendingAyah);
    }

    if (isPlatformBrowser(this.platformId) && this.corpus.surah()) {
      this.fragments.verseFragmentSyncEnabled = false;
      afterNextRender(() => this.activeAyah.bindAyahElements(), { injector: this.injector });
    }
  }
}
