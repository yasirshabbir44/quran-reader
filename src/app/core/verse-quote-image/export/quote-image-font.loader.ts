import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QuoteImageFontLoader {
  private readonly document = inject(DOCUMENT);

  async ensureLoaded(): Promise<void> {
    const fonts = this.document.fonts;
    if (!fonts?.load) {
      return;
    }
    await Promise.all([
      fonts.load('48px "Amiri Quran"'),
      fonts.load('48px "Amiri"'),
      fonts.load('32px "Noto Naskh Arabic"'),
      fonts.load('24px Georgia'),
    ]);
    await fonts.ready;
  }
}
