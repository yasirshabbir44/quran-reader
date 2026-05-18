import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ParamMap, Router } from '@angular/router';
import {
  parseVerseFragment,
  parseVerseFragmentFromHash,
  verseFragment,
} from '../../core/routing/verse-deep-link.util';

@Injectable()
export class ReaderVerseFragmentService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  private fragmentScrollSuppressKey: string | null = null;
  private fragmentSyncTimer: ReturnType<typeof setTimeout> | null = null;
  verseFragmentSyncEnabled = false;

  resolveRouteTargetAyah(fragment: string | null, qm: ParamMap): number | null {
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

  markScrollSuppressed(surah: number, ayah: number): void {
    this.fragmentScrollSuppressKey = `${surah}#${verseFragment(ayah)}`;
  }

  consumeScrollSuppression(surah: number, ayah: number): boolean {
    const key = `${surah}#${verseFragment(ayah)}`;
    if (this.fragmentScrollSuppressKey === key) {
      this.fragmentScrollSuppressKey = null;
      return true;
    }
    return false;
  }

  replaceFragmentInUrl(ayah: number): void {
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

  scheduleFragmentSync(ayah: number): void {
    if (!this.verseFragmentSyncEnabled || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.fragmentSyncTimer !== null) {
      clearTimeout(this.fragmentSyncTimer);
    }
    this.fragmentSyncTimer = setTimeout(() => {
      this.fragmentSyncTimer = null;
      this.replaceFragmentInUrl(ayah);
    }, 400);
  }

  normalizeLegacyVerseUrl(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.markScrollSuppressed(surah, ayah);
    void this.router.navigate(['/', surah], {
      fragment: verseFragment(ayah),
      queryParams: { startingVerse: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  navigateWithFragment(surah: number, ayah: number): void {
    void this.router.navigate(['/', surah], {
      fragment: verseFragment(ayah),
      queryParamsHandling: 'merge',
    });
  }

  clearSyncTimer(): void {
    if (this.fragmentSyncTimer !== null) {
      clearTimeout(this.fragmentSyncTimer);
      this.fragmentSyncTimer = null;
    }
  }
}
