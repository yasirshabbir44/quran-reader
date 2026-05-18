import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { ReaderActiveAyahService } from './reader-active-ayah.service';
import { ReaderLayoutBreakpointsService } from '../layout/reader-layout-breakpoints.service';

@Injectable()
export class ReaderSwipeNavigationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ui = inject(UiLocaleService);
  private readonly breakpoints = inject(ReaderLayoutBreakpointsService);
  private readonly activeAyah = inject(ReaderActiveAyahService);

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent, blocked: boolean): void {
    if (!this.breakpoints.mobileChrome() || !isPlatformBrowser(this.platformId) || blocked) {
      return;
    }
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'button, a, select, input, textarea, label, .reader__mobile-bar, .reader__tafsir-sheet',
      )
    ) {
      return;
    }
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchEnd(event: TouchEvent, blocked: boolean): void {
    if (!this.breakpoints.mobileChrome() || !isPlatformBrowser(this.platformId) || blocked) {
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.35) {
      return;
    }
    const rtl = this.ui.locale() !== 'en';
    const swipeTowardNext = rtl ? dx > 0 : dx < 0;
    if (swipeTowardNext) {
      this.activeAyah.goNext();
    } else {
      this.activeAyah.goPrev();
    }
  }
}
