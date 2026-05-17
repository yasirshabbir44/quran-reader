import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { renderQuoteImageToCanvas } from './canvas/quote-image-canvas.renderer';
import { QuoteImageBlobExport } from './export/quote-image-blob.export';
import { QuoteImageDownloadService } from './export/quote-image-download.service';
import { quoteImageFilename } from './export/quote-image-filename.util';
import { QuoteImageFontLoader } from './export/quote-image-font.loader';
import {
  QuoteImageShareService,
  type QuoteImageShareResult,
} from './export/quote-image-share.service';
import type { QuoteImageContent, QuoteImageOptions } from './quote-image.types';

@Injectable({ providedIn: 'root' })
export class QuoteImageService {
  private readonly document = inject(DOCUMENT);
  private readonly fonts = inject(QuoteImageFontLoader);
  private readonly blobExport = inject(QuoteImageBlobExport);
  private readonly downloadService = inject(QuoteImageDownloadService);
  private readonly shareService = inject(QuoteImageShareService);

  async renderToBlob(
    content: QuoteImageContent,
    options: QuoteImageOptions,
  ): Promise<Blob | null> {
    const canvas = await this.renderToCanvas(content, options);
    if (!canvas) {
      return null;
    }
    return this.blobExport.fromCanvas(canvas);
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

  async download(content: QuoteImageContent, options: QuoteImageOptions): Promise<boolean> {
    const blob = await this.renderToBlob(content, options);
    if (!blob) {
      return false;
    }
    const filename = quoteImageFilename(content.surahNumber, content.ayah, options.format);
    return this.downloadService.trigger(blob, filename);
  }

  async share(
    content: QuoteImageContent,
    options: QuoteImageOptions,
    title: string,
  ): Promise<QuoteImageShareResult> {
    const blob = await this.renderToBlob(content, options);
    if (!blob) {
      return 'failed';
    }
    const filename = quoteImageFilename(content.surahNumber, content.ayah, options.format);
    return this.shareService.shareBlob(blob, filename, title);
  }

  private async renderToCanvas(
    content: QuoteImageContent,
    options: QuoteImageOptions,
  ): Promise<HTMLCanvasElement | null> {
    if (!this.document.defaultView) {
      return null;
    }
    await this.fonts.ensureLoaded();
    const canvas = this.document.createElement('canvas');
    renderQuoteImageToCanvas(canvas, content, options);
    return canvas;
  }
}
