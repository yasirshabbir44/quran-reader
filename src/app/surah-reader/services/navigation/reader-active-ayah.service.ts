import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import { verseElementId } from '../../../core/routing/verse-location.util';
import { ReaderBookmarkUiService } from '../bookmark/reader-bookmark-ui.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';
import { ReaderScrollStateService } from './reader-scroll-state.service';
import { ReaderVerseFragmentService } from '../routing/reader-verse-fragment.service';

@Injectable()
export class ReaderActiveAyahService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly scroll = inject(ReaderScrollStateService);
  private readonly fragments = inject(ReaderVerseFragmentService);
  private readonly bookmarkUi = inject(ReaderBookmarkUiService);

  readonly activeVerse = signal<VerseRef>({ surah: 67, ayah: 1 });
  readonly jumpModel = signal('');

  /** Ayah number within the active surah context (bookmark compat). */
  readonly activeAyah = computed(() => this.activeVerse().ayah);

  readonly surahProgress = computed(() => {
    const list = this.corpus.displayVerses();
    if (list.length <= 0) {
      return { current: 0, total: 0, percent: 0 };
    }
    const ref = this.activeVerse();
    const idx = list.findIndex((v) => v.surah === ref.surah && v.ayah === ref.ayah);
    const current = idx >= 0 ? idx + 1 : 1;
    return {
      current,
      total: list.length,
      percent: Math.min(100, Math.round((current / list.length) * 100)),
    };
  });

  readonly canGoPrev = computed(() => {
    const list = this.corpus.displayVerses();
    const ref = this.activeVerse();
    const idx = list.findIndex((v) => v.surah === ref.surah && v.ayah === ref.ayah);
    return idx > 0;
  });

  readonly canGoNext = computed(() => {
    const list = this.corpus.displayVerses();
    const ref = this.activeVerse();
    const idx = list.findIndex((v) => v.surah === ref.surah && v.ayah === ref.ayah);
    return idx >= 0 && idx < list.length - 1;
  });

  private ayahElements: Array<HTMLElement | null> | null = null;
  pendingStartVerse: VerseRef | null = null;
  private pendingScrollTimer: ReturnType<typeof setTimeout> | null = null;

  resetOnViewChange(): void {
    const first = this.corpus.displayVerses()[0];
    this.activeVerse.set(first ? { surah: first.surah, ayah: first.ayah } : { surah: 67, ayah: 1 });
    this.jumpModel.set('');
    this.fragments.verseFragmentSyncEnabled = false;
  }

  setActiveVerse(ref: VerseRef, syncFragment = true): void {
    this.activeVerse.set(ref);
    if (syncFragment) {
      this.fragments.scheduleFragmentSync(ref);
    }
    this.bookmarkUi.scheduleScrollSave(ref.surah, ref.ayah);
  }

  navigateToVerse(ref: VerseRef): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.scroll.scrollToVerse(ref);
    this.jumpModel.set(this.jumpValueFor(ref));
    this.setActiveVerse(ref, true);
    this.fragments.replaceFragmentInUrl(ref);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateFromScroll());
    });
  }

  goPrev(): void {
    const list = this.corpus.displayVerses();
    const ref = this.activeVerse();
    const idx = list.findIndex((v) => v.surah === ref.surah && v.ayah === ref.ayah);
    if (idx > 0) {
      const prev = list[idx - 1]!;
      this.navigateToVerse({ surah: prev.surah, ayah: prev.ayah });
    }
  }

  goNext(): void {
    const list = this.corpus.displayVerses();
    const ref = this.activeVerse();
    const idx = list.findIndex((v) => v.surah === ref.surah && v.ayah === ref.ayah);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1]!;
      this.navigateToVerse({ surah: next.surah, ayah: next.ayah });
    }
  }

  jumpToAyahFromSelect(value: string): void {
    if (!isPlatformBrowser(this.platformId) || !value) {
      return;
    }
    const list = this.corpus.displayVerses();
    const ref = this.parseJumpValue(value, list);
    if (!ref) {
      return;
    }
    this.scroll.scrollToVerse(ref);
    this.jumpModel.set(value);
    this.setActiveVerse(ref, true);
    this.fragments.replaceFragmentInUrl(ref);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateFromScroll());
    });
  }

  bindAyahElements(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.scroll.bindTopbarHeightSync();
    const list = this.corpus.displayVerses();
    const kind = this.corpus.viewKind();
    this.ayahElements = list.map((v) =>
      this.document.getElementById(verseElementId({ surah: v.surah, ayah: v.ayah }, kind)),
    );
    if (this.pendingStartVerse !== null) {
      this.fulfillPendingStart();
      return;
    }
    this.finishBinding();
  }

  fulfillPendingStart(attempt = 0): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const pending = this.pendingStartVerse;
    if (pending === null) {
      this.finishBinding();
      return;
    }
    const list = this.corpus.displayVerses();
    if (list.length === 0) {
      if (attempt < 24) {
        this.pendingScrollTimer = setTimeout(() => this.fulfillPendingStart(attempt + 1), 50);
      }
      return;
    }
    const target =
      list.find((v) => v.surah === pending.surah && v.ayah === pending.ayah) ?? list[0]!;
    const ref = { surah: target.surah, ayah: target.ayah };
    const el = this.document.getElementById(
      verseElementId(ref, this.corpus.viewKind()),
    );
    if (!el) {
      if (attempt < 24) {
        this.pendingScrollTimer = setTimeout(() => this.fulfillPendingStart(attempt + 1), 50);
      }
      return;
    }
    this.scroll.scrollToVerse(ref, false);
    this.activeVerse.set(ref);
    this.jumpModel.set(this.jumpValueFor(ref));
    this.pendingStartVerse = null;
    this.fragments.replaceFragmentInUrl(ref);
    const kind = this.corpus.viewKind();
    this.ayahElements = list.map((v) =>
      this.document.getElementById(verseElementId({ surah: v.surah, ayah: v.ayah }, kind)),
    );
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
    let next: VerseRef = this.corpus.displayVerses()[0]
      ? { surah: this.corpus.displayVerses()[0]!.surah, ayah: this.corpus.displayVerses()[0]!.ayah }
      : { surah: 67, ayah: 1 };
    let bestDistance = Infinity;
    const list = this.corpus.displayVerses();
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
          next = { surah: verse.surah, ayah: verse.ayah };
        }
      }
    } else {
      const kind = this.corpus.viewKind();
      for (const v of list) {
        const el = this.document.getElementById(
          verseElementId({ surah: v.surah, ayah: v.ayah }, kind),
        );
        if (!el) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        const verseCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(verseCenterY - centerY);
        if (distance < bestDistance) {
          bestDistance = distance;
          next = { surah: v.surah, ayah: v.ayah };
        }
      }
    }
    const current = this.activeVerse();
    if (next.surah !== current.surah || next.ayah !== current.ayah) {
      this.setActiveVerse(next, true);
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

  private jumpValueFor(ref: VerseRef): string {
    if (this.corpus.viewKind() === 'surah') {
      return String(ref.ayah);
    }
    return `${ref.surah}:${ref.ayah}`;
  }

  private parseJumpValue(
    value: string,
    list: readonly { readonly surah: number; readonly ayah: number }[],
  ): VerseRef | null {
    if (this.corpus.viewKind() === 'surah') {
      const ayah = Number(value);
      if (!Number.isFinite(ayah)) {
        return null;
      }
      const hit = list.find((v) => v.ayah === ayah);
      return hit ? { surah: hit.surah, ayah: hit.ayah } : null;
    }
    const colon = value.indexOf(':');
    if (colon < 0) {
      return null;
    }
    const surah = Number(value.slice(0, colon));
    const ayah = Number(value.slice(colon + 1));
    const hit = list.find((v) => v.surah === surah && v.ayah === ayah);
    return hit ? { surah, ayah } : null;
  }
}
