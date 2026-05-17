import { Injectable, inject, signal } from '@angular/core';
import { QuoteImageService } from '../core/verse-quote-image/quote-image.service';
import type { QuoteImageContent, QuoteImageOptions } from '../core/verse-quote-image/quote-image.types';

@Injectable()
export class QuotePreviewService {
  private readonly quoteImages = inject(QuoteImageService);

  readonly previewUrl = signal<string | null>(null);
  readonly generating = signal(false);

  private renderGeneration = 0;
  private lastObjectUrl: string | null = null;

  async refresh(content: QuoteImageContent, options: QuoteImageOptions): Promise<void> {
    const generation = ++this.renderGeneration;
    this.generating.set(true);
    const url = await this.quoteImages.renderToObjectUrl(content, options);
    if (generation !== this.renderGeneration) {
      if (url) {
        URL.revokeObjectURL(url);
      }
      return;
    }
    this.revoke();
    this.lastObjectUrl = url;
    this.previewUrl.set(url);
    this.generating.set(false);
  }

  revoke(): void {
    if (this.lastObjectUrl) {
      URL.revokeObjectURL(this.lastObjectUrl);
      this.lastObjectUrl = null;
    }
    this.previewUrl.set(null);
  }
}
