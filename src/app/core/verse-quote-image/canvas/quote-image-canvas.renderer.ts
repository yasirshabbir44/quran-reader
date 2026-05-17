import {
  QUOTE_IMAGE_DIMENSIONS,
  type QuoteImageContent,
  type QuoteImageOptions,
} from '../quote-image.types';
import { drawQuoteImageBackground } from './background-drawer';
import { drawQuoteImageFooter } from './footer-drawer';
import { quoteFormatLayout } from './format-layout.config';
import { drawQuoteImageOrnament } from './ornament-drawer';
import { drawQuoteImageVerseBody, quoteImageContentBounds } from './verse-body-drawer';

/**
 * Renders a shareable verse card to a canvas element.
 */
export function renderQuoteImageToCanvas(
  canvas: HTMLCanvasElement,
  content: QuoteImageContent,
  options: QuoteImageOptions,
): void {
  const { width, height } = QUOTE_IMAGE_DIMENSIONS[options.format];
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const layout = quoteFormatLayout(options.format);
  const contentWidth = width - layout.padX * 2;
  const { contentTop, contentBottom } = quoteImageContentBounds(
    options.format,
    layout.padY,
    height,
  );

  drawQuoteImageBackground(ctx, width, height);

  drawQuoteImageVerseBody(
    ctx,
    content,
    options,
    layout,
    contentWidth,
    contentTop,
    contentBottom,
  );

  const ornamentY = layout.padY + (options.format === 'twitter' ? 28 : 36);
  drawQuoteImageOrnament(ctx, width / 2, ornamentY, width / 1080);

  drawQuoteImageFooter(ctx, content, options.format, width, height, layout.padY);
}
