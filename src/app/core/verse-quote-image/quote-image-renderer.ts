import {
  QUOTE_IMAGE_DIMENSIONS,
  type QuoteImageContent,
  type QuoteImageFormat,
  type QuoteImageOptions,
} from './quote-image.types';

const FONT_AR = '"Amiri Quran", "Amiri", "Noto Naskh Arabic", serif';
const FONT_EN = 'Georgia, "Times New Roman", serif';
const FONT_UR = '"Noto Naskh Arabic", "Amiri", serif';
const FONT_UI = 'system-ui, -apple-system, "Segoe UI", sans-serif';

const COLORS = {
  bgTop: '#0c0e12',
  bgMid: '#141820',
  bgEnd: '#1a2230',
  glow: 'rgba(201, 162, 39, 0.14)',
  ink: '#f4f1ea',
  inkMuted: '#c4bfb4',
  inkFaint: '#9d988c',
  accent: '#c9a227',
  accentBright: '#e4c45c',
  frame: 'rgba(201, 162, 39, 0.35)',
  frameSoft: 'rgba(201, 162, 39, 0.12)',
} as const;

interface TextBlock {
  readonly lines: readonly string[];
  readonly fontSize: number;
  readonly lineHeight: number;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }
  const lines: string[] = [];
  let line = words[0]!;
  for (let i = 1; i < words.length; i += 1) {
    const word = words[i]!;
    const test = `${line} ${word}`;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  return lines;
}

function fitTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontFamily: string,
  startSize: number,
  minSize: number,
  lineHeightRatio: number,
): TextBlock {
  const trimmed = text.trim();
  if (!trimmed) {
    return { lines: [], fontSize: startSize, lineHeight: lineHeightRatio };
  }
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `${size}px ${fontFamily}`;
    const lines = wrapCanvasText(ctx, trimmed, maxWidth);
    const blockHeight = lines.length * size * lineHeightRatio;
    if (blockHeight <= maxHeight || size === minSize) {
      return { lines, fontSize: size, lineHeight: lineHeightRatio };
    }
  }
  ctx.font = `${minSize}px ${fontFamily}`;
  return {
    lines: wrapCanvasText(ctx, trimmed, maxWidth),
    fontSize: minSize,
    lineHeight: lineHeightRatio,
  };
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  block: TextBlock,
  x: number,
  y: number,
  maxWidth: number,
  fontFamily: string,
  color: string,
  align: CanvasTextAlign,
  direction: CanvasDirection,
): number {
  if (block.lines.length === 0) {
    return y;
  }
  ctx.save();
  ctx.direction = direction;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.font = `${block.fontSize}px ${fontFamily}`;
  const step = block.fontSize * block.lineHeight;
  let cursorY = y + block.fontSize;
  for (const line of block.lines) {
    const drawX = align === 'center' ? x + maxWidth / 2 : x;
    ctx.fillText(line, drawX, cursorY);
    cursorY += step;
  }
  ctx.restore();
  return cursorY;
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(0.45, COLORS.bgMid);
  grad.addColorStop(1, COLORS.bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.08, 0, w * 0.5, h * 0.2, w * 0.65);
  glow.addColorStop(0, COLORS.glow);
  glow.addColorStop(1, 'rgba(201, 162, 39, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const inset = Math.round(Math.min(w, h) * 0.04);
  ctx.strokeStyle = COLORS.frameSoft;
  ctx.lineWidth = Math.max(2, Math.round(w * 0.0025));
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  ctx.strokeStyle = COLORS.frame;
  ctx.lineWidth = Math.max(1, Math.round(w * 0.0015));
  const inner = inset + Math.round(w * 0.012);
  ctx.strokeRect(inner, inner, w - inner * 2, h - inner * 2);
}

function drawOrnament(ctx: CanvasRenderingContext2D, cx: number, y: number, scale: number): void {
  const half = 42 * scale;
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 10 * scale, y);
  ctx.moveTo(cx + 10 * scale, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();

  ctx.fillStyle = COLORS.accentBright;
  ctx.beginPath();
  ctx.moveTo(cx, y - 5 * scale);
  ctx.lineTo(cx + 5 * scale, y);
  ctx.lineTo(cx, y + 5 * scale);
  ctx.lineTo(cx - 5 * scale, y);
  ctx.closePath();
  ctx.fill();
}

function formatSizes(format: QuoteImageFormat): {
  arStart: number;
  arMin: number;
  trStart: number;
  trMin: number;
  padX: number;
  padY: number;
} {
  switch (format) {
    case 'story':
      return { arStart: 72, arMin: 40, trStart: 34, trMin: 22, padX: 88, padY: 140 };
    case 'twitter':
      return { arStart: 52, arMin: 30, trStart: 24, trMin: 16, padX: 72, padY: 56 };
    default:
      return { arStart: 64, arMin: 36, trStart: 30, trMin: 18, padX: 80, padY: 96 };
  }
}

/**
 * Renders a shareable verse card to a canvas element.
 */
export function renderQuoteImageToCanvas(
  canvas: HTMLCanvasElement,
  content: QuoteImageContent,
  options: QuoteImageOptions,
): void {
  const { width: w, height: h } = QUOTE_IMAGE_DIMENSIONS[options.format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  drawBackground(ctx, w, h);

  const sizes = formatSizes(options.format);
  const padX = sizes.padX;
  const padY = sizes.padY;
  const contentWidth = w - padX * 2;
  const footerReserve = options.format === 'twitter' ? 88 : 112;
  const headerReserve = options.format === 'twitter' ? 56 : 72;
  let contentTop = padY + headerReserve;
  const contentBottom = h - padY - footerReserve;
  let available = contentBottom - contentTop;

  const translationBlocks: { text: string; font: string; direction: CanvasDirection }[] = [];
  if (options.includeEn && content.translationEn.trim()) {
    translationBlocks.push({
      text: content.translationEn.trim(),
      font: FONT_EN,
      direction: 'ltr',
    });
  }
  if (options.includeUr && content.translationUr.trim()) {
    translationBlocks.push({
      text: content.translationUr.trim(),
      font: FONT_UR,
      direction: 'rtl',
    });
  }
  const trShare = translationBlocks.length > 0 ? Math.min(0.42, 0.2 * translationBlocks.length) : 0;
  const arMaxHeight = available * (translationBlocks.length > 0 ? 1 - trShare : 1);

  const arBlock = fitTextBlock(
    ctx,
    content.arabic,
    contentWidth,
    arMaxHeight,
    FONT_AR,
    sizes.arStart,
    sizes.arMin,
    1.55,
  );
  const arEnd = drawTextBlock(
    ctx,
    arBlock,
    padX,
    contentTop,
    contentWidth,
    FONT_AR,
    COLORS.ink,
    'center',
    'rtl',
  );
  contentTop = arEnd + (translationBlocks.length > 0 ? 24 : 36);
  available = contentBottom - contentTop;

  if (translationBlocks.length > 0) {
    const perBlockHeight = available / translationBlocks.length;
    for (const block of translationBlocks) {
      const trBlock = fitTextBlock(
        ctx,
        block.text,
        contentWidth,
        perBlockHeight - 8,
        block.font,
        sizes.trStart,
        sizes.trMin,
        1.45,
      );
      contentTop = drawTextBlock(
        ctx,
        trBlock,
        padX,
        contentTop,
        contentWidth,
        block.font,
        COLORS.inkMuted,
        'center',
        block.direction,
      );
      contentTop += 12;
    }
  }

  const ref = `${content.surahNameAr} · ${content.formatUiNum(content.surahNumber)}:${content.formatUiNum(content.ayah)}`;
  const ornamentY = padY + (options.format === 'twitter' ? 28 : 36);
  drawOrnament(ctx, w / 2, ornamentY, w / 1080);

  const footerY = h - padY - (options.format === 'twitter' ? 36 : 44);
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.accentBright;
  ctx.font = `${Math.round(w * 0.028)}px ${FONT_AR}`;
  ctx.fillText(ref, w / 2, footerY);

  ctx.direction = 'ltr';
  ctx.fillStyle = COLORS.inkFaint;
  ctx.font = `500 ${Math.round(w * 0.02)}px ${FONT_UI}`;
  ctx.fillText(content.siteLabel, w / 2, footerY + Math.round(w * 0.034));

  const linkSize = Math.round(w * 0.016);
  if (linkSize >= 12 && options.format !== 'story') {
    ctx.font = `400 ${linkSize}px ${FONT_UI}`;
    const host = content.deepLink.replace(/^https?:\/\//, '');
    ctx.fillText(host, w / 2, footerY + Math.round(w * 0.062));
  }
  ctx.restore();
}

export function quoteImageFilename(
  surahNumber: number,
  ayah: number,
  format: QuoteImageFormat,
): string {
  return `quran-${surahNumber}-${ayah}-${format}.png`;
}
