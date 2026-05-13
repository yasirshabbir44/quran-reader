import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { ReadingBookmark, ReadingBookmarkRepository } from './reading-bookmark.repository';

const LS_KEY = 'surah-reader-bookmark';

export type { ReadingBookmark } from './reading-bookmark.repository';

@Injectable({ providedIn: 'root' })
export class ReadingBookmarkService implements ReadingBookmarkRepository {
  private readonly platformId = inject(PLATFORM_ID);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 450;

  read(): ReadingBookmark | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as { surah?: unknown; ayah?: unknown };
      const surah = Number(parsed.surah);
      const ayah = Number(parsed.ayah);
      if (!Number.isFinite(surah) || !Number.isFinite(ayah)) {
        return null;
      }
      const s = Math.floor(surah);
      const a = Math.floor(ayah);
      if (s < 1 || s > 114 || a < 1) {
        return null;
      }
      return { surah: s, ayah: a };
    } catch {
      return null;
    }
  }

  /** Debounced write; safe to call frequently (e.g. from scroll). */
  scheduleSave(surah: number, ayah: number, onPersisted?: () => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.writeNow(surah, ayah);
      onPersisted?.();
    }, this.debounceMs);
  }

  /** Immediate persist (e.g. before tab background). */
  flushPending(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.writeNow(surah, ayah);
  }

  /** Same as flushPending; use when the user explicitly saves a reading place. */
  saveNow(surah: number, ayah: number): void {
    this.flushPending(surah, ayah);
  }

  private writeNow(surah: number, ayah: number): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ surah, ayah }));
    } catch {
      /* private mode / quota */
    }
  }
}
