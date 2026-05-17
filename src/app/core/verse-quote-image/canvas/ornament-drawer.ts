import { QUOTE_IMAGE_COLORS } from '../theme/quote-image-theme';

export function drawQuoteImageOrnament(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  scale: number,
): void {
  const half = 42 * scale;
  ctx.strokeStyle = QUOTE_IMAGE_COLORS.accent;
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  ctx.beginPath();
  ctx.moveTo(centerX - half, y);
  ctx.lineTo(centerX - 10 * scale, y);
  ctx.moveTo(centerX + 10 * scale, y);
  ctx.lineTo(centerX + half, y);
  ctx.stroke();

  ctx.fillStyle = QUOTE_IMAGE_COLORS.accentBright;
  ctx.beginPath();
  ctx.moveTo(centerX, y - 5 * scale);
  ctx.lineTo(centerX + 5 * scale, y);
  ctx.lineTo(centerX, y + 5 * scale);
  ctx.lineTo(centerX - 5 * scale, y);
  ctx.closePath();
  ctx.fill();
}
