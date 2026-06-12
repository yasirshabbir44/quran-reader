import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

const GF_BASE = 'https://fonts.googleapis.com/css2';

/**
 * Loads non-critical Google Fonts after first paint so Arabic/Urdu stacks
 * do not block initial render. Critical UI + Quran fonts stay in index.html.
 */
@Injectable({ providedIn: 'root' })
export class WebFontLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly loaded = new Set<string>();

  private injectStylesheet(id: string, href: string): Promise<void> {
    if (this.loaded.has(id)) {
      return Promise.resolve();
    }
    this.loaded.add(id);

    const existing = this.document.getElementById(id);
    if (existing) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const link = this.document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
        resolve();
      };
      link.onerror = () => resolve();
      this.document.head.appendChild(link);
    });
  }

  /** Reading fonts used beyond the critical Amiri Quran subset. */
  loadSecondaryFonts(): Promise<void> {
    const href = `${GF_BASE}?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;600&display=swap`;
    return this.injectStylesheet('gf-secondary', href);
  }

  loadUrduFonts(): Promise<void> {
    const href = `${GF_BASE}?family=Noto+Nastaliq+Urdu:wght@400;600&display=swap`;
    return this.injectStylesheet('gf-urdu', href);
  }

  /** Secondary + Urdu fonts for the Quran reader and quote export. */
  loadReaderFonts(): Promise<void> {
    return Promise.all([this.loadSecondaryFonts(), this.loadUrduFonts()]).then(() => undefined);
  }
}
