import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  Injector,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, map, tap } from 'rxjs';
import type { ReadingBookmark } from '../core/bookmark/reading-bookmark.repository';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import { QURAN_CORPUS_SOURCE } from '../core/quran/quran-corpus.source';
import {
  type QuranFullPayload,
  type QuranSurahPayload,
  type QuranVerseRow,
} from '../core/quran/quran-data.service';
import {
  ReaderLayoutPreferencesService,
  type ReaderFont,
  type ReaderLine,
  type ReaderWidth,
} from '../core/reader-layout/reader-layout-preferences.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import {
  normalizeVerseTranslations,
  VERSE_PRESENTATION_STRATEGY,
  type VersePresentationContext,
} from '../core/verse-presentation/verse-presentation.strategy';
import { SURAH_MULK_META } from '../data/surah-mulk-meta';

type ReaderMode = 'verse-by-verse' | 'reading';

function ayahElementId(ayah: number): string {
  return `ayah-${ayah}`;
}

@Component({
    selector: 'app-surah-reader',
    imports: [NgClass, FormsModule, UiTranslatePipe],
    templateUrl: './surah-reader.component.html',
    styleUrl: './surah-reader.component.scss'
})
export class SurahReaderComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly title = inject(Title);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly corpusSource = inject(QURAN_CORPUS_SOURCE);
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);
  private readonly versePresentation = inject(VERSE_PRESENTATION_STRATEGY);
  private readonly readerLayout = inject(ReaderLayoutPreferencesService);
  protected readonly ui = inject(UiLocaleService);

  protected readonly mulkMeta = SURAH_MULK_META;
  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahNumber = signal(67);
  protected readonly surah = signal<QuranSurahPayload | null>(null);
  protected readonly surahList = signal<readonly { number: number; nameAr: string }[]>([]);

  protected readonly font = this.readerLayout.font;
  protected readonly line = this.readerLayout.line;
  protected readonly width = this.readerLayout.width;
  protected readonly readingMode = signal<ReaderMode>('verse-by-verse');
  protected readonly showTranslationEn = signal(true);
  protected readonly showTranslationUr = signal(true);
  protected settingsOpen = false;

  protected scrollProgress = 0;
  protected stickyHeaderVisible = false;
  protected scrollTopVisible = false;
  /** Verse at the reading line (scroll-driven); signal so the highlight updates reliably. */
  protected readonly activeAyah = signal(1);
  protected jumpAyahModel = '';
  protected copiedAyah: number | null = null;
  protected readonly savedPlace = signal<ReadingBookmark | null>(null);
  protected showBookmarkSavedToast = false;

  /** Text search within the loaded surah (Arabic + English + Urdu). */
  protected readonly surahSearchQuery = signal('');
  /** Index into `surahSearchMatches`; -1 means no match focused yet. */
  protected readonly surahSearchMatchIndex = signal(-1);
  protected readonly surahSearchMatches = computed(() => {
    const s = this.surah();
    const raw = this.surahSearchQuery().trim().normalize('NFKC');
    if (!s || !raw) {
      return [] as readonly number[];
    }
    const needle = raw.toLowerCase();
    const hits: number[] = [];
    for (const v of s.verses) {
      const tr = normalizeVerseTranslations(v);
      const haystack = `${v.ar}\n${tr.en}\n${tr.ur}`.normalize('NFKC').toLowerCase();
      if (haystack.includes(needle)) {
        hits.push(v.ayah);
      }
    }
    return hits;
  });
  private readonly surahSearchMatchSet = computed(() => new Set(this.surahSearchMatches()));

  private scrollRaf = 0;
  /** Ayah whose bookmark icon plays a one-shot pulse after save; cleared then set on rAF so repeat taps replay CSS. */
  protected readonly bookmarkPulseAyah = signal<number | null>(null);
  private bookmarkPulseRaf = 0;
  private ayahElements: Array<HTMLElement | null> | null = null;
  private pendingStartAyah: number | null = null;
  private bookmarkToastTimer: ReturnType<typeof setTimeout> | null = null;
  /** Avoid re-scrolling to the same ?startingVerse= on every unrelated query update. */
  private lastConsumedStartKey = '';

  constructor() {
    const corpus$ = this.corpusSource.load().pipe(
      tap((payload) => {
        this.corpusLoading.set(false);
        this.corpusError.set(payload === null);
        if (payload === null) {
          this.syncDocumentTitle();
        }
      }),
    );

    combineLatest([corpus$, this.route.paramMap, this.route.queryParamMap])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(([payload]) => {
          if (payload === null) {
            this.syncDocumentTitle();
          }
        }),
        filter(([payload]) => payload !== null),
        map(([payload, pm, qm]) => ({ payload: payload as QuranFullPayload, pm, qm })),
      )
      .subscribe(({ payload, pm, qm }) => this.applyCorpusAndRoute(payload, pm, qm));
  }

  private applyCorpusAndRoute(payload: QuranFullPayload, pm: ParamMap, qm: ParamMap): void {
    this.surahList.set(payload.surahs.map((s) => ({ number: s.number, nameAr: s.nameAr })));

    const raw = Number(pm.get('n'));
    const n = Number.isFinite(raw) && raw >= 1 && raw <= 114 ? Math.floor(raw) : 67;
    const startParam = qm.get('startingVerse');
    const hasExplicitStart = startParam !== null && startParam !== '';
    const treatAsFreshNavigation = n !== this.surahNumber() || this.surah() === null;

    let pendingAyah: number | null = null;
    if (hasExplicitStart) {
      const startingVerseRaw = Number(startParam);
      const parsed =
        Number.isFinite(startingVerseRaw) && startingVerseRaw >= 1 ? Math.floor(startingVerseRaw) : 1;
      const startKey = `${n}:${startParam}`;
      if (treatAsFreshNavigation || startKey !== this.lastConsumedStartKey) {
        pendingAyah = parsed;
        this.lastConsumedStartKey = startKey;
      }
    } else {
      this.lastConsumedStartKey = '';
      if (treatAsFreshNavigation) {
        const b = this.readingBookmark.read();
        pendingAyah = b !== null && b.surah === n ? b.ayah : 1;
      }
    }

    this.pendingStartAyah = pendingAyah;
    this.readingMode.set(qm.get('readingMode') === 'reading' ? 'reading' : 'verse-by-verse');

    const translationState = this.parseTranslationSelection(qm.get('translations'));
    this.showTranslationEn.set(translationState.en);
    this.showTranslationUr.set(translationState.ur);

    if (n !== raw) {
      void this.router.navigate(['/surah', n], { replaceUrl: true });
      return;
    }

    this.applySurah(n, payload);
    this.refreshSavedPlaceFromStorage();
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.defaultView?.addEventListener('visibilitychange', this.onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      this.document.defaultView?.removeEventListener('visibilitychange', this.onVisibilityChange);
      if (this.bookmarkPulseRaf !== 0) {
        this.document.defaultView?.cancelAnimationFrame(this.bookmarkPulseRaf);
        this.bookmarkPulseRaf = 0;
      }
      if (this.bookmarkToastTimer !== null) {
        clearTimeout(this.bookmarkToastTimer);
        this.bookmarkToastTimer = null;
      }
      this.readingBookmark.flushPending(this.surahNumber(), this.activeAyah());
      this.savedPlace.set(this.readingBookmark.read());
    });
    this.syncDocumentTitle();
  }

  protected isMulk(): boolean {
    return this.surahNumber() === 67;
  }

  protected verses(): readonly QuranVerseRow[] {
    return this.surah()?.verses ?? [];
  }

  protected verseElementId(ayah: number): string {
    return ayahElementId(ayah);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.updateActiveAyah();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollRaf) {
      return;
    }
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      const root = this.document.documentElement;
      const y = this.document.defaultView?.scrollY ?? 0;
      const max = root.scrollHeight - root.clientHeight;
      this.scrollProgress = max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 0;
      this.stickyHeaderVisible = y > 100;
      this.scrollTopVisible = y > 360;
      this.updateActiveAyah();
    });
  }

  protected onLocaleModelChange(value: string): void {
    if (value === 'en' || value === 'ar' || value === 'ur') {
      this.ui.setLocale(value as UiLocaleCode);
      this.syncDocumentTitle();
    }
  }

  protected scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected saveBookmarkAtCurrentLine(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.updateActiveAyah();
    const s = this.surahNumber();
    const a = this.activeAyah();
    this.readingBookmark.saveNow(s, a);
    this.savedPlace.set({ surah: s, ayah: a });
    this.flashBookmarkSaved(a);
  }

  protected saveBookmarkForVerse(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const s = this.surahNumber();
    this.readingBookmark.saveNow(s, v.ayah);
    this.savedPlace.set({ surah: s, ayah: v.ayah });
    this.flashBookmarkSaved(v.ayah);
  }

  protected goToSavedBookmark(): void {
    this.refreshSavedPlaceFromStorage();
    const b = this.savedPlace() ?? this.readingBookmark.read();
    if (!b) {
      return;
    }
    const maxAyah = this.surah()?.versesCount ?? b.ayah;
    const ayah = Math.min(Math.max(b.ayah, 1), maxAyah);
    if (b.surah !== this.surahNumber()) {
      void this.router.navigate(['/surah', b.surah], {
        queryParams: { startingVerse: ayah },
        queryParamsHandling: 'merge',
      });
      return;
    }
    this.scrollToAyah(ayah, true);
    this.jumpAyahModel = String(ayah);
    this.activeAyah.set(ayah);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateActiveAyah());
    });
  }

  protected isVerseSavedBookmark(v: QuranVerseRow): boolean {
    const b = this.savedPlace();
    return b !== null && b.surah === this.surahNumber() && b.ayah === v.ayah;
  }

  private flashBookmarkSaved(pulseAyah: number): void {
    if (this.bookmarkToastTimer !== null) {
      clearTimeout(this.bookmarkToastTimer);
    }
    this.armBookmarkIconPulse(pulseAyah);
    this.showBookmarkSavedToast = true;
    this.bookmarkToastTimer = setTimeout(() => {
      this.showBookmarkSavedToast = false;
      this.bookmarkToastTimer = null;
    }, 2200);
  }

  private armBookmarkIconPulse(ayah: number): void {
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    if (this.bookmarkPulseRaf !== 0) {
      win.cancelAnimationFrame(this.bookmarkPulseRaf);
      this.bookmarkPulseRaf = 0;
    }
    this.bookmarkPulseAyah.set(null);
    this.bookmarkPulseRaf = win.requestAnimationFrame(() => {
      this.bookmarkPulseRaf = 0;
      this.bookmarkPulseAyah.set(ayah);
    });
  }

  private refreshSavedPlaceFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.savedPlace.set(this.readingBookmark.read());
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected onSurahModelChange(value: string | number): void {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 114 || n === this.surahNumber()) {
      return;
    }
    void this.router.navigate(['/surah', n]);
  }

  protected toggleSettingsPanel(): void {
    this.settingsOpen = !this.settingsOpen;
  }

  protected closeSettingsPanel(): void {
    this.settingsOpen = false;
  }

  @HostListener('document:keydown.escape')
  protected onEscapeCloseSettings(): void {
    if (!this.settingsOpen) {
      return;
    }
    this.closeSettingsPanel();
  }

  protected retryCorpusLoad(): void {
    this.corpusError.set(false);
    this.corpusLoading.set(true);
    this.corpusSource.retryLoad();
  }

  protected setReadingMode(mode: ReaderMode): void {
    this.readingMode.set(mode);
    this.updateReaderQueryParams();
  }

  protected onTranslationCheckboxChange(key: 'en' | 'ur', event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.onTranslationToggle(key, input.checked);
  }

  private onTranslationToggle(key: 'en' | 'ur', checked: boolean): void {
    if (key === 'en') {
      this.showTranslationEn.set(checked);
    } else {
      this.showTranslationUr.set(checked);
    }
    if (!this.showTranslationEn() && !this.showTranslationUr()) {
      if (key === 'en') {
        this.showTranslationUr.set(true);
      } else {
        this.showTranslationEn.set(true);
      }
    }
    this.updateReaderQueryParams();
  }

  protected showTranslations(): boolean {
    return this.readingMode() === 'verse-by-verse' && (this.showTranslationEn() || this.showTranslationUr());
  }

  protected resetReaderViewSettings(): void {
    this.readingMode.set('verse-by-verse');
    this.showTranslationEn.set(true);
    this.showTranslationUr.set(true);
    this.updateReaderQueryParams();
  }

  protected setFont(f: ReaderFont): void {
    this.readerLayout.setFont(f);
  }

  protected setLine(l: ReaderLine): void {
    this.readerLayout.setLine(l);
  }

  protected setWidth(w: ReaderWidth): void {
    this.readerLayout.setWidth(w);
  }

  protected verseTr(v: QuranVerseRow): { en: string; ur: string } {
    return normalizeVerseTranslations(v);
  }

  protected introSummary(): string {
    const s = this.surah();
    if (!s) {
      return '';
    }
    if (this.isMulk()) {
      return this.mulkMeta.themes;
    }
    return this.ui.translate('surahIntroGeneric', {
      name: s.nameAr,
      translit: s.nameTranslit,
      num: this.formatUiNum(s.number),
      verses: this.formatUiNum(s.versesCount),
      type: this.ui.translate(s.revelationType === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan'),
    });
  }

  protected onSurahSearchChange(value: string): void {
    this.surahSearchQuery.set(value);
    this.surahSearchMatchIndex.set(-1);
  }

  protected clearSurahSearch(): void {
    this.surahSearchQuery.set('');
    this.surahSearchMatchIndex.set(-1);
  }

  protected nextSurahSearchMatch(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const m = this.surahSearchMatches();
    if (!m.length) {
      return;
    }
    const i = (this.surahSearchMatchIndex() + 1 + m.length) % m.length;
    this.focusSurahSearchMatchAt(i);
  }

  protected prevSurahSearchMatch(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const m = this.surahSearchMatches();
    if (!m.length) {
      return;
    }
    const cur = this.surahSearchMatchIndex();
    const i = cur < 0 ? m.length - 1 : (cur - 1 + m.length) % m.length;
    this.focusSurahSearchMatchAt(i);
  }

  protected isVerseSurahSearchHit(v: QuranVerseRow): boolean {
    return this.surahSearchMatchSet().has(v.ayah);
  }

  protected isVerseSurahSearchActive(v: QuranVerseRow): boolean {
    const m = this.surahSearchMatches();
    const i = this.surahSearchMatchIndex();
    if (i < 0 || i >= m.length) {
      return false;
    }
    return m[i] === v.ayah;
  }

  private focusSurahSearchMatchAt(i: number): void {
    const m = this.surahSearchMatches();
    if (i < 0 || i >= m.length) {
      return;
    }
    const ayah = m[i]!;
    this.surahSearchMatchIndex.set(i);
    this.scrollToAyah(ayah, true);
    this.jumpAyahModel = String(ayah);
    this.activeAyah.set(ayah);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateActiveAyah());
    });
  }

  protected jumpToAyah(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const n = Number(select.value || this.jumpAyahModel);
    if (!n || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.scrollToAyah(n);
    this.jumpAyahModel = String(n);
    this.activeAyah.set(n);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateActiveAyah());
    });
  }

  protected copyAyah(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard?.writeText) {
      return;
    }
    const text = this.versePresentation.buildCopyText(v, this.versePresentationContext());
    void navigator.clipboard.writeText(text).then(() => {
      this.copiedAyah = v.ayah;
      setTimeout(() => {
        if (this.copiedAyah === v.ayah) {
          this.copiedAyah = null;
        }
      }, 1600);
    });
  }

  protected shareAyah(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId) || typeof navigator.share !== 'function') {
      return;
    }
    const sharePayload = this.versePresentation.buildShareData(v, this.versePresentationContext());
    void navigator.share(sharePayload);
  }

  private versePresentationContext(): VersePresentationContext {
    return {
      surahNumber: this.surahNumber(),
      surahNameAr: this.surah()?.nameAr ?? '',
      origin: this.document.location.origin,
      formatUiNum: (n: number) => this.formatUiNum(n),
    };
  }

  private applySurah(n: number, payload: { surahs: readonly QuranSurahPayload[] }): void {
    const prevN = this.surahNumber();
    if (n !== prevN) {
      this.surahSearchQuery.set('');
      this.surahSearchMatchIndex.set(-1);
    }
    const s = payload.surahs[n - 1] ?? null;
    const resetViewport = n !== this.surahNumber() || this.surah() === null;
    this.surahNumber.set(n);
    this.surah.set(s);
    this.activeAyah.set(1);
    if (resetViewport) {
      this.jumpAyahModel = '';
    }
    this.syncDocumentTitle();
    if (isPlatformBrowser(this.platformId) && resetViewport) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => this.bindAyahElements(), { injector: this.injector });
    }
  }

  private bindAyahElements(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const list = this.verses();
    this.ayahElements = list.map((v) => this.document.getElementById(ayahElementId(v.ayah)));
    const pending = this.pendingStartAyah;
    if (pending !== null) {
      const lastAyah = list.length ? list[list.length - 1]!.ayah : 1;
      const safeAyah = Math.min(Math.max(pending, 1), lastAyah);
      this.scrollToAyah(safeAyah, false);
      this.activeAyah.set(safeAyah);
      this.jumpAyahModel = String(safeAyah);
      this.pendingStartAyah = null;
    }
    this.updateActiveAyah();
  }

  private scrollToAyah(ayah: number, smooth = true): void {
    const el = this.document.getElementById(ayahElementId(ayah));
    if (!el) {
      return;
    }
    void el.offsetHeight;
    el.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
    });
  }

  private readingLineViewportY(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 168;
    }
    const topbar = this.document.querySelector('.reader__topbar');
    let y = (topbar instanceof HTMLElement ? topbar.getBoundingClientRect().bottom : 100) + 12;
    if (this.stickyHeaderVisible) {
      const sticky = this.document.querySelector('.reader__sticky.reader__sticky--visible');
      if (sticky instanceof HTMLElement) {
        y = Math.max(y, sticky.getBoundingClientRect().bottom + 8);
      }
    }
    return Math.min(Math.max(y, 64), 360);
  }

  private updateActiveAyah(): void {
    const lineY = this.readingLineViewportY();
    let next = 1;
    const list = this.verses();
    const els = this.ayahElements;
    const useCachedRefs =
      !!els && els.length === list.length && els.some((el) => el !== null);
    if (useCachedRefs) {
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const verse = list[i];
        if (el && verse && el.getBoundingClientRect().top <= lineY) {
          next = verse.ayah;
        }
      }
    } else {
      for (const v of list) {
        const el = this.document.getElementById(ayahElementId(v.ayah));
        if (el && el.getBoundingClientRect().top <= lineY) {
          next = v.ayah;
        }
      }
    }
    if (next !== this.activeAyah()) {
      this.activeAyah.set(next);
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (!isPlatformBrowser(this.platformId) || this.document.visibilityState !== 'hidden') {
      return;
    }
    this.readingBookmark.flushPending(this.surahNumber(), this.activeAyah());
    this.savedPlace.set(this.readingBookmark.read());
  };

  private syncDocumentTitle(): void {
    const s = this.surah();
    if (s) {
      this.title.setTitle(
        this.ui.translate('documentTitleSurah', { name: s.nameAr, num: this.formatUiNum(s.number) }),
      );
    } else if (this.corpusError()) {
      this.title.setTitle(this.ui.translate('documentTitleError'));
    } else {
      this.title.setTitle(this.ui.translate('documentTitle'));
    }
  }

  private parseTranslationSelection(raw: string | null): { en: boolean; ur: boolean } {
    if (!raw) {
      return { en: true, ur: true };
    }
    const tokens = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (!tokens.length) {
      return { en: true, ur: true };
    }
    const en = tokens.includes('131') || tokens.includes('en');
    const ur = tokens.includes('95') || tokens.includes('ur');
    if (!en && !ur) {
      return { en: true, ur: true };
    }
    return { en, ur };
  }

  private updateReaderQueryParams(): void {
    const translations: string[] = [];
    if (this.showTranslationEn()) {
      translations.push('131');
    }
    if (this.showTranslationUr()) {
      translations.push('95');
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        readingMode: this.readingMode(),
        translations: translations.join(','),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
