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
import { verseElementId as verseElementIdForLocation } from '../core/routing/verse-location.util';
import type { ReaderDisplayVerse } from './models/reader-display-verse.model';
import type { ReaderViewKind } from './models/reader-view-kind.model';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import { KhatamService } from '../core/khatam/khatam.service';
import { DailyReminderService } from '../core/notifications/daily-reminder.service';
import { NotificationPreferencesService } from '../core/notifications/notification-preferences.service';
import type { DailyReminderKind } from '../core/notifications/notification-storage';
import {
  normalizeVerseTranslations,
  normalizeVerseTransliteration,
} from '../core/verse-presentation/verse-presentation.strategy';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
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
  ReaderMushafNavService,
  ReaderSurahSearchService,
  ReaderSwipeNavigationService,
  ReaderTafsirPanelService,
  ReaderWordStudyPanelService,
  ReaderVerseActionsService,
  ReaderVerseFragmentService,
  ReaderViewPreferencesService,
} from './services';
import type { SurahNavItem } from './models/surah-nav-item.model';
import { ReaderTafsirPanelComponent } from './ui/reader-tafsir-panel/reader-tafsir-panel.component';
import { ReaderWordStudyPanelComponent } from './ui/reader-word-study-panel/reader-word-study-panel.component';

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
    ReaderWordStudyPanelComponent,
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
    '[class.reader--focus-mode]': 'viewPrefs.focusMode()',
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
  protected readonly mushafNav = inject(ReaderMushafNavService);
  protected readonly panels = inject(ReaderPanelCoordinatorService);
  protected readonly bookmarkUi = inject(ReaderBookmarkUiService);
  protected readonly khatam = inject(KhatamService);
  protected readonly tafsir = inject(ReaderTafsirPanelService);
  protected readonly wordStudy = inject(ReaderWordStudyPanelService);
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
    if (this.viewPrefs.focusMode()) {
      this.dismissReaderChrome();
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

  protected verses(): readonly ReaderDisplayVerse[] {
    return this.corpus.displayVerses();
  }

  protected viewKind(): ReaderViewKind {
    return this.corpus.viewKind();
  }

  protected verseElementId(v: ReaderDisplayVerse): string {
    return verseElementIdForLocation(
      { surah: v.surah, ayah: v.ayah },
      this.corpus.viewKind(),
    );
  }

  protected isActiveVerse(v: ReaderDisplayVerse): boolean {
    const ref = this.activeAyah.activeVerse();
    return ref.surah === v.surah && ref.ayah === v.ayah;
  }

  protected showSurahHeading(v: ReaderDisplayVerse, index: number): boolean {
    if (this.corpus.viewKind() === 'surah') {
      return false;
    }
    if (index === 0) {
      return true;
    }
    const prev = this.verses()[index - 1];
    return prev ? prev.surah !== v.surah : false;
  }

  protected showBismillah(v: ReaderDisplayVerse, index: number): boolean {
    if (v.surah === 9 || v.ayah !== 1) {
      return false;
    }
    return this.showSurahHeading(v, index);
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

  protected verseTr(v: ReaderDisplayVerse): { en: string; ur: string } {
    return normalizeVerseTranslations(v);
  }

  protected verseTranslit(v: ReaderDisplayVerse): string {
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
    if (this.viewPrefs.focusMode()) {
      this.setFocusMode(false);
      return;
    }
    if (this.verseActions.quoteSheetVerse()) {
      this.verseActions.closeQuoteSheet();
      return;
    }
    if (this.tafsir.mobileSheetOpen()) {
      this.tafsir.close();
      return;
    }
    if (this.wordStudy.expandedVerse()) {
      this.wordStudy.close();
      return;
    }
    if (this.surahNav.open()) {
      this.surahNav.close();
      return;
    }
    if (this.mushafNav.open()) {
      this.mushafNav.close();
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
    if (this.corpus.viewKind() === 'surah' && n === this.corpus.surahNumber()) {
      return;
    }
    void this.router.navigate(['/', n]);
  }

  protected selectPageFromNav(page: number): void {
    if (!Number.isFinite(page) || page < 1 || page > 604) {
      return;
    }
    this.mushafNav.close();
    if (this.corpus.viewKind() === 'page' && page === this.corpus.pageNumber()) {
      return;
    }
    void this.router.navigate(['/page', page]);
  }

  protected selectJuzFromNav(juz: number): void {
    if (!Number.isFinite(juz) || juz < 1 || juz > 30) {
      return;
    }
    this.mushafNav.close();
    if (this.corpus.viewKind() === 'juz' && juz === this.corpus.juzNumber()) {
      return;
    }
    void this.router.navigate(['/juz', juz]);
  }

  protected switchView(kind: ReaderViewKind): void {
    if (kind === this.corpus.viewKind()) {
      return;
    }
    const ref = this.activeAyah.activeVerse();
    if (kind === 'surah') {
      void this.router.navigate(['/', ref.surah], {
        fragment: String(ref.ayah),
        queryParamsHandling: 'merge',
      });
      return;
    }
    if (kind === 'page') {
      const page = this.corpus.mushafIndex()?.versePage[`${ref.surah}:${ref.ayah}`] ?? 1;
      void this.router.navigate(['/page', page], {
        fragment: `${ref.surah}:${ref.ayah}`,
        queryParamsHandling: 'merge',
      });
      return;
    }
    const juz = this.corpus.mushafIndex()?.verseJuz[`${ref.surah}:${ref.ayah}`] ?? 1;
    void this.router.navigate(['/juz', juz], {
      fragment: `${ref.surah}:${ref.ayah}`,
      queryParamsHandling: 'merge',
    });
  }

  protected toggleMushafNav(kind: 'page' | 'juz'): void {
    this.panels.toggleMushafNav(kind);
    if (this.mushafNav.open()) {
      this.scroll.topbarFullRevealed.set(true);
      this.scroll.syncTopbarHeightFromDom();
    }
  }

  protected closeMushafNav(): void {
    this.mushafNav.close();
    this.scroll.syncTopbarHeightFromDom();
  }

  protected saveBookmarkAtCurrentLine(): void {
    this.activeAyah.updateFromScroll();
    const ref = this.activeAyah.activeVerse();
    this.bookmarkUi.saveAtAyah(ref.surah, ref.ayah);
  }

  protected startKhatam(): void {
    this.khatam.startNew();
  }

  protected startNewKhatam(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.khatam.isActive() && !window.confirm(this.ui.translate('khatamNewConfirm'))) {
      return;
    }
    this.khatam.startNew();
  }

  protected goToKhatamPlace(): void {
    const ref = this.khatam.furthest();
    if (this.corpus.viewKind() !== 'surah' || ref.surah !== this.corpus.surahNumber()) {
      this.fragments.navigateWithFragment(ref.surah, ref.ayah);
      return;
    }
    this.activeAyah.navigateToVerse(ref);
  }

  protected goToSavedBookmark(): void {
    this.bookmarkUi.refreshFromStorage();
    const b = this.bookmarkUi.savedPlace() ?? this.readingBookmark.read();
    if (!b) {
      return;
    }
    const maxAyah = this.corpus.surah()?.versesCount ?? b.ayah;
    const ayah = Math.min(Math.max(b.ayah, 1), maxAyah);
    if (this.corpus.viewKind() !== 'surah' || b.surah !== this.corpus.surahNumber()) {
      this.fragments.navigateWithFragment(b.surah, ayah);
      return;
    }
    this.activeAyah.navigateToVerse({ surah: b.surah, ayah });
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

  protected onFocusModeCheckboxChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.setFocusMode(input.checked);
    }
  }

  protected setFocusMode(enabled: boolean): void {
    this.viewPrefs.setFocusMode(enabled);
    if (enabled) {
      this.dismissReaderChrome();
    }
    this.scroll.syncTopbarHeightFromDom();
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
      this.activeAyah.navigateToVerse({ surah: this.corpus.surahNumber(), ayah });
    }
  }

  protected prevSurahSearchMatch(): void {
    const ayah = this.search.prevMatch();
    if (ayah !== null) {
      this.activeAyah.navigateToVerse({ surah: this.corpus.surahNumber(), ayah });
    }
  }

  protected isVerseSurahSearchHit(v: ReaderDisplayVerse): boolean {
    return this.search.isHit(v.ayah);
  }

  protected isVerseSurahSearchActive(v: ReaderDisplayVerse): boolean {
    return this.search.isActive(v.ayah);
  }

  protected jumpToAyah(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value || this.activeAyah.jumpModel();
    this.activeAyah.jumpToAyahFromSelect(value);
  }

  protected copyAyah(v: ReaderDisplayVerse): void {
    this.verseActions.copyAyah(
      v,
      this.verseActions.presentationContext(this.formatUiNum, v),
    );
  }

  protected shareAyah(v: ReaderDisplayVerse): void {
    this.verseActions.shareAyah(
      v,
      this.verseActions.presentationContext(this.formatUiNum, v),
    );
  }

  protected openQuoteImage(v: ReaderDisplayVerse): void {
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

  protected toggleTafsir(v: ReaderDisplayVerse): void {
    if (!this.tafsir.isOpen(v)) {
      this.wordStudy.close();
    }
    this.tafsir.toggle(v);
  }

  protected toggleWordStudy(v: ReaderDisplayVerse): void {
    if (!this.wordStudy.isOpen(v)) {
      this.tafsir.close();
    }
    this.wordStudy.toggle(v);
  }

  protected onVerseContentClick(v: ReaderDisplayVerse, event: MouseEvent): void {
    if (!this.breakpoints.tafsirSplitLayout() || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button, a, select, input, textarea, label')) {
      return;
    }
    if (this.tafsir.isOpen(v)) {
      return;
    }
    this.tafsir.open({ surah: v.surah, ayah: v.ayah });
  }

  protected onVerseContentKeyActivate(v: ReaderDisplayVerse, event: Event): void {
    if (!this.breakpoints.tafsirSplitLayout() || !(event instanceof KeyboardEvent)) {
      return;
    }
    event.preventDefault();
    if (this.tafsir.isOpen(v)) {
      return;
    }
    this.tafsir.open({ surah: v.surah, ayah: v.ayah });
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
    const ref = this.activeAyah.activeVerse();
    const v = this.verses().find((row) => row.surah === ref.surah && row.ayah === ref.ayah);
    if (v) {
      this.tafsir.toggle(v);
    }
  }

  protected saveBookmarkForActiveAyah(): void {
    const ref = this.activeAyah.activeVerse();
    const v = this.verses().find((row) => row.surah === ref.surah && row.ayah === ref.ayah);
    if (v) {
      this.bookmarkUi.saveForVerse(v);
    }
  }

  protected isActiveAyahBookmarked(): boolean {
    const ref = this.activeAyah.activeVerse();
    return this.bookmarkUi.isAyahBookmarked(ref.surah, ref.ayah);
  }

  protected isActiveAyahTafsirOpen(): boolean {
    const ref = this.activeAyah.activeVerse();
    const open = this.tafsir.expandedVerse();
    return open !== null && open.surah === ref.surah && open.ayah === ref.ayah;
  }

  protected closeTafsirPanel(): void {
    this.tafsir.close();
  }

  protected closeTafsirMobileSheet(): void {
    this.tafsir.close();
  }

  protected isTafsirOpen(v: ReaderDisplayVerse): boolean {
    return this.tafsir.isOpen(v);
  }

  protected isWordStudyOpen(v: ReaderDisplayVerse): boolean {
    return this.wordStudy.isOpen(v);
  }

  protected showTafsirInline(v: ReaderDisplayVerse): boolean {
    return !this.viewPrefs.focusMode() && this.tafsir.showInline(v);
  }

  protected showWordStudyInline(v: ReaderDisplayVerse): boolean {
    return !this.viewPrefs.focusMode() && this.wordStudy.isOpen(v);
  }

  protected useTafsirMobileSheet(): boolean {
    return this.tafsir.useMobileSheet();
  }

  protected isVerseSavedBookmark(v: ReaderDisplayVerse): boolean {
    return this.bookmarkUi.isVerseBookmarked(v);
  }

  protected saveBookmarkForVerse(v: ReaderDisplayVerse): void {
    this.bookmarkUi.saveForVerse(v);
  }

  protected verseCopied(v: ReaderDisplayVerse): boolean {
    return this.verseActions.copiedAyah() === `${v.surah}:${v.ayah}`;
  }

  protected showTranslations(): boolean {
    return this.viewPrefs.showTranslations();
  }

  protected showTransliterationBlock(): boolean {
    return this.viewPrefs.showTransliterationBlock();
  }

  private panelsPinnedOpen(): boolean {
    return (
      this.viewPrefs.focusMode() ||
      this.panels.settingsOpen() ||
      this.surahNav.open() ||
      this.mushafNav.open() ||
      !!this.verseActions.quoteSheetVerse()
    );
  }

  private isSwipeBlocked(): boolean {
    return (
      this.viewPrefs.focusMode() ||
      this.panels.settingsOpen() ||
      this.surahNav.open() ||
      this.mushafNav.open() ||
      !!this.verseActions.quoteSheetVerse() ||
      this.tafsir.mobileSheetOpen()
    );
  }

  private dismissReaderChrome(): void {
    this.panels.closeAllOverlays();
    this.tafsir.close();
    this.wordStudy.close();
    this.verseActions.closeQuoteSheet();
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
    const ref = this.activeAyah.activeVerse();
    this.bookmarkUi.flushOnHide(ref.surah, ref.ayah);
  };
}
