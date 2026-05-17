import { DOCUMENT, isPlatformBrowser, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Injector,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, map, startWith, tap } from 'rxjs';
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
  type ReaderColorTheme,
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
import { DailyReminderService } from '../core/notifications/daily-reminder.service';
import { NotificationPreferencesService } from '../core/notifications/notification-preferences.service';
import type { DailyReminderKind } from '../core/notifications/notification-storage';
import {
  parseVerseFragment,
  parseVerseFragmentFromHash,
  verseElementId,
  verseFragment,
} from '../core/routing/verse-deep-link.util';
import { SURAH_MULK_META } from '../data/surah-mulk-meta';
import { VerseQuoteSheetComponent } from '../verse-quote-sheet/verse-quote-sheet.component';
import {
  defaultTafsirSlug,
  tafsirEditionsForLocale,
  type TafsirEdition,
} from '../core/tafsir/tafsir-editions';
import { TafsirService } from '../core/tafsir/tafsir.service';
import { formatTafsirParagraphs } from '../core/tafsir/tafsir-text';

type ReaderMode = 'verse-by-verse' | 'reading';

type SurahNavItem = {
  readonly number: number;
  readonly nameAr: string;
  readonly nameTranslit: string;
  readonly versesCount: number;
  readonly revelationType: 'meccan' | 'medinan';
};

@Component({
    selector: 'app-surah-reader',
    imports: [NgClass, NgTemplateOutlet, FormsModule, RouterLink, UiTranslatePipe, VerseQuoteSheetComponent],
    templateUrl: './surah-reader.component.html',
    styleUrl: './surah-reader.component.scss',
    host: {
        '[class.reader--topbar-compact]': 'topbarCompact && !topbarFullRevealed',
        '[class.reader--topbar-expanded]': 'topbarFullRevealed || !topbarCompact',
        '[class.reader--tafsir-split]': 'tafsirSplitLayout()',
        '[class.reader--tafsir-panel-open]': 'tafsirSplitLayout() && expandedTafsirAyah() !== null',
    },
})
export class SurahReaderComponent implements OnInit {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
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
  private readonly dailyReminder = inject(DailyReminderService);
  private readonly tafsirService = inject(TafsirService);
  protected readonly notifyPrefs = inject(NotificationPreferencesService);
  protected readonly ui = inject(UiLocaleService);

  protected readonly mulkMeta = SURAH_MULK_META;
  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahNumber = signal(67);
  protected readonly surah = signal<QuranSurahPayload | null>(null);
  protected readonly surahList = signal<readonly SurahNavItem[]>([]);
  protected readonly surahNavQuery = signal('');
  protected readonly filteredSurahList = computed(() => {
    const items = this.surahList();
    const raw = this.surahNavQuery().trim().normalize('NFKC');
    if (!raw) {
      return items;
    }
    const q = raw.toLowerCase();
    const qDigits = raw.replace(/\D/g, '');
    const qLatin = q.replace(/[^a-z0-9]/gi, '');
    return items.filter((s) => {
      if (qDigits && String(s.number).includes(qDigits)) {
        return true;
      }
      if (s.nameAr.includes(raw)) {
        return true;
      }
      const translit = s.nameTranslit.normalize('NFKC').toLowerCase();
      if (translit.includes(q)) {
        return true;
      }
      const translitCompact = translit.replace(/[^a-z0-9]/g, '');
      return qLatin.length > 0 && translitCompact.includes(qLatin);
    });
  });

  protected readonly font = this.readerLayout.font;
  protected readonly line = this.readerLayout.line;
  protected readonly width = this.readerLayout.width;
  protected readonly colorTheme = this.readerLayout.colorTheme;
  protected readonly readingMode = signal<ReaderMode>('verse-by-verse');
  protected readonly showTranslationEn = signal(true);
  protected readonly showTranslationUr = signal(true);
  protected settingsOpen = false;
  protected readonly quoteSheetVerse = signal<QuranVerseRow | null>(null);
  protected surahNavOpen = false;

