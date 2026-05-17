import { Injectable, inject } from '@angular/core';
import { QuoteImageDownloadService } from './quote-image-download.service';

export type QuoteImageShareResult = 'shared' | 'downloaded' | 'failed';

@Injectable({ providedIn: 'root' })
export class QuoteImageShareService {
  private readonly download = inject(QuoteImageDownloadService);

  async shareFile(
    file: File,
    title: string,
    fallback: () => void,
  ): Promise<QuoteImageShareResult> {
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
    fallback();
    return 'downloaded';
  }

  shareBlob(blob: Blob, filename: string, title: string): Promise<QuoteImageShareResult> {
    const file = new File([blob], filename, { type: 'image/png' });
    return this.shareFile(file, title, () => {
      this.download.trigger(blob, filename);
    });
  }
}
