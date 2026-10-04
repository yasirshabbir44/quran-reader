import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DEFAULT_TAFSIR_SLUG,
  DEFAULT_TAFSIR_LANGUAGE,
  TAFSIR_EDITIONS,
  defaultTafsirSlug,
  defaultTafsirSlugForLanguage,
  tafsirEditionBySlug,
  tafsirEditionsByLanguage,
  tafsirEditionsForLocale,
  type TafsirEdition,
  type TafsirLanguageCode,
} from '../../../core/tafsir/tafsir-editions';
import { TafsirService } from '../../../core/tafsir/tafsir.service';
import { formatTafsirBlocks } from '../../../core/tafsir/tafsir-text';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import { verseElementId } from '../../../core/routing/verse-location.util';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import {
  persistTafsirEdition,
  readStoredTafsirEdition,
  persistTafsirLanguage,
  readStoredTafsirLanguage,
  persistTafsirFontSize,
  readStoredTafsirFontSize,
} from '../../utils/reader-prefs-storage.util';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';
import { ReaderLayoutBreakpointsService } from '../layout/reader-layout-breakpoints.service';
import { HadithService } from '../../../core/hadith/hadith.service';

export type TafsirPanelTab = 'tafsir' | 'hadith' | 'asbab';

@Injectable()
export class ReaderTafsirPanelService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiLocaleService);
  private readonly tafsirService = inject(TafsirService);
  private readonly hadithService = inject(HadithService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly breakpoints = inject(ReaderLayoutBreakpointsService);

  readonly expandedVerse = signal<VerseRef | null>(null);
  readonly expandedAyah = computed(() => this.expandedVerse()?.ayah ?? null);

  /** Active Tafsir language (Urdu is default). */
  readonly selectedLanguage = signal<TafsirLanguageCode>(DEFAULT_TAFSIR_LANGUAGE);
  readonly editionSlug = signal<string>(DEFAULT_TAFSIR_SLUG);

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly text = signal('');
  readonly mobileSheetOpen = signal(false);

  /** Active sub-tab inside panel: 'tafsir' | 'hadith' | 'asbab'. */
  readonly activeTab = signal<TafsirPanelTab>('tafsir');

  /** Font size scale (e.g. 1.05 for comfortable Nastaliq). */
  readonly fontSizeScale = signal<number>(1.05);

  /** Filter by specific block type ('all' or specific block type). */
  readonly selectedBlockFilter = signal<string>('all');

  /** Temporary toast indicator when text is copied. */
  readonly copied = signal<boolean>(false);

  /** Asbab al-Nuzul on-demand loading. */
  readonly asbabAlNuzulText = signal<string>('');
  readonly asbabLoading = signal<boolean>(false);
  readonly asbabError = signal<boolean>(false);

  readonly blocks = computed(() => formatTafsirBlocks(this.text()));

  readonly filteredBlocks = computed(() => {
    const list = this.blocks();
    const filter = this.selectedBlockFilter();
    if (filter === 'all') {
      return list;
    }
    return list.filter((b) => b.type === filter);
  });

  readonly activeEdition = computed<TafsirEdition>(() => {
    return tafsirEditionBySlug(this.editionSlug()) ?? TAFSIR_EDITIONS[0];
  });

  readonly currentDirection = computed<'rtl' | 'ltr'>(() => this.activeEdition().direction);
  readonly currentLanguage = computed<TafsirLanguageCode>(() => this.activeEdition().language);

  readonly editionsForSelectedLanguage = computed(() =>
    tafsirEditionsByLanguage(this.selectedLanguage()),
  );

  readonly editionsForLocale = computed(() => tafsirEditionsForLocale(this.ui.locale()));

  readonly verseForPanel = computed(() => {
    const ref = this.expandedVerse();
    if (ref == null) {
      return null;
    }
    return (
      this.corpus.displayVerses().find((v) => v.surah === ref.surah && v.ayah === ref.ayah) ?? null
    );
  });

  /** Authentic related hadiths for currently active verse. */
  readonly relatedHadiths = computed(() => {
    const ref = this.expandedVerse();
    if (!ref) {
      return [];
    }
    return this.hadithService.getHadithsForVerse(ref.surah, ref.ayah);
  });

  private loadGeneration = 0;
  private asbabLoadGeneration = 0;
  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const storage = this.browserStorage();
    const storedSlug = readStoredTafsirEdition(DEFAULT_TAFSIR_SLUG, storage);
    const existing = tafsirEditionBySlug(storedSlug);

    if (existing) {
      this.editionSlug.set(storedSlug);
      this.selectedLanguage.set(existing.language);
    } else {
      const storedLang = readStoredTafsirLanguage(DEFAULT_TAFSIR_LANGUAGE, storage);
      this.selectedLanguage.set(storedLang);
      this.editionSlug.set(defaultTafsirSlugForLanguage(storedLang));
    }

    this.fontSizeScale.set(readStoredTafsirFontSize(1.05, storage));
  }

  useMobileSheet(): boolean {
    return this.breakpoints.mobileChrome() && !this.breakpoints.tafsirSplitLayout();
  }

  isOpen(v: ReaderDisplayVerse): boolean {
    const ref = this.expandedVerse();
    return ref !== null && ref.surah === v.surah && ref.ayah === v.ayah;
  }

  showInline(v: ReaderDisplayVerse): boolean {
    return (
      this.isOpen(v) &&
      !this.useMobileSheet() &&
      !this.breakpoints.tafsirSplitLayout()
    );
  }

  toggle(v: ReaderDisplayVerse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const ref = { surah: v.surah, ayah: v.ayah };
    if (this.isOpen(v)) {
      this.close();
      return;
    }
    this.open(ref);
  }

  open(ref: VerseRef): void {
    this.expandedVerse.set(ref);
    this.fetch(ref);
    if (this.activeTab() === 'asbab') {
      this.fetchAsbab(ref);
    }
    if (this.useMobileSheet()) {
      this.mobileSheetOpen.set(true);
      this.lockBodyScroll();
    } else if (this.breakpoints.tafsirSplitLayout()) {
      this.document
        .getElementById(verseElementId(ref, this.corpus.viewKind()))
        ?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
    }
  }

  close(): void {
    this.expandedVerse.set(null);
    this.mobileSheetOpen.set(false);
    this.unlockBodyScroll();
    this.loading.set(false);
    this.error.set(false);
    this.text.set('');
    this.asbabAlNuzulText.set('');
    this.loadGeneration += 1;
    this.asbabLoadGeneration += 1;
  }

  closeOnSurahChange(): void {
    this.close();
  }

  setLanguage(lang: TafsirLanguageCode): void {
    if (lang === this.selectedLanguage()) {
      return;
    }
    this.selectedLanguage.set(lang);
    persistTafsirLanguage(lang, this.browserStorage());

    const nextSlug = defaultTafsirSlugForLanguage(lang);
    this.editionSlug.set(nextSlug);
    persistTafsirEdition(nextSlug, this.browserStorage());

    const open = this.expandedVerse();
    if (open) {
      this.fetch(open);
    }
  }

  onEditionChange(slug: string, ref?: VerseRef): void {
    if (!slug || slug === this.editionSlug()) {
      return;
    }
    this.editionSlug.set(slug);
    persistTafsirEdition(slug, this.browserStorage());

    const ed = tafsirEditionBySlug(slug);
    if (ed && ed.language !== this.selectedLanguage()) {
      this.selectedLanguage.set(ed.language);
      persistTafsirLanguage(ed.language, this.browserStorage());
    }

    const open = ref ?? this.expandedVerse();
    if (open) {
      this.fetch(open);
    }
  }

  setTab(tab: TafsirPanelTab): void {
    this.activeTab.set(tab);
    if (tab === 'asbab' && !this.asbabAlNuzulText()) {
      const open = this.expandedVerse();
      if (open) {
        this.fetchAsbab(open);
      }
    }
  }

  increaseFontSize(): void {
    const next = Math.min(1.45, Math.round((this.fontSizeScale() + 0.1) * 100) / 100);
    this.fontSizeScale.set(next);
    persistTafsirFontSize(next, this.browserStorage());
  }

  decreaseFontSize(): void {
    const next = Math.max(0.85, Math.round((this.fontSizeScale() - 0.1) * 100) / 100);
    this.fontSizeScale.set(next);
    persistTafsirFontSize(next, this.browserStorage());
  }

  resetFontSize(): void {
    this.fontSizeScale.set(1.05);
    persistTafsirFontSize(1.05, this.browserStorage());
  }

  setBlockFilter(filter: string): void {
    this.selectedBlockFilter.set(filter);
  }

  onLocaleChange(): void {
    // Retain user's selected tafsir language (defaults to Urdu), refetch if needed
    const open = this.expandedVerse();
    if (open) {
      this.fetch(open);
    }
  }

  copyTafsirText(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const verse = this.verseForPanel();
    const ed = this.activeEdition();
    const txt = this.text();

    if (!verse || !txt) {
      return;
    }

    const header = `[Surah ${verse.surah}:${verse.ayah}]\n` +
      `Tafsir: ${ed.titleNative} (${ed.author})\n\n`;
    const full = `${header}${txt}\n\nVia QuranDaily (https://qurandaily.live)`;

    try {
      navigator.clipboard.writeText(full).then(() => {
        this.copied.set(true);
        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }
        this.copyTimeout = setTimeout(() => this.copied.set(false), 2400);
      });
    } catch {
      /* ignore */
    }
  }

  retry(ref: VerseRef): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.tafsirService.invalidateVerse(this.editionSlug(), ref.surah, ref.ayah);
    this.fetch(ref);
    if (this.activeTab() === 'asbab') {
      this.fetchAsbab(ref);
    }
  }

  onBreakpointChange(): void {
    if (this.breakpoints.tafsirSplitLayout() && this.mobileSheetOpen()) {
      this.mobileSheetOpen.set(false);
      this.unlockBodyScroll();
    }
    if (!this.breakpoints.mobileChrome() && this.mobileSheetOpen()) {
      this.mobileSheetOpen.set(false);
      this.unlockBodyScroll();
    }
  }

  private fetch(ref: VerseRef): void {
    const slug = this.editionSlug();
    const gen = ++this.loadGeneration;
    this.loading.set(true);
    this.error.set(false);
    this.text.set('');
    this.tafsirService
      .loadVerse(slug, ref.surah, ref.ayah)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        const open = this.expandedVerse();
        if (
          gen !== this.loadGeneration ||
          open === null ||
          open.surah !== ref.surah ||
          open.ayah !== ref.ayah
        ) {
          return;
        }
        this.loading.set(false);
        if (!payload?.text?.trim()) {
          this.error.set(true);
          return;
        }
        this.text.set(payload.text.trim());
      });
  }

  private fetchAsbab(ref: VerseRef): void {
    const gen = ++this.asbabLoadGeneration;
    this.asbabLoading.set(true);
    this.asbabError.set(false);
    this.tafsirService
      .loadVerse('en-asbab-al-nuzul-by-al-wahidi', ref.surah, ref.ayah)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        const open = this.expandedVerse();
        if (
          gen !== this.asbabLoadGeneration ||
          open === null ||
          open.surah !== ref.surah ||
          open.ayah !== ref.ayah
        ) {
          return;
        }
        this.asbabLoading.set(false);
        if (payload?.text?.trim()) {
          this.asbabAlNuzulText.set(payload.text.trim());
        } else {
          this.asbabError.set(true);
        }
      });
  }

  private lockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = 'hidden';
    }
  }

  private unlockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = '';
    }
  }

  private browserStorage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return localStorage;
    } catch {
      return null;
    }
  }
}
