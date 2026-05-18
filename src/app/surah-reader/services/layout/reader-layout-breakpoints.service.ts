import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/** Desktop/tablet: Quran left, tafsir in a dedicated right column (≥1160px). */
const TAFSIR_SPLIT_MQ = '(min-width: 1160px)';
/** Phone layout: bottom controls, tafsir sheet, swipe navigation (≤719px). */
const MOBILE_CHROME_MQ = '(max-width: 719px)';

@Injectable()
export class ReaderLayoutBreakpointsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly tafsirSplitLayout = signal(false);
  readonly mobileChrome = signal(false);

  bind(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.bindMediaQuery(TAFSIR_SPLIT_MQ, this.tafsirSplitLayout);
    this.bindMediaQuery(MOBILE_CHROME_MQ, this.mobileChrome);
  }

  private bindMediaQuery(query: string, target: ReturnType<typeof signal<boolean>>): void {
    const mql = this.document.defaultView?.matchMedia(query);
    if (!mql) {
      return;
    }
    target.set(mql.matches);
    const onChange = (e: MediaQueryListEvent) => target.set(e.matches);
    mql.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
  }
}
