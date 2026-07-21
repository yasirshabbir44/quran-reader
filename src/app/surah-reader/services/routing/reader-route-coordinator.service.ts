import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, DestroyRef, Injector, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, map, startWith, tap } from 'rxjs';
import { QURAN_CORPUS_SOURCE } from '../../../core/quran/quran-corpus.source';
import type { QuranFullPayload } from '../../../core/quran/quran-data.service';
import { MushafIndexService } from '../../../core/mushaf/mushaf-index.service';
import type { MushafIndexPayload } from '../../../core/mushaf/mushaf-index.types';
import { READING_BOOKMARK_REPOSITORY } from '../../../core/bookmark/reading-bookmark.repository';
import { KhatamService } from '../../../core/khatam/khatam.service';
import { DailyReminderService } from '../../../core/notifications/daily-reminder.service';
import { ReaderActiveAyahService } from '../navigation/reader-active-ayah.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';
import { ReaderSurahSearchService } from '../navigation/reader-surah-search.service';
import { ReaderTafsirPanelService } from '../panels/reader-tafsir-panel.service';
import { ReaderWordStudyPanelService } from '../panels/reader-word-study-panel.service';
import { ReaderVerseFragmentService } from './reader-verse-fragment.service';
import { ReaderViewPreferencesService } from '../preferences/reader-view-preferences.service';
import { ReaderBookmarkUiService } from '../bookmark/reader-bookmark-ui.service';
import { ReaderScrollStateService } from '../navigation/reader-scroll-state.service';
import { ReaderMushafNavService } from '../panels/reader-mushaf-nav.service';
import type { ReaderViewKind } from '../../models/reader-view-kind.model';

type ResolvedRoute =
  | { readonly kind: 'surah'; readonly n: number }
  | { readonly kind: 'page'; readonly p: number }
  | { readonly kind: 'juz'; readonly j: number };

