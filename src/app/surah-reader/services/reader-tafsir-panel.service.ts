import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  defaultTafsirSlug,
  tafsirEditionsForLocale,
} from '../../core/tafsir/tafsir-editions';
import { TafsirService } from '../../core/tafsir/tafsir.service';
import { formatTafsirBlocks } from '../../core/tafsir/tafsir-text';
import { UiLocaleService } from '../../core/ui/ui-locale.service';
import { verseElementId } from '../../core/routing/verse-deep-link.util';
import type { QuranVerseRow } from '../../core/quran/quran-data.service';
import {
  persistTafsirEdition,
  readStoredTafsirEdition,
} from '../utils/reader-prefs-storage.util';
import { ReaderCorpusStateService } from './reader-corpus-state.service';
import { ReaderLayoutBreakpointsService } from './reader-layout-breakpoints.service';

@Injectable()
export class ReaderTafsirPanelService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiLocaleService);
  private readonly tafsirService = inject(TafsirService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly breakpoints = inject(ReaderLayoutBreakpointsService);

  readonly expandedAyah = signal<number | null>(null);
  readonly editionSlug = signal('');
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly text = signal('');
  readonly mobileSheetOpen = signal(false);

  readonly blocks = computed(() => formatTafsirBlocks(this.text()));

  readonly verseForPanel = computed(() => {
    const ayah = this.expandedAyah();
    const s = this.corpus.surah();
    if (ayah == null || !s) {
      return null;
    }
    return s.verses.find((v) => v.ayah === ayah) ?? null;
  });

  readonly editionsForLocale = computed(() => tafsirEditionsForLocale(this.ui.locale()));

  private loadGeneration = 0;

  constructor() {
    const storage = this.browserStorage();
    this.editionSlug.set(
      readStoredTafsirEdition(defaultTafsirSlug(this.ui.locale()), storage),
    );
  }

  useMobileSheet(): boolean {
    return this.breakpoints.mobileChrome() && !this.breakpoints.tafsirSplitLayout();
  }

  isOpen(v: QuranVerseRow): boolean {
    return this.expandedAyah() === v.ayah;
  }

  showInline(v: QuranVerseRow): boolean {
    return this.isOpen(v) && !this.useMobileSheet();
  }

  toggle(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.expandedAyah() === v.ayah) {
      this.close();
      return;
    }
    this.open(v.ayah);
  }

  open(ayah: number): void {
    this.expandedAyah.set(ayah);
    this.fetch(ayah);
    if (this.useMobileSheet()) {
      this.mobileSheetOpen.set(true);
      this.lockBodyScroll();
    } else if (this.breakpoints.tafsirSplitLayout()) {
      this.document.getElementById(verseElementId(ayah))?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }

  close(): void {
    this.expandedAyah.set(null);
    this.mobileSheetOpen.set(false);
    this.unlockBodyScroll();
    this.loading.set(false);
    this.error.set(false);
    this.text.set('');
    this.loadGeneration += 1;
  }

  closeOnSurahChange(): void {
    this.close();
  }

  onEditionChange(slug: string, ayah: number): void {
    if (!slug || slug === this.editionSlug()) {
      return;
    }
    this.editionSlug.set(slug);
    persistTafsirEdition(slug, this.browserStorage());
    if (this.expandedAyah() === ayah) {
      this.fetch(ayah);
    }
  }

  resolveEditionSlug(): string {
    const slug = this.editionSlug();
    const allowed = this.editionsForLocale();
    if (allowed.some((e) => e.slug === slug)) {
      return slug;
    }
    const fallback = defaultTafsirSlug(this.ui.locale());
    this.editionSlug.set(fallback);
    return fallback;
  }

  onLocaleChange(): void {
    const prevSlug = this.editionSlug();
    const nextSlug = this.resolveEditionSlug();
    if (prevSlug !== nextSlug) {
      persistTafsirEdition(nextSlug, this.browserStorage());
    }
    const openAyah = this.expandedAyah();
    if (openAyah !== null) {
      this.fetch(openAyah);
    }
  }

  retry(ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.tafsirService.invalidateVerse(this.resolveEditionSlug(), this.corpus.surahNumber(), ayah);
    this.fetch(ayah);
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

  private fetch(ayah: number): void {
    const slug = this.resolveEditionSlug();
    const gen = ++this.loadGeneration;
    this.loading.set(true);
    this.error.set(false);
    this.text.set('');
    this.tafsirService
      .loadVerse(slug, this.corpus.surahNumber(), ayah)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (gen !== this.loadGeneration || this.expandedAyah() !== ayah) {
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
