import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { verseElementId } from '../../core/routing/verse-deep-link.util';
import { ReaderBookmarkUiService } from './reader-bookmark-ui.service';
import { ReaderCorpusStateService } from './reader-corpus-state.service';
import { ReaderScrollStateService } from './reader-scroll-state.service';
import { ReaderVerseFragmentService } from './reader-verse-fragment.service';

@Injectable()
export class ReaderActiveAyahService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly scroll = inject(ReaderScrollStateService);
  private readonly fragments = inject(ReaderVerseFragmentService);
  private readonly bookmarkUi = inject(ReaderBookmarkUiService);

  readonly activeAyah = signal(1);
  readonly jumpModel = signal('');

  readonly surahProgress = computed(() => {
    const total = this.corpus.surah()?.versesCount ?? 0;
    if (total <= 0) {
      return { current: 0, total: 0, percent: 0 };
    }
    const current = this.activeAyah();
    return {
      current,
      total,
      percent: Math.min(100, Math.round((current / total) * 100)),
    };
  });

  readonly canGoPrev = computed(() => this.activeAyah() > 1);
  readonly canGoNext = computed(() => {
    const total = this.corpus.surah()?.versesCount ?? 0;
    return total > 0 && this.activeAyah() < total;
  });

  private ayahElements: Array<HTMLElement | null> | null = null;
  pendingStartAyah: number | null = null;
  private pendingScrollTimer: ReturnType<typeof setTimeout> | null = null;

  resetOnSurahChange(): void {
    this.activeAyah.set(1);
    this.jumpModel.set('');
    this.fragments.verseFragmentSyncEnabled = false;
  }

  setActiveAyah(ayah: number, syncFragment = true): void {
    this.activeAyah.set(ayah);
    if (syncFragment) {
      this.fragments.scheduleFragmentSync(ayah);
    }
    this.bookmarkUi.scheduleScrollSave(this.corpus.surahNumber(), ayah);
  }

  navigateToAyah(ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.scroll.scrollToAyah(ayah, true);
    this.jumpModel.set(String(ayah));
    this.setActiveAyah(ayah, true);
    this.fragments.replaceFragmentInUrl(ayah);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateFromScroll());
    });
  }

  goPrev(): void {
    if (this.canGoPrev()) {
      this.navigateToAyah(this.activeAyah() - 1);
    }
  }

  goNext(): void {
    if (this.canGoNext()) {
      this.navigateToAyah(this.activeAyah() + 1);
    }
  }

  jumpToAyahFromSelect(ayah: number): void {
    if (!isPlatformBrowser(this.platformId) || !ayah) {
      return;
    }
    this.scroll.scrollToAyah(ayah);
    this.jumpModel.set(String(ayah));
    this.setActiveAyah(ayah, true);
    this.fragments.replaceFragmentInUrl(ayah);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateFromScroll());
    });
  }

  bindAyahElements(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.scroll.bindTopbarHeightSync();
    const list = this.corpus.verses();
    this.ayahElements = list.map((v) => this.document.getElementById(verseElementId(v.ayah)));
    if (this.pendingStartAyah !== null) {
      this.fulfillPendingStart();
      return;
    }
    this.finishBinding();
  }

  fulfillPendingStart(attempt = 0): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const pending = this.pendingStartAyah;
    if (pending === null) {
      this.finishBinding();
      return;
    }
    const list = this.corpus.verses();
    if (list.length === 0 || this.corpus.surah() === null) {
      if (attempt < 24) {
        this.pendingScrollTimer = setTimeout(() => this.fulfillPendingStart(attempt + 1), 50);
      }
      return;
    }
    const lastAyah = list[list.length - 1]!.ayah;
    const safeAyah = Math.min(Math.max(pending, 1), lastAyah);
    const el = this.document.getElementById(verseElementId(safeAyah));
    if (!el) {
      if (attempt < 24) {
        this.pendingScrollTimer = setTimeout(() => this.fulfillPendingStart(attempt + 1), 50);
      }
      return;
    }
    this.scroll.scrollToAyah(safeAyah, false);
    this.activeAyah.set(safeAyah);
    this.jumpModel.set(String(safeAyah));
    this.pendingStartAyah = null;
    this.fragments.markScrollSuppressed(this.corpus.surahNumber(), safeAyah);
    this.fragments.replaceFragmentInUrl(safeAyah);
    this.ayahElements = list.map((v) => this.document.getElementById(verseElementId(v.ayah)));
    this.finishBinding();
  }

  private finishBinding(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.fragments.verseFragmentSyncEnabled = true;
    const y = this.document.defaultView?.scrollY ?? 0;
    this.updateFromScroll(y);
  }

  updateFromScroll(scrollY?: number): void {
    const centerY = (this.document.defaultView?.innerHeight ?? 800) / 2;
    let next = 1;
    let bestDistance = Infinity;
    const list = this.corpus.verses();
    const els = this.ayahElements;
    const useCachedRefs =
      !!els && els.length === list.length && els.some((el) => el !== null);
    if (useCachedRefs) {
      for (let i = 0; i < els!.length; i++) {
        const el = els![i];
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
      this.setActiveAyah(next, true);
    }
    if (scrollY !== undefined) {
      /* caller may update topbar separately */
    }
  }

  clearPendingTimer(): void {
    if (this.pendingScrollTimer !== null) {
      clearTimeout(this.pendingScrollTimer);
      this.pendingScrollTimer = null;
    }
  }
}
