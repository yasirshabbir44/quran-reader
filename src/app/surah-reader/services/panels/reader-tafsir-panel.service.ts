import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  defaultTafsirSlug,
  tafsirEditionsForLocale,
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
} from '../../utils/reader-prefs-storage.util';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';
import { ReaderLayoutBreakpointsService } from '../layout/reader-layout-breakpoints.service';

@Injectable()
export class ReaderTafsirPanelService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiLocaleService);
  private readonly tafsirService = inject(TafsirService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly breakpoints = inject(ReaderLayoutBreakpointsService);

  readonly expandedVerse = signal<VerseRef | null>(null);
  readonly expandedAyah = computed(() => this.expandedVerse()?.ayah ?? null);
  readonly editionSlug = signal('');
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly text = signal('');
  readonly mobileSheetOpen = signal(false);

  readonly blocks = computed(() => formatTafsirBlocks(this.text()));

  readonly verseForPanel = computed(() => {
    const ref = this.expandedVerse();
    if (ref == null) {
      return null;
    }
    return (
      this.corpus.displayVerses().find((v) => v.surah === ref.surah && v.ayah === ref.ayah) ?? null
    );
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
    this.loadGeneration += 1;
  }

  closeOnSurahChange(): void {
    this.close();
  }

  onEditionChange(slug: string, ref: VerseRef): void {
    if (!slug || slug === this.editionSlug()) {
      return;
    }
    this.editionSlug.set(slug);
    persistTafsirEdition(slug, this.browserStorage());
    const open = this.expandedVerse();
    if (open && open.surah === ref.surah && open.ayah === ref.ayah) {
      this.fetch(ref);
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
    const open = this.expandedVerse();
    if (open !== null) {
      this.fetch(open);
    }
  }

  retry(ref: VerseRef): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.tafsirService.invalidateVerse(this.resolveEditionSlug(), ref.surah, ref.ayah);
    this.fetch(ref);
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
    const slug = this.resolveEditionSlug();
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
