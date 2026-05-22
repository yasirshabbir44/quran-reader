import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import type { ReadingBookmark } from '../../../core/bookmark/reading-bookmark.repository';
import { READING_BOOKMARK_REPOSITORY } from '../../../core/bookmark/reading-bookmark.repository';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import { DailyReminderService } from '../../../core/notifications/daily-reminder.service';
import { KhatamService } from '../../../core/khatam/khatam.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

@Injectable()
export class ReaderBookmarkUiService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);
  private readonly dailyReminder = inject(DailyReminderService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly khatam = inject(KhatamService);

  readonly savedPlace = signal<ReadingBookmark | null>(null);
  readonly showSavedToast = signal(false);
  readonly pulseAyah = signal<number | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private pulseRaf = 0;

  refreshFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.savedPlace.set(this.readingBookmark.read());
  }

  saveAtAyah(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.readingBookmark.saveNow(surah, ayah);
    this.khatam.recordProgress(surah, ayah);
    this.savedPlace.set({ surah, ayah });
    this.flashSaved(ayah);
    void this.dailyReminder.onBookmarkChanged();
  }

  saveForVerse(v: ReaderDisplayVerse): void {
    this.saveAtAyah(v.surah, v.ayah);
  }

  isVerseBookmarked(v: ReaderDisplayVerse): boolean {
    const b = this.savedPlace();
    return b !== null && b.surah === v.surah && b.ayah === v.ayah;
  }

  isAyahBookmarked(surah: number, ayah: number): boolean {
    const b = this.savedPlace();
    return b !== null && b.surah === surah && b.ayah === ayah;
  }

  flushOnHide(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.readingBookmark.flushPending(surah, ayah);
    this.savedPlace.set(this.readingBookmark.read());
  }

  scheduleScrollSave(surah: number, ayah: number): void {
    this.readingBookmark.scheduleSave(surah, ayah, () => {
      this.savedPlace.set(this.readingBookmark.read());
    });
  }

  private flashSaved(pulseAyah: number): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
    this.armPulse(pulseAyah);
    this.showSavedToast.set(true);
    this.toastTimer = setTimeout(() => {
      this.showSavedToast.set(false);
      this.toastTimer = null;
    }, 2200);
  }

  private armPulse(ayah: number): void {
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    if (this.pulseRaf !== 0) {
      win.cancelAnimationFrame(this.pulseRaf);
      this.pulseRaf = 0;
    }
    this.pulseAyah.set(null);
    this.pulseRaf = win.requestAnimationFrame(() => {
      this.pulseRaf = 0;
      this.pulseAyah.set(ayah);
    });
  }

  dispose(): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    const win = this.document.defaultView;
    if (win && this.pulseRaf !== 0) {
      win.cancelAnimationFrame(this.pulseRaf);
      this.pulseRaf = 0;
    }
  }
}
