export type QuoteImageFormat = 'instagram' | 'story' | 'twitter';

export interface QuoteImageDimensions {
  readonly width: number;
  readonly height: number;
}

export const QUOTE_IMAGE_FORMATS: readonly QuoteImageFormat[] = [
  'instagram',
  'story',
  'twitter',
] as const;

export const QUOTE_IMAGE_DIMENSIONS: Record<QuoteImageFormat, QuoteImageDimensions> = {
  instagram: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  twitter: { width: 1200, height: 675 },
};

export interface QuoteImageContent {
  readonly arabic: string;
  readonly translationEn: string;
  readonly translationUr: string;
  readonly surahNameAr: string;
  readonly surahNumber: number;
  readonly ayah: number;
  readonly siteLabel: string;
  readonly deepLink: string;
  formatUiNum(n: number): string;
}

export interface QuoteImageOptions {
  readonly format: QuoteImageFormat;
  readonly includeEn: boolean;
  readonly includeUr: boolean;
}
