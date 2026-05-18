import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReaderLayoutPreferencesService,
  type ReaderColorTheme,
  type ReaderFont,
  type ReaderLine,
  type ReaderWidth,
} from '../../../core/reader-layout/reader-layout-preferences.service';
import type { ReaderMode } from '../../models/reader-mode.model';
import {
  buildTranslationsQueryParam,
  parseTranslationSelection,
} from '../../utils/translation-query.util';
import {
  persistTransliterationPref,
  readStoredTransliterationPref,
} from '../../utils/reader-prefs-storage.util';

@Injectable()
export class ReaderViewPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly readerLayout = inject(ReaderLayoutPreferencesService);

  readonly font = this.readerLayout.font;
  readonly line = this.readerLayout.line;
  readonly width = this.readerLayout.width;
  readonly colorTheme = this.readerLayout.colorTheme;

  readonly readingMode = signal<ReaderMode>('verse-by-verse');
  readonly showTranslationEn = signal(true);
  readonly showTranslationUr = signal(true);
  readonly showTransliteration = signal(
    readStoredTransliterationPref(this.browserStorage()),
  );

  readonly showTranslations = computed(
    () =>
      this.readingMode() === 'verse-by-verse' &&
      (this.showTranslationEn() || this.showTranslationUr()),
  );

  readonly showTransliterationBlock = computed(
    () => this.readingMode() === 'verse-by-verse' && this.showTransliteration(),
  );

  applyFromQueryParams(qm: { get: (name: string) => string | null }): void {
    this.readingMode.set(qm.get('readingMode') === 'reading' ? 'reading' : 'verse-by-verse');
    const translationState = parseTranslationSelection(qm.get('translations'));
    this.showTranslationEn.set(translationState.en);
    this.showTranslationUr.set(translationState.ur);
  }

  setReadingMode(mode: ReaderMode): void {
    this.readingMode.set(mode);
    this.syncQueryParams();
  }

  setTranslation(key: 'en' | 'ur', checked: boolean): void {
    if (key === 'en') {
      this.showTranslationEn.set(checked);
    } else {
      this.showTranslationUr.set(checked);
    }
    if (!this.showTranslationEn() && !this.showTranslationUr()) {
      if (key === 'en') {
        this.showTranslationUr.set(true);
      } else {
        this.showTranslationEn.set(true);
      }
    }
    this.syncQueryParams();
  }

  setShowTransliteration(checked: boolean): void {
    this.showTransliteration.set(checked);
    persistTransliterationPref(checked, this.browserStorage());
  }

  resetViewSettings(): void {
    this.readingMode.set('verse-by-verse');
    this.showTranslationEn.set(true);
    this.showTranslationUr.set(true);
    this.setShowTransliteration(true);
    this.syncQueryParams();
  }

  setFont(f: ReaderFont): void {
    this.readerLayout.setFont(f);
  }

  setLine(l: ReaderLine): void {
    this.readerLayout.setLine(l);
  }

  setWidth(w: ReaderWidth): void {
    this.readerLayout.setWidth(w);
  }

  setColorTheme(theme: ReaderColorTheme): void {
    this.readerLayout.setColorTheme(theme);
  }

  syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        readingMode: this.readingMode(),
        translations: buildTranslationsQueryParam(
          this.showTranslationEn(),
          this.showTranslationUr(),
        ),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private browserStorage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return localStorage;
    } catch {
      return null;
    }
  }
}