/** Syncs router params, query, and fragment with corpus payload and reader services. */
@Injectable()
export class ReaderRouteCoordinatorService {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly corpusSource = inject(QURAN_CORPUS_SOURCE);
  private readonly mushafIndexService = inject(MushafIndexService);
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);
  private readonly dailyReminder = inject(DailyReminderService);

  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly viewPrefs = inject(ReaderViewPreferencesService);
  private readonly activeAyah = inject(ReaderActiveAyahService);
  private readonly fragments = inject(ReaderVerseFragmentService);
  private readonly search = inject(ReaderSurahSearchService);
  private readonly tafsir = inject(ReaderTafsirPanelService);
  private readonly wordStudy = inject(ReaderWordStudyPanelService);
  private readonly bookmarkUi = inject(ReaderBookmarkUiService);
  private readonly scroll = inject(ReaderScrollStateService);
  private readonly mushafNav = inject(ReaderMushafNavService);
  private readonly khatam = inject(KhatamService);

  private lastConsumedStartKey = '';

  bind(onTitleSync: () => void): void {
    if (isPlatformBrowser(this.platformId)) {
      this.khatam.hydrateFromStorage();
      this.khatam.syncDay();
    }

    const corpus$ = this.corpusSource.load().pipe(
      tap((payload) => {
        this.corpus.setCorpusPayload(payload);
        if (payload) {
          this.khatam.bindCorpus(payload.surahs);
        }
        if (payload === null) {
          onTitleSync();
        }
      }),
    );

    const mushaf$ = this.mushafIndexService.load().pipe(
      tap((payload) => {
        this.corpus.setMushafPayload(payload);
        this.mushafNav.setIndex(payload);
        if (payload) {
          this.khatam.bindMushafIndex(payload);
        }
      }),
    );

    combineLatest([
      corpus$,
      mushaf$,
      this.route.paramMap,
      this.route.queryParamMap,
      this.route.fragment.pipe(startWith(this.route.snapshot.fragment)),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(([corpus]) => {
          if (corpus === null) {
            onTitleSync();
          }
        }),
        filter(([corpus, mushaf]) => corpus !== null && mushaf !== null),
        map(([corpus, mushaf, pm, qm, fragment]) => ({
          corpus: corpus as QuranFullPayload,
          mushaf: mushaf as MushafIndexPayload,
          pm,
          qm,
          fragment,
        })),
      )
      .subscribe(({ corpus, mushaf, pm, qm, fragment }) => {
        this.applyCorpusAndRoute(corpus, mushaf, pm, qm, fragment);
        onTitleSync();
      });
  }

  retryCorpusLoad(): void {
    this.corpus.beginRetry();
    this.corpusSource.retryLoad();
    this.mushafIndexService.retryLoad();
  }

  private applyCorpusAndRoute(
    payload: QuranFullPayload,
    mushaf: MushafIndexPayload,
    pm: ParamMap,
    qm: ParamMap,
    fragment: string | null,
  ): void {
    this.corpus.setCorpusPayload(payload);
    this.corpus.setMushafPayload(mushaf);

    const resolved = this.resolveRoute(pm);
    const rawParam = this.rawRouteParam(pm, resolved);
    if (rawParam !== null && rawParam !== String(this.routeKey(resolved))) {
      void this.navigateToResolved(resolved, true);
      return;
    }

    const prevKind = this.corpus.viewKind();
    const prevKey =
      prevKind === 'surah'
        ? this.corpus.surahNumber()
        : prevKind === 'page'
          ? this.corpus.pageNumber()
          : this.corpus.juzNumber();

    const { resetViewport } = this.applyView(resolved, payload, mushaf);
    if (resetViewport) {
      this.activeAyah.resetOnViewChange();
      this.scroll.resetViewportScroll();
    }

    const startParam = qm.get('startingVerse');
    const hasLegacyStartParam = startParam !== null && startParam !== '';
    const treatAsFreshNavigation = this.isFreshNavigation(resolved);
    let shouldNormalizeLegacyQuery = false;

    let pendingTarget = this.fragments.resolveRouteTarget(fragment, qm);
    if (pendingTarget === null && treatAsFreshNavigation && resolved.kind === 'surah') {
      const b = this.readingBookmark.read();
      if (b !== null && b.surah === resolved.n) {
        pendingTarget = { surah: b.surah, ayah: b.ayah };
      } else {
        pendingTarget = { surah: resolved.n, ayah: 1 };
      }
    } else if (pendingTarget === null && treatAsFreshNavigation) {
      pendingTarget = this.defaultTargetForView(resolved, payload, mushaf);
    }

    if (pendingTarget !== null) {
      const startKey = `${resolved.kind}:${this.routeKey(resolved)}#${pendingTarget.surah}:${pendingTarget.ayah}`;
      if (this.fragments.consumeScrollSuppression(resolved, pendingTarget)) {
        this.lastConsumedStartKey = startKey;
      } else if (treatAsFreshNavigation || startKey !== this.lastConsumedStartKey) {
        const current = this.activeAyah.activeVerse();
        const alreadyAt =
          !treatAsFreshNavigation &&
          current.surah === pendingTarget.surah &&
          current.ayah === pendingTarget.ayah;
        if (!alreadyAt) {
          this.activeAyah.pendingStartVerse = pendingTarget;
        }
        this.lastConsumedStartKey = startKey;
        if (hasLegacyStartParam && resolved.kind === 'surah') {
          shouldNormalizeLegacyQuery = true;
        }
      }
    } else {
      this.lastConsumedStartKey = '';
    }

    this.viewPrefs.applyFromQueryParams(qm);

    if (resolved.kind === 'surah' && prevKind === 'surah' && resolved.n !== prevKey) {
      this.search.resetOnSurahChange();
      this.tafsir.closeOnSurahChange();
      this.wordStudy.closeOnViewChange();
    } else if (this.viewKindKey(resolved) !== prevKind || this.routeKey(resolved) !== prevKey) {
      this.search.resetOnSurahChange();
      this.tafsir.closeOnSurahChange();
      this.wordStudy.closeOnViewChange();
    }

    this.bookmarkUi.refreshFromStorage();
    void this.dailyReminder.syncFromCorpus(payload, this.readingBookmark.read());

    if (shouldNormalizeLegacyQuery && pendingTarget !== null && resolved.kind === 'surah') {
      this.fragments.normalizeLegacyVerseUrl(resolved.n, pendingTarget.ayah);
    }

    if (isPlatformBrowser(this.platformId) && this.corpus.displayVerses().length > 0) {
      this.fragments.verseFragmentSyncEnabled = false;
      afterNextRender(() => this.activeAyah.bindAyahElements(), { injector: this.injector });
    }
  }

  private resolveRoute(pm: ParamMap): ResolvedRoute {
    const pRaw = pm.get('p');
    if (pRaw !== null) {
      const p = Number(pRaw);
      if (Number.isInteger(p) && p >= 1 && p <= 604) {
        return { kind: 'page', p };
      }
    }
    const jRaw = pm.get('j');
    if (jRaw !== null) {
      const j = Number(jRaw);
      if (Number.isInteger(j) && j >= 1 && j <= 30) {
        return { kind: 'juz', j };
      }
    }
    const raw = Number(pm.get('n'));
    const n = Number.isFinite(raw) && raw >= 1 && raw <= 114 ? Math.floor(raw) : 67;
    return { kind: 'surah', n };
  }

  private rawRouteParam(pm: ParamMap, resolved: ResolvedRoute): string | null {
    if (resolved.kind === 'page') {
      return pm.get('p');
    }
    if (resolved.kind === 'juz') {
      return pm.get('j');
    }
    return pm.get('n');
  }

  private routeKey(resolved: ResolvedRoute): number {
    if (resolved.kind === 'page') {
      return resolved.p;
    }
    if (resolved.kind === 'juz') {
      return resolved.j;
    }
    return resolved.n;
  }

  private viewKindKey(resolved: ResolvedRoute): ReaderViewKind {
    return resolved.kind;
  }

  private isFreshNavigation(resolved: ResolvedRoute): boolean {
    const kind = this.corpus.viewKind();
    if (resolved.kind !== kind) {
      return true;
    }
    if (resolved.kind === 'surah') {
      return resolved.n !== this.corpus.surahNumber() || this.corpus.surah() === null;
    }
    if (resolved.kind === 'page') {
      return resolved.p !== this.corpus.pageNumber();
    }
    return resolved.j !== this.corpus.juzNumber();
  }

  private applyView(
    resolved: ResolvedRoute,
    _payload: QuranFullPayload,
    _mushaf: MushafIndexPayload,
  ): { resetViewport: boolean } {
    if (resolved.kind === 'page') {
      return this.corpus.applyPageNumber(resolved.p);
    }
    if (resolved.kind === 'juz') {
      return this.corpus.applyJuzNumber(resolved.j);
    }
    return this.corpus.applySurahNumber(resolved.n);
  }

  private defaultTargetForView(
    resolved: ResolvedRoute,
    _payload: QuranFullPayload,
    _mushaf: MushafIndexPayload,
  ): { surah: number; ayah: number } {
    if (resolved.kind === 'page') {
      const start = _mushaf.pages.find((p) => p.page === resolved.p)?.start;
      return start ?? { surah: 1, ayah: 1 };
    }
    if (resolved.kind === 'juz') {
      const start = _mushaf.juz.find((j) => j.juz === resolved.j)?.start;
      return start ?? { surah: 1, ayah: 1 };
    }
    return { surah: resolved.n, ayah: 1 };
  }

  private navigateToResolved(resolved: ResolvedRoute, replaceUrl: boolean): Promise<boolean> {
    if (resolved.kind === 'page') {
      return this.router.navigate(['/page', resolved.p], { replaceUrl });
    }
    if (resolved.kind === 'juz') {
      return this.router.navigate(['/juz', resolved.j], { replaceUrl });
    }
    return this.router.navigate(['/', resolved.n], { replaceUrl });
  }
}
