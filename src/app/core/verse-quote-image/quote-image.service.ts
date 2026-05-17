import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import {
  quoteImageFilename,
  renderQuoteImageToCanvas,
} from './quote-image-renderer';
import type { QuoteImageContent, QuoteImageFormat, QuoteImageOptions } from './quote-image.types';

@Injectable({ providedIn: 'root' })
export class QuoteImageService {
  private readonly document = inject(DOCUMENT);

  async renderToBlob(
    content: QuoteImageContent,
    options: QuoteImageOptions,
  ): Promise<Blob | null> {
    if (!this.document.defaultView) {
      return null;
    }
    await this.ensureFontsLoaded();
    const canvas = this.document.createElement('canvas');
    renderQuoteImageToCanvas(canvas, content, options);
    return this.canvasToBlob(canvas);
  }

  async renderToObjectUrl(
    content: QuoteImageContent,
    options: QuoteImageOptions,
  ): Promise<string | null> {
    const blob = await this.renderToBlob(content, options);
    if (!blob) {
      return null;
    }
    return URL.createObjectURL(blob);
  }

  async download(
    content: QuoteImageContent,
    options: QuoteImageOptions,
  ): Promise<boolean> {
    const blob = await this.renderToBlob(content, options);
    if (!blob) {
      return false;
    }
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = quoteImageFilename(content.surahNumber, content.ayah, options.format);
    anchor.rel = 'noopener';
    this.document.body?.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  async share(
    content: QuoteImageContent,
    options: QuoteImageOptions,
    title: string,
  ): Promise<'shared' | 'downloaded' | 'failed'> {
    const blob = await this.renderToBlob(content, options);
    if (!blob) {
      return 'failed';
    }
    const file = new File(
      [blob],
      quoteImageFilename(content.surahNumber, content.ayah, options.format),
      { type: 'image/png' },
    );
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title, text: title });
        return 'shared';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return 'failed';
        }
      }
    }
    const downloaded = await this.download(content, options);
    return downloaded ? 'downloaded' : 'failed';
  }

  private async ensureFontsLoaded(): Promise<void> {
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

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
    });
  }
}
