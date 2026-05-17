import type { QuoteImageFormat } from '../quote-image.types';

export function quoteImageFilename(
  surahNumber: number,
  ayah: number,
  format: QuoteImageFormat,
): string {
  return `quran-${surahNumber}-${ayah}-${format}.png`;
}