  protected scrollProgress = 0;
  protected scrollTopVisible = false;
  /** Slim top bar with essentials while scrolled; full bar returns near top or on scroll up. */
  protected topbarCompact = false;
  protected topbarFullRevealed = true;
  /** Verse nearest viewport center (scroll-driven); signal so the highlight updates reliably. */
  protected readonly activeAyah = signal(1);
  protected jumpAyahModel = '';
  protected copiedAyah: number | null = null;
  protected readonly savedPlace = signal<ReadingBookmark | null>(null);
  protected showBookmarkSavedToast = false;
  protected readonly notifyPermissionError = signal<'denied' | 'unsupported' | null>(null);

  private static readonly TAFSIR_EDITION_LS_KEY = 'surah-reader-tafsir-edition';

  protected readonly expandedTafsirAyah = signal<number | null>(null);
  protected readonly tafsirEditionSlug = signal('');
  protected readonly tafsirLoading = signal(false);
  protected readonly tafsirError = signal(false);
  protected readonly tafsirText = signal('');
  protected readonly tafsirParagraphs = computed(() => formatTafsirParagraphs(this.tafsirText()));
  /** Desktop/tablet: Quran left, tafsir in a dedicated right column (≥1160px). */
  protected readonly tafsirSplitLayout = signal(false);
  protected readonly verseForTafsir = computed(() => {
    const ayah = this.expandedTafsirAyah();
    const s = this.surah();
    if (ayah == null || !s) {
      return null;
    }
    return s.verses.find((v) => v.ayah === ayah) ?? null;
  });
  private tafsirLoadGeneration = 0;
  private tafsirSplitMql: MediaQueryList | null = null;
  private tafsirSplitMqlListener: ((e: MediaQueryListEvent) => void) | null = null;

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
  private lastScrollY = 0;
  private topbarResizeObserver: ResizeObserver | null = null;
  /** Ayah whose bookmark icon plays a one-shot pulse after save; cleared then set on rAF so repeat taps replay CSS. */
  protected readonly bookmarkPulseAyah = signal<number | null>(null);
  private bookmarkPulseRaf = 0;
  private ayahElements: Array<HTMLElement | null> | null = null;
  private loadedCorpus: QuranFullPayload | null = null;
  private pendingStartAyah: number | null = null;
  private bookmarkToastTimer: ReturnType<typeof setTimeout> | null = null;
  /** Avoid re-scrolling to the same verse anchor on every unrelated route update. */
  private lastConsumedStartKey = '';
  /** After initial scroll, keep the URL fragment aligned with the reading line. */
  private verseFragmentSyncEnabled = false;
  private fragmentSyncTimer: ReturnType<typeof setTimeout> | null = null;
  /** Router-driven fragment updates we triggered (must not re-scroll). */
  private fragmentScrollSuppressKey: string | null = null;
  private pendingScrollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.tafsirEditionSlug.set(this.readStoredTafsirEdition());
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => this.bindTafsirSplitLayout(), { injector: this.injector });
    }
    const corpus$ = this.corpusSource.load().pipe(
      tap((payload) => {
        this.corpusLoading.set(false);
        this.corpusError.set(payload === null);
        if (payload === null) {
          this.syncDocumentTitle();
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
            this.syncDocumentTitle();
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
      .subscribe(({ payload, pm, qm, fragment }) =>
        this.applyCorpusAndRoute(payload, pm, qm, fragment),
      );
  }

  private applyCorpusAndRoute(
    payload: QuranFullPayload,
    pm: ParamMap,
    qm: ParamMap,
    fragment: string | null,
  ): void {
    this.loadedCorpus = payload;
    this.surahList.set(
      payload.surahs.map((s) => ({
        number: s.number,
        nameAr: s.nameAr,
        nameTranslit: s.nameTranslit,
        versesCount: s.versesCount,
        revelationType: s.revelationType,
      })),
    );

    const raw = Number(pm.get('n'));
    const n = Number.isFinite(raw) && raw >= 1 && raw <= 114 ? Math.floor(raw) : 67;
    const targetAyah = this.resolveRouteTargetAyah(fragment, qm);
    const startParam = qm.get('startingVerse');
    const hasLegacyStartParam = startParam !== null && startParam !== '';
    const treatAsFreshNavigation = n !== this.surahNumber() || this.surah() === null;
    let shouldNormalizeLegacyQuery = false;

    let pendingAyah: number | null = null;
    if (targetAyah !== null) {
      const startKey = `${n}#${targetAyah}`;
      if (this.consumeFragmentScrollSuppression(n, targetAyah)) {
        this.lastConsumedStartKey = startKey;
      } else if (treatAsFreshNavigation || startKey !== this.lastConsumedStartKey) {
        const alreadyAtVerse = !treatAsFreshNavigation && targetAyah === this.activeAyah();
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
        this.verseFragmentSyncEnabled = false;
        const b = this.readingBookmark.read();
        pendingAyah = b !== null && b.surah === n ? b.ayah : 1;
      }
    }

    if (pendingAyah !== null) {
      this.pendingStartAyah = pendingAyah;
    }
    this.readingMode.set(qm.get('readingMode') === 'reading' ? 'reading' : 'verse-by-verse');

    const translationState = this.parseTranslationSelection(qm.get('translations'));
    this.showTranslationEn.set(translationState.en);
    this.showTranslationUr.set(translationState.ur);

    if (n !== raw) {
      void this.router.navigate(['/', n], { replaceUrl: true });
      return;
    }

    this.applySurah(n, payload);
    this.refreshSavedPlaceFromStorage();
    void this.dailyReminder.syncFromCorpus(payload, this.readingBookmark.read());

    if (shouldNormalizeLegacyQuery && pendingAyah !== null) {
      this.normalizeVerseUrl(n, pendingAyah);
    }

    if (this.pendingStartAyah !== null) {
      this.scheduleFulfillPendingStart();
    }
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
      if (this.fragmentSyncTimer !== null) {
        clearTimeout(this.fragmentSyncTimer);
        this.fragmentSyncTimer = null;
      }
      if (this.pendingScrollTimer !== null) {
        clearTimeout(this.pendingScrollTimer);
        this.pendingScrollTimer = null;
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
    return verseElementId(ayah);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.updateActiveAyah();
    this.syncTopbarHeightFromDom();
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
      this.updateTopbarScrollState(y);
      this.scrollTopVisible = y > 360;
      this.updateActiveAyah();
    });
  }

  protected onLocaleModelChange(value: string): void {
    if (value === 'en' || value === 'ar' || value === 'ur') {
      this.ui.setLocale(value as UiLocaleCode);
      this.syncDocumentTitle();
      const prevSlug = this.tafsirEditionSlug();
      const nextSlug = this.resolveTafsirEditionSlug();
      if (prevSlug !== nextSlug) {
        this.persistTafsirEdition(nextSlug);
      }
      const openAyah = this.expandedTafsirAyah();
      if (openAyah !== null) {
        this.fetchTafsirForVerse(openAyah);
      }
      if (this.loadedCorpus) {
        void this.dailyReminder.syncFromCorpus(this.loadedCorpus, this.readingBookmark.read());
      }
    }
  }

  protected scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    this.topbarCompact = false;
    this.topbarFullRevealed = true;
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
    void this.dailyReminder.onBookmarkChanged();
  }

  protected saveBookmarkForVerse(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const s = this.surahNumber();
    this.readingBookmark.saveNow(s, v.ayah);
    this.savedPlace.set({ surah: s, ayah: v.ayah });
    this.flashBookmarkSaved(v.ayah);
    void this.dailyReminder.onBookmarkChanged();
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
      void this.router.navigate(['/', b.surah], {
        fragment: verseFragment(ayah),
        queryParamsHandling: 'merge',
      });
      return;
    }
    this.scrollToAyah(ayah, true);
    this.jumpAyahModel = String(ayah);
    this.activeAyah.set(ayah);
    this.replaceVerseFragmentInUrl(ayah);
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

  protected readonly formatUiNumForQuote = (n: number): string => this.formatUiNum(n);

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected toggleSurahNav(): void {
    if (this.surahNavOpen) {
      this.closeSurahNav();
      return;
    }
    this.openSurahNav();
  }

  protected openSurahNav(): void {
    this.settingsOpen = false;
    this.surahNavOpen = true;
    this.surahNavQuery.set('');
    this.topbarFullRevealed = true;
    this.syncTopbarHeightFromDom();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    afterNextRender(
      () => {
        const input = this.document.getElementById('surah-nav-search');
        if (input instanceof HTMLInputElement) {
          input.focus();
        }
        this.document
          .querySelector('.reader__surah-nav-btn--active')
          ?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      },
      { injector: this.injector },
    );
  }

  protected closeSurahNav(): void {
    this.surahNavOpen = false;
    this.surahNavQuery.set('');
    this.syncTopbarHeightFromDom();
  }

  protected onSurahNavQueryChange(value: string): void {
    this.surahNavQuery.set(value);
  }

  protected clearSurahNavQuery(): void {
    this.surahNavQuery.set('');
  }

  protected selectSurahFromNav(n: number): void {
    if (!Number.isFinite(n) || n < 1 || n > 114) {
      return;
    }
    this.closeSurahNav();
    if (n === this.surahNumber()) {
      return;
    }
    void this.router.navigate(['/', n]);
  }

  protected surahNavTypeLabel(item: SurahNavItem): string {
    return this.ui.translate(item.revelationType === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan');
  }

  protected reminderTimeValue(): string {
    const h = String(this.notifyPrefs.hour()).padStart(2, '0');
    const m = String(this.notifyPrefs.minute()).padStart(2, '0');
    return `${h}:${m}`;
  }

  protected async onDailyReminderToggle(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.notifyPermissionError.set(null);
    if (input.checked) {
      const result = await this.dailyReminder.enableReminders();
      if (result === 'denied') {
        this.notifyPermissionError.set('denied');
        input.checked = false;
      } else if (result === 'unsupported') {
        this.notifyPermissionError.set('unsupported');
        input.checked = false;
      }
      return;
    }
    this.dailyReminder.disableReminders();
  }

  protected onReminderTimeChange(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.value) {
      return;
    }
    const [hourRaw, minuteRaw] = input.value.split(':');
    void this.dailyReminder.setReminderTime(Number(hourRaw), Number(minuteRaw));
  }

  protected setReminderKind(kind: DailyReminderKind): void {
    void this.dailyReminder.setReminderKind(kind);
  }

  protected checkReminderNow(): void {
    void this.dailyReminder.checkNow();
  }

  protected notificationsUnsupported(): boolean {
    return this.dailyReminder.notificationPermission() === 'unsupported';
  }

  protected toggleSettingsPanel(): void {
    this.settingsOpen = !this.settingsOpen;
    if (this.settingsOpen) {
      this.surahNavOpen = false;
      this.topbarFullRevealed = true;
    }
    this.syncTopbarHeightFromDom();
  }

  protected closeSettingsPanel(): void {
    this.settingsOpen = false;
    this.syncTopbarHeightFromDom();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeClosePanels(): void {
    if (this.quoteSheetVerse()) {
      this.closeQuoteSheet();
      return;
    }
    if (this.surahNavOpen) {
      this.closeSurahNav();
      return;
    }
    if (this.settingsOpen) {
      this.closeSettingsPanel();
    }
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

  protected setColorTheme(theme: ReaderColorTheme): void {
    this.readerLayout.setColorTheme(theme);
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

  protected introDeepSummary(): string {
    return this.isMulk()
      ? this.ui.translate('aboutSummary')
      : this.ui.translate('aboutSummaryGeneric');
  }

  protected tafsirEditionsForLocale(): readonly TafsirEdition[] {
    return tafsirEditionsForLocale(this.ui.locale());
  }

  protected isTafsirOpen(v: QuranVerseRow): boolean {
    return this.expandedTafsirAyah() === v.ayah;
  }

  protected toggleTafsir(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.expandedTafsirAyah() === v.ayah) {
      this.closeTafsir();
      return;
    }
    this.openTafsirForVerse(v.ayah);
  }

  protected onVerseContentKeyActivate(v: QuranVerseRow, event: Event): void {
    if (!this.tafsirSplitLayout() || !(event instanceof KeyboardEvent)) {
      return;
    }
    event.preventDefault();
    if (this.expandedTafsirAyah() === v.ayah) {
      return;
    }
    this.openTafsirForVerse(v.ayah);
  }

  protected onVerseContentClick(v: QuranVerseRow, event: MouseEvent): void {
    if (!this.tafsirSplitLayout() || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button, a, select, input, textarea, label')) {
      return;
    }
    if (this.expandedTafsirAyah() === v.ayah) {
      return;
    }
    this.openTafsirForVerse(v.ayah);
  }

  protected closeTafsirPanel(): void {
    this.closeTafsir();
  }

  protected onTafsirEditionChange(slug: string, v: QuranVerseRow): void {
    if (!slug || slug === this.tafsirEditionSlug()) {
      return;
    }
    this.tafsirEditionSlug.set(slug);
    this.persistTafsirEdition(slug);
    if (this.expandedTafsirAyah() === v.ayah) {
      this.fetchTafsirForVerse(v.ayah);
    }
  }

  protected retryTafsir(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.tafsirService.invalidateVerse(this.tafsirEditionSlug(), this.surahNumber(), v.ayah);
    this.fetchTafsirForVerse(v.ayah);
  }

  private openTafsirForVerse(ayah: number): void {
    this.expandedTafsirAyah.set(ayah);
    this.fetchTafsirForVerse(ayah);
    if (this.tafsirSplitLayout()) {
      this.scrollVerseIntoViewForTafsir(ayah);
    }
  }

  private closeTafsir(): void {
    this.expandedTafsirAyah.set(null);
    this.tafsirLoading.set(false);
    this.tafsirError.set(false);
    this.tafsirText.set('');
    this.tafsirLoadGeneration += 1;
  }

  private scrollVerseIntoViewForTafsir(ayah: number): void {
    const el = this.document.getElementById(verseElementId(ayah));
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private bindTafsirSplitLayout(): void {
    const mql = this.document.defaultView?.matchMedia('(min-width: 1160px)');
    if (!mql) {
      return;
    }
    this.tafsirSplitMql = mql;
    this.tafsirSplitLayout.set(mql.matches);
    const onChange = (e: MediaQueryListEvent) => this.tafsirSplitLayout.set(e.matches);
    this.tafsirSplitMqlListener = onChange;
    mql.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => {
      mql.removeEventListener('change', onChange);
      this.tafsirSplitMql = null;
      this.tafsirSplitMqlListener = null;
    });
  }

  private fetchTafsirForVerse(ayah: number): void {
    const slug = this.resolveTafsirEditionSlug();
    const gen = ++this.tafsirLoadGeneration;
    this.tafsirLoading.set(true);
    this.tafsirError.set(false);
    this.tafsirText.set('');
    this.tafsirService
      .loadVerse(slug, this.surahNumber(), ayah)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (gen !== this.tafsirLoadGeneration || this.expandedTafsirAyah() !== ayah) {
          return;
        }
        this.tafsirLoading.set(false);
        if (!payload?.text?.trim()) {
          this.tafsirError.set(true);
          return;
        }
        this.tafsirText.set(payload.text.trim());
      });
  }

  private resolveTafsirEditionSlug(): string {
    const slug = this.tafsirEditionSlug();
    const allowed = this.tafsirEditionsForLocale();
    if (allowed.some((e) => e.slug === slug)) {
      return slug;
    }
    const fallback = defaultTafsirSlug(this.ui.locale());
    this.tafsirEditionSlug.set(fallback);
    return fallback;
  }

  private readStoredTafsirEdition(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return defaultTafsirSlug('en');
    }
    try {
      const saved = localStorage.getItem(SurahReaderComponent.TAFSIR_EDITION_LS_KEY);
      if (saved) {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return defaultTafsirSlug(this.ui.locale());
  }

  private persistTafsirEdition(slug: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(SurahReaderComponent.TAFSIR_EDITION_LS_KEY, slug);
    } catch {
      /* ignore */
    }
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
    this.replaceVerseFragmentInUrl(ayah);
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
    this.replaceVerseFragmentInUrl(n);
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

  protected openQuoteImage(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.quoteSheetVerse.set(v);
    this.settingsOpen = false;
    this.surahNavOpen = false;
  }

  protected closeQuoteSheet(): void {
    this.quoteSheetVerse.set(null);
  }

  protected readerOrigin(): string {
    return isPlatformBrowser(this.platformId) ? this.document.location.origin : '';
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
      this.closeTafsir();
    }
    const s = payload.surahs[n - 1] ?? null;
    const resetViewport = n !== this.surahNumber() || this.surah() === null;
    this.surahNumber.set(n);
    this.surah.set(s);
    if (resetViewport) {
      this.activeAyah.set(1);
      this.jumpAyahModel = '';
      this.verseFragmentSyncEnabled = false;
    }
    this.syncDocumentTitle();
    if (isPlatformBrowser(this.platformId) && resetViewport) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'auto' });
      this.topbarCompact = false;
      this.topbarFullRevealed = true;
      this.lastScrollY = 0;
    }
    if (isPlatformBrowser(this.platformId) && resetViewport) {
      afterNextRender(() => this.bindAyahElements(), { injector: this.injector });
    }
  }

  private bindAyahElements(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.bindTopbarHeightSync();
    const list = this.verses();
    this.ayahElements = list.map((v) => this.document.getElementById(verseElementId(v.ayah)));
    if (this.pendingStartAyah !== null) {
      this.fulfillPendingStartAyah();
      return;
    }
    this.finishAyahBinding();
  }

  private scheduleFulfillPendingStart(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.verseFragmentSyncEnabled = false;
    afterNextRender(() => this.fulfillPendingStartAyah(), { injector: this.injector });
  }

  private fulfillPendingStartAyah(attempt = 0): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const pending = this.pendingStartAyah;
    if (pending === null) {
      this.finishAyahBinding();
      return;
    }
    const list = this.verses();
    if (list.length === 0 || this.surah() === null) {
      if (attempt < 24) {
        this.pendingScrollTimer = setTimeout(() => this.fulfillPendingStartAyah(attempt + 1), 50);
      }
      return;
    }
    const lastAyah = list[list.length - 1]!.ayah;
    const safeAyah = Math.min(Math.max(pending, 1), lastAyah);
    const el = this.document.getElementById(verseElementId(safeAyah));
    if (!el) {
      if (attempt < 24) {
        this.pendingScrollTimer = setTimeout(() => this.fulfillPendingStartAyah(attempt + 1), 50);
      }
      return;
    }
    this.scrollToAyah(safeAyah, false);
    this.activeAyah.set(safeAyah);
    this.jumpAyahModel = String(safeAyah);
    this.pendingStartAyah = null;
    this.markFragmentScrollSuppressed(this.surahNumber(), safeAyah);
    this.replaceVerseFragmentInUrl(safeAyah);
    this.ayahElements = list.map((v) => this.document.getElementById(verseElementId(v.ayah)));
    this.finishAyahBinding();
  }

  private finishAyahBinding(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.verseFragmentSyncEnabled = true;
    const y = this.document.defaultView?.scrollY ?? 0;
    this.updateTopbarScrollState(y);
    this.updateActiveAyah();
  }

  private resolveRouteTargetAyah(fragment: string | null, qm: ParamMap): number | null {
    const hashAyah = isPlatformBrowser(this.platformId)
      ? parseVerseFragmentFromHash(this.document.defaultView?.location.hash ?? '')
      : null;
    const fromFragment = parseVerseFragment(fragment) ?? hashAyah;
    if (fromFragment !== null) {
      return fromFragment;
    }
    const startParam = qm.get('startingVerse');
    if (startParam === null || startParam === '') {
      return null;
    }
    const parsed = Number(startParam);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return null;
    }
    return Math.floor(parsed);
  }

  private scrollToAyah(ayah: number, smooth = true): void {
    const el = this.document.getElementById(verseElementId(ayah));
    if (!el) {
      return;
    }
    void el.offsetHeight;
    el.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
    });
  }

  private updateTopbarScrollState(y: number): void {
    const compactThreshold = 72;
    if (this.settingsOpen || this.surahNavOpen || this.quoteSheetVerse()) {
      this.topbarCompact = y > compactThreshold;
      this.topbarFullRevealed = true;
    } else if (y <= compactThreshold) {
      this.topbarCompact = false;
      this.topbarFullRevealed = true;
    } else {
      this.topbarCompact = true;
      const delta = y - this.lastScrollY;
      if (delta < -12) {
        this.topbarFullRevealed = true;
      } else if (delta > 12) {
        this.topbarFullRevealed = false;
      }
    }
    this.lastScrollY = y;
    this.syncTopbarHeightFromDom();
  }

  private bindTopbarHeightSync(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const topbar = this.document.querySelector('.reader__topbar');
    if (!(topbar instanceof HTMLElement)) {
      return;
    }
    this.syncTopbarHeightFromDom();
    if (this.topbarResizeObserver) {
      return;
    }
    this.topbarResizeObserver = new ResizeObserver(() => this.syncTopbarHeightFromDom());
    this.topbarResizeObserver.observe(topbar);
    this.destroyRef.onDestroy(() => {
      this.topbarResizeObserver?.disconnect();
      this.topbarResizeObserver = null;
    });
  }

  private syncTopbarHeightFromDom(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const topbar = this.document.querySelector('.reader__topbar');
    if (!(topbar instanceof HTMLElement)) {
      return;
    }
    const h = topbar.getBoundingClientRect().height;
    if (h > 0) {
      this.hostEl.nativeElement.style.setProperty('--reader-topbar-h', `${h}px`);
    }
  }

  private viewportCenterY(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 400;
    }
    return (this.document.defaultView?.innerHeight ?? 800) / 2;
  }

  private updateActiveAyah(): void {
    const centerY = this.viewportCenterY();
    let next = 1;
    let bestDistance = Infinity;
    const list = this.verses();
    const els = this.ayahElements;
    const useCachedRefs =
      !!els && els.length === list.length && els.some((el) => el !== null);
    if (useCachedRefs) {
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const verse = list[i];
        if (!el || !verse) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        const verseCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(verseCenterY - centerY);
        if (distance < bestDistance) {
          bestDistance = distance;
          next = verse.ayah;
        }
      }
    } else {
      for (const v of list) {
        const el = this.document.getElementById(verseElementId(v.ayah));
        if (!el) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        const verseCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(verseCenterY - centerY);
        if (distance < bestDistance) {
          bestDistance = distance;
          next = v.ayah;
        }
      }
    }
    if (next !== this.activeAyah()) {
      this.activeAyah.set(next);
      this.scheduleVerseFragmentSync(next);
    }
  }

  private markFragmentScrollSuppressed(surah: number, ayah: number): void {
    this.fragmentScrollSuppressKey = `${surah}#${verseFragment(ayah)}`;
  }

  private consumeFragmentScrollSuppression(surah: number, ayah: number): boolean {
    const key = `${surah}#${verseFragment(ayah)}`;
    if (this.fragmentScrollSuppressKey === key) {
      this.fragmentScrollSuppressKey = null;
      return true;
    }
    return false;
  }

  /** Update the hash without a router navigation (avoids anchor re-scroll loops). */
  private replaceVerseFragmentInUrl(ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    const fragment = verseFragment(ayah);
    if (win.location.hash === `#${fragment}`) {
      return;
    }
    const path = `${win.location.pathname}${win.location.search}`;
    win.history.replaceState(win.history.state, '', `${path}#${fragment}`);
  }

  private normalizeVerseUrl(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.markFragmentScrollSuppressed(surah, ayah);
    void this.router.navigate(['/', surah], {
      fragment: verseFragment(ayah),
      queryParams: { startingVerse: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private scheduleVerseFragmentSync(ayah: number): void {
    if (!this.verseFragmentSyncEnabled || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.fragmentSyncTimer !== null) {
      clearTimeout(this.fragmentSyncTimer);
    }
    this.fragmentSyncTimer = setTimeout(() => {
      this.fragmentSyncTimer = null;
      this.replaceVerseFragmentInUrl(ayah);
    }, 400);
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
