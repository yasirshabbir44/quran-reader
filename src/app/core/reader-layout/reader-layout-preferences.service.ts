import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';

const LS_FONT = 'surah-reader-font';
const LS_LINE = 'surah-reader-line';
const LS_WIDTH = 'surah-reader-width';
const LS_COLOR_THEME = 'surah-reader-color-theme';
const LS_ARABIC_FONT = 'surah-reader-arabic-font';
const LS_ARABIC_ALIGN = 'surah-reader-arabic-align';

export type ReaderFont = 's' | 'm' | 'l' | 'xl';
export type ReaderLine = 'normal' | 'relaxed' | 'loose';
export type ReaderWidth = 'narrow' | 'medium' | 'wide';
export type ReaderColorTheme = 'twilight' | 'night' | 'sepia';
export type ReaderArabicFont = 'madinah' | 'amiri' | 'noto' | 'indopak';
export type ReaderArabicAlign = 'right' | 'center';
type ReaderSetting =
  | ReaderFont
  | ReaderLine
  | ReaderWidth
  | ReaderColorTheme
  | ReaderArabicFont
  | ReaderArabicAlign;

const FONT_OPTIONS: readonly ReaderFont[] = ['s', 'm', 'l', 'xl'];
const LINE_OPTIONS: readonly ReaderLine[] = ['normal', 'relaxed', 'loose'];
const WIDTH_OPTIONS: readonly ReaderWidth[] = ['narrow', 'medium', 'wide'];
const COLOR_THEME_OPTIONS: readonly ReaderColorTheme[] = ['twilight', 'night', 'sepia'];
const ARABIC_FONT_OPTIONS: readonly ReaderArabicFont[] = ['madinah', 'amiri', 'noto', 'indopak'];
const ARABIC_ALIGN_OPTIONS: readonly ReaderArabicAlign[] = ['right', 'center'];

const THEME_COLOR_META: Record<ReaderColorTheme, string> = {
  twilight: '#0c0e12',
  night: '#030304',
  sepia: '#f4ecd8',
};

/**
 * Single Responsibility: typography / measure preferences and localStorage only.
 */
@Injectable({ providedIn: 'root' })
export class ReaderLayoutPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly font = signal<ReaderFont>('m');
  readonly line = signal<ReaderLine>('normal');
  readonly width = signal<ReaderWidth>('medium');
  readonly colorTheme = signal<ReaderColorTheme>('twilight');
  readonly arabicFont = signal<ReaderArabicFont>('madinah');
  readonly arabicAlign = signal<ReaderArabicAlign>('right');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.font.set(this.readSetting(LS_FONT, FONT_OPTIONS, this.font()));
    this.line.set(this.readSetting(LS_LINE, LINE_OPTIONS, this.line()));
    this.width.set(this.readSetting(LS_WIDTH, WIDTH_OPTIONS, this.width()));
    this.colorTheme.set(this.readSetting(LS_COLOR_THEME, COLOR_THEME_OPTIONS, this.colorTheme()));
    this.arabicFont.set(this.readSetting(LS_ARABIC_FONT, ARABIC_FONT_OPTIONS, this.arabicFont()));
    this.arabicAlign.set(this.readSetting(LS_ARABIC_ALIGN, ARABIC_ALIGN_OPTIONS, this.arabicAlign()));

    effect(() => {
      const theme = this.colorTheme();
      const html = this.document.documentElement;
      html.dataset['readerTheme'] = theme;
      const meta = this.document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', THEME_COLOR_META[theme]);
    });

    effect(() => {
      const font = this.arabicFont();
      const html = this.document.documentElement;
      html.dataset['readerArabicFont'] = font;
    });

    effect(() => {
      const align = this.arabicAlign();
      const html = this.document.documentElement;
      html.dataset['readerArabicAlign'] = align;
    });
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

  setColorTheme(value: ReaderColorTheme): void {
    this.colorTheme.set(value);
    this.persist(LS_COLOR_THEME, value);
  }

  setArabicFont(value: ReaderArabicFont): void {
    this.arabicFont.set(value);
    this.persist(LS_ARABIC_FONT, value);
  }

  setArabicAlign(value: ReaderArabicAlign): void {
    this.arabicAlign.set(value);
    this.persist(LS_ARABIC_ALIGN, value);
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
