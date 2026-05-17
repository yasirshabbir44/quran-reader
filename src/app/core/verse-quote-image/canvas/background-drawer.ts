import { QUOTE_IMAGE_COLORS } from '../theme/quote-image-theme';

export function drawQuoteImageBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, QUOTE_IMAGE_COLORS.bgTop);
  grad.addColorStop(0.45, QUOTE_IMAGE_COLORS.bgMid);
  grad.addColorStop(1, QUOTE_IMAGE_COLORS.bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.08,
    0,
    width * 0.5,
    height * 0.2,
    width * 0.65,
  );
  glow.addColorStop(0, QUOTE_IMAGE_COLORS.glow);
  glow.addColorStop(1, 'rgba(201, 162, 39, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const inset = Math.round(Math.min(width, height) * 0.04);
  ctx.strokeStyle = QUOTE_IMAGE_COLORS.frameSoft;
  ctx.lineWidth = Math.max(2, Math.round(width * 0.0025));
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  ctx.strokeStyle = QUOTE_IMAGE_COLORS.frame;
  ctx.lineWidth = Math.max(1, Math.round(width * 0.0015));
  const inner = inset + Math.round(width * 0.012);
  ctx.strokeRect(inner, inner, width - inner * 2, height - inner * 2);
}
