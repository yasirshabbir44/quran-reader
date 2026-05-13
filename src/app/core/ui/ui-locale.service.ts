import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import ar from '../../i18n/ar.json';
import en from '../../i18n/en.json';
import ur from '../../i18n/ur.json';

const LS_KEY = 'surah-reader-ui-locale';
/** Previous key; still read so existing users keep their language choice. */
const LEGACY_LS_KEY = 'mulk-reader-ui-locale';

export type UiLocaleCode = 'en' | 'ar' | 'ur';

const PACKS: Record<UiLocaleCode, Record<string, string>> = {
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
  ur: ur as Record<string, string>,
};

@Injectable({ providedIn: 'root' })
export class UiLocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly locale = signal<UiLocaleCode>('en');
  readonly messages = signal<Record<string, string>>(PACKS.en);

  readonly availableLocales: readonly { code: UiLocaleCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'ur', label: 'اردو' },
  ] as const;

  constructor() {
    let initial: UiLocaleCode = 'en';
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved =
          (localStorage.getItem(LS_KEY) as UiLocaleCode | null) ??
          (localStorage.getItem(LEGACY_LS_KEY) as UiLocaleCode | null);
        if (saved && saved in PACKS) {
          initial = saved;
        }
      } catch {
        /* ignore */
      }
    }
    this.applyLocale(initial, false);
  }

  setLocale(code: UiLocaleCode): void {
    this.applyLocale(code, true);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    let s = this.messages()[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.split(`{{${k}}}`).join(String(v));
      }
    }
    return s;
  }

  numberLocaleTag(): string {
    switch (this.locale()) {
      case 'ar':
        return 'ar-u-nu-arab';
      case 'ur':
        return 'ur-PK-u-nu-latn';
      default:
        return 'en-u-nu-latn';
    }
  }

  private applyLocale(code: UiLocaleCode, persist: boolean): void {
    this.messages.set(PACKS[code]);
    this.locale.set(code);
    this.syncDocumentRoot(code);
    if (persist && isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(LS_KEY, code);
        try {
          localStorage.removeItem(LEGACY_LS_KEY);
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    }
  }

  private syncDocumentRoot(code: UiLocaleCode): void {
    const root = this.document.documentElement;
    if (code === 'en') {
      root.lang = 'en';
      root.dir = 'ltr';
    } else {
      root.lang = code;
      root.dir = 'rtl';
    }
  }
}
