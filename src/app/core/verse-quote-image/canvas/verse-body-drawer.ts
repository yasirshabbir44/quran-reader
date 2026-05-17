import type { QuoteImageContent, QuoteImageOptions } from '../quote-image.types';
import { QUOTE_IMAGE_COLORS, QUOTE_IMAGE_FONTS } from '../theme/quote-image-theme';
import type { QuoteFormatLayout } from './format-layout.config';
import { drawTextBlock, fitTextBlock } from './text-layout.util';

interface TranslationSlice {
  readonly text: string;
  readonly font: string;
  readonly direction: CanvasDirection;
}

function translationSlices(
  content: QuoteImageContent,
  options: QuoteImageOptions,
): TranslationSlice[] {
  const slices: TranslationSlice[] = [];
  if (options.includeEn && content.translationEn.trim()) {
    slices.push({
      text: content.translationEn.trim(),
      font: QUOTE_IMAGE_FONTS.en,
      direction: 'ltr',
    });
  }
  if (options.includeUr && content.translationUr.trim()) {
    slices.push({
      text: content.translationUr.trim(),
      font: QUOTE_IMAGE_FONTS.ur,
      direction: 'rtl',
    });
  }
  return slices;
}

export function drawQuoteImageVerseBody(
  ctx: CanvasRenderingContext2D,
  content: QuoteImageContent,
  options: QuoteImageOptions,
  layout: QuoteFormatLayout,
  contentWidth: number,
  contentTop: number,
  contentBottom: number,
): void {
  const translations = translationSlices(content, options);
  let top = contentTop;
  let available = contentBottom - top;

  const trShare =
    translations.length > 0 ? Math.min(0.42, 0.2 * translations.length) : 0;
  const arMaxHeight = available * (translations.length > 0 ? 1 - trShare : 1);

  const arBlock = fitTextBlock(
    ctx,
    content.arabic,
    contentWidth,
    arMaxHeight,
    QUOTE_IMAGE_FONTS.ar,
    layout.arStart,
    layout.arMin,
    1.55,
  );
  const arEnd = drawTextBlock(
    ctx,
    arBlock,
    layout.padX,
    top,
    contentWidth,
    QUOTE_IMAGE_FONTS.ar,
    QUOTE_IMAGE_COLORS.ink,
    'center',
    'rtl',
  );
  top = arEnd + (translations.length > 0 ? 24 : 36);
  available = contentBottom - top;

  if (translations.length === 0) {
    return;
  }

  const perBlockHeight = available / translations.length;
  for (const slice of translations) {
    const trBlock = fitTextBlock(
      ctx,
      slice.text,
      contentWidth,
      perBlockHeight - 8,
      slice.font,
      layout.trStart,
      layout.trMin,
      1.45,
    );
    top = drawTextBlock(
      ctx,
      trBlock,
      layout.padX,
      top,
      contentWidth,
      slice.font,
      QUOTE_IMAGE_COLORS.inkMuted,
      'center',
      slice.direction,
    );
    top += 12;
  }
}

export function quoteImageContentBounds(
  format: QuoteImageOptions['format'],
  padY: number,
  height: number,
): { contentTop: number; contentBottom: number } {
  const footerReserve = format === 'twitter' ? 88 : 112;
  const headerReserve = format === 'twitter' ? 56 : 72;
  return {
    contentTop: padY + headerReserve,
    contentBottom: height - padY - footerReserve,
  };
}
