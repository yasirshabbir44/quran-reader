import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  Injector,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { QuranVerseRow } from '../core/quran/quran-data.service';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import { DailyReminderService } from '../core/notifications/daily-reminder.service';
import { NotificationPreferencesService } from '../core/notifications/notification-preferences.service';
import type { DailyReminderKind } from '../core/notifications/notification-storage';
import {
  normalizeVerseTranslations,
  normalizeVerseTransliteration,
} from '../core/verse-presentation/verse-presentation.strategy';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import { verseElementId } from '../core/routing/verse-deep-link.util';
import { VerseQuoteSheetComponent } from '../verse-quote-sheet/verse-quote-sheet.component';
import { READER_FEATURE_PROVIDERS } from './reader.providers';
import {
  ReaderActiveAyahService,
  ReaderBookmarkUiService,
  ReaderCorpusStateService,
  ReaderDocumentTitleService,
  ReaderIntroContentService,
  ReaderLayoutBreakpointsService,
  ReaderPanelCoordinatorService,
  ReaderRouteCoordinatorService,
  ReaderScrollStateService,
  ReaderSurahNavService,
  ReaderSurahSearchService,
  ReaderSwipeNavigationService,
  ReaderTafsirPanelService,
  ReaderVerseActionsService,
  ReaderVerseFragmentService,
  ReaderViewPreferencesService,
} from './services';
import type { SurahNavItem } from './models/surah-nav-item.model';
import { ReaderTafsirPanelComponent } from './ui/reader-tafsir-panel/reader-tafsir-panel.component';

/**
 * Surah reader route shell.
 *
 * Delegates state and behavior to feature-scoped services (see `reader.providers.ts`
 * and `surah-reader/README.md`). Keeps DOM host bindings and browser event listeners only.
 */
