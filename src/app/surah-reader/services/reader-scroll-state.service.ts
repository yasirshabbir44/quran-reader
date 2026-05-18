import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, ElementRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { verseElementId } from '../../core/routing/verse-deep-link.util';
import { ReaderCorpusStateService } from './reader-corpus-state.service';

@Injectable()
export class ReaderScrollStateService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly progress = signal(0);
  readonly topVisible = signal(false);
  readonly topbarCompact = signal(false);
  readonly topbarFullRevealed = signal(true);

  private scrollRaf = 0;
  private lastScrollY = 0;
  private topbarResizeObserver: ResizeObserver | null = null;

  onWindowScroll(): void {
    if (this.scrollRaf) {
      return;
    }
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      const root = this.document.documentElement;
      const y = this.document.defaultView?.scrollY ?? 0;
      const max = root.scrollHeight - root.clientHeight;
      this.progress.set(max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 0);
      this.updateTopbarScrollState(y);
      this.topVisible.set(y > 360);
    });
  }

  scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    this.topbarCompact.set(false);
    this.topbarFullRevealed.set(true);
  }

  resetViewportScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'auto' });
    this.topbarCompact.set(false);
    this.topbarFullRevealed.set(true);
    this.lastScrollY = 0;
  }

  updateTopbarScrollState(y: number, panelsPinnedOpen: boolean): void {
    const compactThreshold = 72;
    if (panelsPinnedOpen) {
      this.topbarCompact.set(y > compactThreshold);
      this.topbarFullRevealed.set(true);
    } else if (y <= compactThreshold) {
      this.topbarCompact.set(false);
      this.topbarFullRevealed.set(true);
    } else {
      this.topbarCompact.set(true);
      const delta = y - this.lastScrollY;
      if (delta < -12) {
        this.topbarFullRevealed.set(true);
      } else if (delta > 12) {
        this.topbarFullRevealed.set(false);
      }
    }
    this.lastScrollY = y;
    this.syncTopbarHeightFromDom();
  }

  bindTopbarHeightSync(): void {
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

  syncTopbarHeightFromDom(): void {
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

  scrollToAyah(ayah: number, smooth = true): void {
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
}
