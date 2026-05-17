import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QuoteImageBlobExport {
  fromCanvas(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
    });
  }
}
