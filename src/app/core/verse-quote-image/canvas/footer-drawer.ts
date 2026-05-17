import type { QuoteImageContent, QuoteImageFormat } from '../quote-image.types';
import { QUOTE_IMAGE_COLORS, QUOTE_IMAGE_FONTS } from '../theme/quote-image-theme';

export function drawQuoteImageFooter(
  ctx: CanvasRenderingContext2D,
  content: QuoteImageContent,
  format: QuoteImageFormat,
  width: number,
  height: number,
  padY: number,
): void {
  const ref = `${content.surahNameAr} · ${content.formatUiNum(content.surahNumber)}:${content.formatUiNum(content.ayah)}`;
  const footerY = height - padY - (format === 'twitter' ? 36 : 44);

  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = QUOTE_IMAGE_COLORS.accentBright;
  ctx.font = `${Math.round(width * 0.028)}px ${QUOTE_IMAGE_FONTS.ar}`;
  ctx.fillText(ref, width / 2, footerY);

  ctx.direction = 'ltr';
  ctx.fillStyle = QUOTE_IMAGE_COLORS.inkFaint;
  ctx.font = `500 ${Math.round(width * 0.02)}px ${QUOTE_IMAGE_FONTS.ui}`;
  ctx.fillText(content.siteLabel, width / 2, footerY + Math.round(width * 0.034));

  const linkSize = Math.round(width * 0.016);
  if (linkSize >= 12 && format !== 'story') {
    ctx.font = `400 ${linkSize}px ${QUOTE_IMAGE_FONTS.ui}`;
    const host = content.deepLink.replace(/^https?:\/\//, '');
    ctx.fillText(host, width / 2, footerY + Math.round(width * 0.062));
  }
  ctx.restore();
}
