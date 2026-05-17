export interface TextBlock {
  readonly lines: readonly string[];
  readonly fontSize: number;
  readonly lineHeight: number;
}

export function wrapCanvasText(
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

export function fitTextBlock(
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

export function drawTextBlock(
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
