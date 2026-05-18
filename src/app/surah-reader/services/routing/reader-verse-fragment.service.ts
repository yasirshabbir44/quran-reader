import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ParamMap, Router } from '@angular/router';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import {
  parseVerseLocationFragment,
  parseVerseLocationFromHash,
  verseLocationFragment,
} from '../../../core/routing/verse-location.util';
import { parseVerseFragment } from '../../../core/routing/verse-deep-link.util';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

type ResolvedRoute =
  | { readonly kind: 'surah'; readonly n: number }
  | { readonly kind: 'page'; readonly p: number }
  | { readonly kind: 'juz'; readonly j: number };

@Injectable()
export class ReaderVerseFragmentService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly corpus = inject(ReaderCorpusStateService);

  private fragmentScrollSuppressKey: string | null = null;
  private fragmentSyncTimer: ReturnType<typeof setTimeout> | null = null;
  verseFragmentSyncEnabled = false;

  resolveRouteTarget(fragment: string | null, qm: ParamMap): VerseRef | null {
    const kind = this.corpus.viewKind();
    const surahContext = kind === 'surah' ? this.corpus.surahNumber() : null;
    const hashAyah = isPlatformBrowser(this.platformId)
      ? parseVerseLocationFromHash(this.document.defaultView?.location.hash ?? '', surahContext, kind)
      : null;
    const fromFragment = parseVerseLocationFragment(fragment, surahContext, kind) ?? hashAyah;
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
    if (kind === 'surah') {
      return { surah: this.corpus.surahNumber(), ayah: Math.floor(parsed) };
    }
    return null;
  }

  markScrollSuppressed(resolved: ResolvedRoute, ref: VerseRef): void {
    this.fragmentScrollSuppressKey = `${resolved.kind}#${verseLocationFragment(ref, this.corpus.viewKind())}`;
  }

  consumeScrollSuppression(resolved: ResolvedRoute, ref: VerseRef): boolean {
    const key = `${resolved.kind}#${verseLocationFragment(ref, this.corpus.viewKind())}`;
    if (this.fragmentScrollSuppressKey === key) {
      this.fragmentScrollSuppressKey = null;
      return true;
    }
    return false;
  }

  replaceFragmentInUrl(ref: VerseRef): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    const fragment = verseLocationFragment(ref, this.corpus.viewKind());
    if (win.location.hash === `#${fragment}`) {
      return;
    }
    const path = `${win.location.pathname}${win.location.search}`;
    win.history.replaceState(win.history.state, '', `${path}#${fragment}`);
  }

  scheduleFragmentSync(ref: VerseRef): void {
    if (!this.verseFragmentSyncEnabled || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.fragmentSyncTimer !== null) {
      clearTimeout(this.fragmentSyncTimer);
    }
    this.fragmentSyncTimer = setTimeout(() => {
      this.fragmentSyncTimer = null;
      this.replaceFragmentInUrl(ref);
    }, 400);
  }

  normalizeLegacyVerseUrl(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.markScrollSuppressed({ kind: 'surah', n: surah }, { surah, ayah });
    void this.router.navigate(['/', surah], {
      fragment: verseLocationFragment({ surah, ayah }, 'surah'),
      queryParams: { startingVerse: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  navigateWithFragment(surah: number, ayah: number): void {
    void this.router.navigate(['/', surah], {
      fragment: verseLocationFragment({ surah, ayah }, 'surah'),
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

/** Legacy ayah-only parse for home/themes links. */
export function parseLegacyAyahFragment(fragment: string | null | undefined): number | null {
  return parseVerseFragment(fragment);
}
