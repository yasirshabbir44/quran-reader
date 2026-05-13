import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const LS_FONT = 'surah-reader-font';
const LS_LINE = 'surah-reader-line';
const LS_WIDTH = 'surah-reader-width';

export type ReaderFont = 's' | 'm' | 'l' | 'xl';
export type ReaderLine = 'normal' | 'relaxed' | 'loose';
export type ReaderWidth = 'narrow' | 'medium' | 'wide';
type ReaderSetting = ReaderFont | ReaderLine | ReaderWidth;

const FONT_OPTIONS: readonly ReaderFont[] = ['s', 'm', 'l', 'xl'];
const LINE_OPTIONS: readonly ReaderLine[] = ['normal', 'relaxed', 'loose'];
const WIDTH_OPTIONS: readonly ReaderWidth[] = ['narrow', 'medium', 'wide'];

/**
 * Single Responsibility: typography / measure preferences and localStorage only.
 */
@Injectable({ providedIn: 'root' })
export class ReaderLayoutPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly font = signal<ReaderFont>('m');
  readonly line = signal<ReaderLine>('normal');
  readonly width = signal<ReaderWidth>('medium');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.font.set(this.readSetting(LS_FONT, FONT_OPTIONS, this.font()));
    this.line.set(this.readSetting(LS_LINE, LINE_OPTIONS, this.line()));
    this.width.set(this.readSetting(LS_WIDTH, WIDTH_OPTIONS, this.width()));
  }

  setFont(value: ReaderFont): void {
    this.font.set(value);
    this.persist(LS_FONT, value);
  }

  setLine(value: ReaderLine): void {
    this.line.set(value);
    this.persist(LS_LINE, value);
  }

  setWidth(value: ReaderWidth): void {
    this.width.set(value);
    this.persist(LS_WIDTH, value);
  }

  private persist(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode / quota */
    }
  }

  private readSetting<T extends ReaderSetting>(key: string, allowed: readonly T[], fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value && this.isAllowedOption(value, allowed)) {
        return value;
      }
    } catch {
      /* ignore localStorage access errors */
    }
    return fallback;
  }

  private isAllowedOption<T extends string>(value: string, allowed: readonly T[]): value is T {
    return allowed.includes(value as T);
  }
}