@Component({
  selector: 'app-surah-reader',
  imports: [
    NgClass,
    FormsModule,
    RouterLink,
    UiTranslatePipe,
    VerseQuoteSheetComponent,
    ReaderTafsirPanelComponent,
  ],
  providers: [...READER_FEATURE_PROVIDERS],
  templateUrl: './surah-reader.component.html',
  styleUrl: './surah-reader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.reader--topbar-compact]': 'scroll.topbarCompact() && !scroll.topbarFullRevealed()',
    '[class.reader--topbar-expanded]': 'scroll.topbarFullRevealed() || !scroll.topbarCompact()',
    '[class.reader--tafsir-split]': 'breakpoints.tafsirSplitLayout()',
    '[class.reader--tafsir-panel-open]':
      'breakpoints.tafsirSplitLayout() && tafsir.expandedAyah() !== null',
    '[class.reader--mobile-chrome]': 'breakpoints.mobileChrome()',
    '[class.reader--tafsir-sheet-open]': 'tafsir.mobileSheetOpen()',
  },
})
export class SurahReaderComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);
  private readonly dailyReminder = inject(DailyReminderService);

  protected readonly ui = inject(UiLocaleService);
  protected readonly notifyPrefs = inject(NotificationPreferencesService);
  protected readonly corpus = inject(ReaderCorpusStateService);
  protected readonly viewPrefs = inject(ReaderViewPreferencesService);
  protected readonly routeCoord = inject(ReaderRouteCoordinatorService);
  protected readonly activeAyah = inject(ReaderActiveAyahService);
  protected readonly scroll = inject(ReaderScrollStateService);
  protected readonly search = inject(ReaderSurahSearchService);
  protected readonly surahNav = inject(ReaderSurahNavService);
  protected readonly panels = inject(ReaderPanelCoordinatorService);
  protected readonly bookmarkUi = inject(ReaderBookmarkUiService);
  protected readonly tafsir = inject(ReaderTafsirPanelService);
  protected readonly breakpoints = inject(ReaderLayoutBreakpointsService);
  protected readonly verseActions = inject(ReaderVerseActionsService);
  protected readonly swipe = inject(ReaderSwipeNavigationService);
  protected readonly intro = inject(ReaderIntroContentService);
  protected readonly fragments = inject(ReaderVerseFragmentService);
  private readonly documentTitle = inject(ReaderDocumentTitleService);

  protected notifyPermissionError: 'denied' | 'unsupported' | null = null;

  constructor() {
    this.routeCoord.bind(() => this.syncDocumentTitle());
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.breakpoints.bind();
        const splitMql = this.document.defaultView?.matchMedia('(min-width: 1160px)');
        const mobileMql = this.document.defaultView?.matchMedia('(max-width: 719px)');
        const onLayoutChange = () => this.tafsir.onBreakpointChange();
        splitMql?.addEventListener('change', onLayoutChange);
        mobileMql?.addEventListener('change', onLayoutChange);
        this.destroyRef.onDestroy(() => {
          splitMql?.removeEventListener('change', onLayoutChange);
          mobileMql?.removeEventListener('change', onLayoutChange);
        });
      }, { injector: this.injector });
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.defaultView?.addEventListener('visibilitychange', this.onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      this.document.defaultView?.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.fragments.clearSyncTimer();
      this.activeAyah.clearPendingTimer();
      this.bookmarkUi.dispose();
      this.readingBookmark.flushPending(this.corpus.surahNumber(), this.activeAyah.activeAyah());
      this.bookmarkUi.refreshFromStorage();
    });
    this.syncDocumentTitle();
  }

  protected formatUiNum = (n: number): string => this.intro.formatUiNum(n);
  protected readonly formatUiNumForQuote = this.formatUiNum;

  protected verses(): readonly QuranVerseRow[] {
    return this.corpus.verses();
  }

  protected verseElementId(ayah: number): string {
    return verseElementId(ayah);
  }

  protected isMulk(): boolean {
    return this.corpus.isMulk();
  }

  protected introSummary(): string {
    return this.intro.summary();
  }

  protected introDeepSummary(): string {
    return this.intro.deepSummary();
  }

  protected verseTr(v: QuranVerseRow): { en: string; ur: string } {
    return normalizeVerseTranslations(v);
  }

  protected verseTranslit(v: QuranVerseRow): string {
    return normalizeVerseTransliteration(v);
  }

  protected surahNavTypeLabel(item: SurahNavItem): string {
    return this.ui.translate(item.revelationType === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan');
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.activeAyah.updateFromScroll();
    this.scroll.syncTopbarHeightFromDom();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scroll.onWindowScroll();
    const y = this.document.defaultView?.scrollY ?? 0;
    this.scroll.updateTopbarScrollState(y, this.panelsPinnedOpen());
    this.activeAyah.updateFromScroll(y);
  }

  @HostListener('document:keydown.escape')
  protected onEscapeClosePanels(): void {
    if (this.verseActions.quoteSheetVerse()) {
      this.verseActions.closeQuoteSheet();
      return;
    }
    if (this.tafsir.mobileSheetOpen()) {
      this.tafsir.close();
      return;
    }
    if (this.surahNav.open()) {
      this.surahNav.close();
      return;
    }
    if (this.panels.settingsOpen()) {
      this.panels.closeSettings();
    }
  }

  @HostListener('touchstart', ['$event'])
  protected onTouchStart(event: TouchEvent): void {
    this.swipe.onTouchStart(event, this.isSwipeBlocked());
  }

  @HostListener('touchend', ['$event'])
  protected onTouchEnd(event: TouchEvent): void {
    this.swipe.onTouchEnd(event, this.isSwipeBlocked());
  }

  protected onLocaleModelChange(value: string): void {
    if (value === 'en' || value === 'ar' || value === 'ur') {
      this.ui.setLocale(value as UiLocaleCode);
      this.syncDocumentTitle();
      this.tafsir.onLocaleChange();
      const payload = this.corpus.corpus();
      if (payload) {
        void this.dailyReminder.syncFromCorpus(payload, this.readingBookmark.read());
      }
    }
  }

  protected retryCorpusLoad(): void {
    this.routeCoord.retryCorpusLoad();
  }

  protected toggleSettingsPanel(): void {
    this.panels.toggleSettings();
    if (this.panels.settingsOpen()) {
      this.scroll.topbarFullRevealed.set(true);
    }
    this.scroll.syncTopbarHeightFromDom();
  }

  protected closeSettingsPanel(): void {
    this.panels.closeSettings();
    this.scroll.syncTopbarHeightFromDom();
  }

  protected toggleSurahNav(): void {
    this.panels.toggleSurahNav();
    if (this.surahNav.open()) {
      this.scroll.topbarFullRevealed.set(true);
      this.scroll.syncTopbarHeightFromDom();
      this.focusSurahNavAfterOpen();
    } else {
      this.scroll.syncTopbarHeightFromDom();
    }
  }

  protected openSurahNav(): void {
    this.panels.settingsOpen.set(false);
    this.surahNav.openPanel();
    this.scroll.topbarFullRevealed.set(true);
    this.scroll.syncTopbarHeightFromDom();
    this.focusSurahNavAfterOpen();
  }

  protected closeSurahNav(): void {
    this.surahNav.close();
    this.scroll.syncTopbarHeightFromDom();
  }

  protected onSurahNavQueryChange(value: string): void {
    this.surahNav.setQuery(value);
  }

  protected clearSurahNavQuery(): void {
    this.surahNav.clearQuery();
  }

  protected selectSurahFromNav(n: number): void {
    if (!Number.isFinite(n) || n < 1 || n > 114) {
      return;
    }
    this.closeSurahNav();
    if (n === this.corpus.surahNumber()) {
      return;
    }
    void this.router.navigate(['/', n]);
  }

  protected saveBookmarkAtCurrentLine(): void {
    this.activeAyah.updateFromScroll();
    this.bookmarkUi.saveAtAyah(this.activeAyah.activeAyah());
  }

  protected goToSavedBookmark(): void {
    this.bookmarkUi.refreshFromStorage();
    const b = this.bookmarkUi.savedPlace() ?? this.readingBookmark.read();
    if (!b) {
      return;
    }
    const maxAyah = this.corpus.surah()?.versesCount ?? b.ayah;
    const ayah = Math.min(Math.max(b.ayah, 1), maxAyah);
    if (b.surah !== this.corpus.surahNumber()) {
      this.fragments.navigateWithFragment(b.surah, ayah);
      return;
    }
    this.activeAyah.navigateToAyah(ayah);
  }

  protected onTranslationCheckboxChange(key: 'en' | 'ur', event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.viewPrefs.setTranslation(key, input.checked);
    }
  }

  protected onTransliterationCheckboxChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.viewPrefs.setShowTransliteration(input.checked);
    }
  }

  protected setReadingMode(mode: 'verse-by-verse' | 'reading'): void {
    this.viewPrefs.setReadingMode(mode);
  }

  protected resetReaderViewSettings(): void {
    this.viewPrefs.resetViewSettings();
  }

  protected setFont(f: Parameters<ReaderViewPreferencesService['setFont']>[0]): void {
    this.viewPrefs.setFont(f);
  }

  protected setLine(l: Parameters<ReaderViewPreferencesService['setLine']>[0]): void {
    this.viewPrefs.setLine(l);
  }

  protected setWidth(w: Parameters<ReaderViewPreferencesService['setWidth']>[0]): void {
    this.viewPrefs.setWidth(w);
  }

  protected setColorTheme(t: Parameters<ReaderViewPreferencesService['setColorTheme']>[0]): void {
    this.viewPrefs.setColorTheme(t);
  }

  protected onSurahSearchChange(value: string): void {
    this.search.setQuery(value);
  }

  protected clearSurahSearch(): void {
    this.search.clear();
  }

  protected nextSurahSearchMatch(): void {
    const ayah = this.search.nextMatch();
    if (ayah !== null) {
      this.activeAyah.navigateToAyah(ayah);
    }
  }

  protected prevSurahSearchMatch(): void {
    const ayah = this.search.prevMatch();
    if (ayah !== null) {
      this.activeAyah.navigateToAyah(ayah);
    }
  }

  protected isVerseSurahSearchHit(v: QuranVerseRow): boolean {
    return this.search.isHit(v.ayah);
  }

  protected isVerseSurahSearchActive(v: QuranVerseRow): boolean {
    return this.search.isActive(v.ayah);
  }

  protected jumpToAyah(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const n = Number(select.value || this.activeAyah.jumpModel());
    this.activeAyah.jumpToAyahFromSelect(n);
  }

  protected copyAyah(v: QuranVerseRow): void {
    this.verseActions.copyAyah(v, this.verseActions.presentationContext(this.formatUiNum));
  }

  protected shareAyah(v: QuranVerseRow): void {
    this.verseActions.shareAyah(v, this.verseActions.presentationContext(this.formatUiNum));
  }

  protected openQuoteImage(v: QuranVerseRow): void {
    this.verseActions.openQuoteImage(v);
    this.panels.closeSettings();
    this.surahNav.close();
  }

  protected closeQuoteSheet(): void {
    this.verseActions.closeQuoteSheet();
  }

  protected readerOrigin(): string {
    return this.verseActions.readerOrigin();
  }

  protected toggleTafsir(v: QuranVerseRow): void {
    this.tafsir.toggle(v);
  }

  protected onVerseContentClick(v: QuranVerseRow, event: MouseEvent): void {
    if (!this.breakpoints.tafsirSplitLayout() || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button, a, select, input, textarea, label')) {
      return;
    }
    if (this.tafsir.expandedAyah() === v.ayah) {
      return;
    }
    this.tafsir.open(v.ayah);
  }

  protected onVerseContentKeyActivate(v: QuranVerseRow, event: Event): void {
    if (!this.breakpoints.tafsirSplitLayout() || !(event instanceof KeyboardEvent)) {
      return;
    }
    event.preventDefault();
    if (this.tafsir.expandedAyah() === v.ayah) {
      return;
    }
    this.tafsir.open(v.ayah);
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
    this.notifyPermissionError = null;
    if (input.checked) {
      const result = await this.dailyReminder.enableReminders();
      if (result === 'denied') {
        this.notifyPermissionError = 'denied';
        input.checked = false;
      } else if (result === 'unsupported') {
        this.notifyPermissionError = 'unsupported';
        input.checked = false;
      }
      return;
    }
    this.dailyReminder.disableReminders();
  }

  protected onReminderTimeChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.value) {
      const [hourRaw, minuteRaw] = input.value.split(':');
      void this.dailyReminder.setReminderTime(Number(hourRaw), Number(minuteRaw));
    }
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

  protected scrollToTop(): void {
    this.scroll.scrollToTop();
  }

  protected goToPrevAyah(): void {
    this.activeAyah.goPrev();
  }

  protected goToNextAyah(): void {
    this.activeAyah.goNext();
  }

  protected toggleTafsirForActiveAyah(): void {
    const ayah = this.activeAyah.activeAyah();
    const v = this.corpus.surah()?.verses.find((row) => row.ayah === ayah);
    if (v) {
      this.tafsir.toggle(v);
    }
  }

  protected saveBookmarkForActiveAyah(): void {
    const ayah = this.activeAyah.activeAyah();
    const v = this.corpus.surah()?.verses.find((row) => row.ayah === ayah);
    if (v) {
      this.bookmarkUi.saveForVerse(v);
    }
  }

  protected isActiveAyahBookmarked(): boolean {
    return this.bookmarkUi.isAyahBookmarked(this.activeAyah.activeAyah());
  }

  protected isActiveAyahTafsirOpen(): boolean {
    return this.tafsir.expandedAyah() === this.activeAyah.activeAyah();
  }

  protected closeTafsirPanel(): void {
    this.tafsir.close();
  }

  protected closeTafsirMobileSheet(): void {
    this.tafsir.close();
  }

  protected isTafsirOpen(v: QuranVerseRow): boolean {
    return this.tafsir.isOpen(v);
  }

  protected showTafsirInline(v: QuranVerseRow): boolean {
    return this.tafsir.showInline(v);
  }

  protected useTafsirMobileSheet(): boolean {
    return this.tafsir.useMobileSheet();
  }

  protected isVerseSavedBookmark(v: QuranVerseRow): boolean {
    return this.bookmarkUi.isVerseBookmarked(v);
  }

  protected saveBookmarkForVerse(v: QuranVerseRow): void {
    this.bookmarkUi.saveForVerse(v);
  }

  protected showTranslations(): boolean {
    return this.viewPrefs.showTranslations();
  }

  protected showTransliterationBlock(): boolean {
    return this.viewPrefs.showTransliterationBlock();
  }

  private panelsPinnedOpen(): boolean {
    return (
      this.panels.settingsOpen() ||
      this.surahNav.open() ||
      !!this.verseActions.quoteSheetVerse()
    );
  }

  private isSwipeBlocked(): boolean {
    return (
      this.panels.settingsOpen() ||
      this.surahNav.open() ||
      !!this.verseActions.quoteSheetVerse() ||
      this.tafsir.mobileSheetOpen()
    );
  }

  private syncDocumentTitle(): void {
    this.documentTitle.sync((n) => this.formatUiNum(n));
  }

  private focusSurahNavAfterOpen(): void {
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
          .querySelector('.reader__surah-nav-card--active')
          ?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      },
      { injector: this.injector },
    );
  }

  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState !== 'hidden') {
      return;
    }
    this.bookmarkUi.flushOnHide(this.corpus.surahNumber(), this.activeAyah.activeAyah());
  };
}
