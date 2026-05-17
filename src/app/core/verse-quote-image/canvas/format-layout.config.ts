import type { QuoteImageFormat } from '../quote-image.types';

export interface QuoteFormatLayout {
  readonly arStart: number;
  readonly arMin: number;
  readonly trStart: number;
  readonly trMin: number;
  readonly padX: number;
  readonly padY: number;
}

const LAYOUT_BY_FORMAT: Record<QuoteImageFormat, QuoteFormatLayout> = {
  story: { arStart: 72, arMin: 40, trStart: 34, trMin: 22, padX: 88, padY: 140 },
  twitter: { arStart: 52, arMin: 30, trStart: 24, trMin: 16, padX: 72, padY: 56 },
  instagram: { arStart: 64, arMin: 36, trStart: 30, trMin: 18, padX: 80, padY: 96 },
};

export function quoteFormatLayout(format: QuoteImageFormat): QuoteFormatLayout {
  return LAYOUT_BY_FORMAT[format];
}
