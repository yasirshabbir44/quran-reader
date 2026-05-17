/** Target length for a single commentary paragraph (characters). */
const MAX_PARAGRAPH_CHARS = 520;
/** Minimum size before forcing a split on sentence boundaries. */
const MIN_SPLIT_CHARS = 300;

const SENTENCE_END = /(?<=[.!?…؟۔])\s+/u;

/**
 * Splits raw tafsir API text into shorter paragraphs for comfortable reading.
 */
export function formatTafsirParagraphs(text: string): readonly string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const paragraphs: string[] = [];
  for (const block of blocks) {
    if (block.includes('\n')) {
      for (const line of block.split('\n').map((l) => l.trim()).filter(Boolean)) {
        paragraphs.push(...splitLongParagraph(line));
      }
    } else {
      paragraphs.push(...splitLongParagraph(block));
    }
  }

  return paragraphs;
}

function splitLongParagraph(text: string): string[] {
  if (text.length <= MAX_PARAGRAPH_CHARS) {
    return [text];
  }

  const parts = text.split(SENTENCE_END).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return [text];
  }

  const result: string[] = [];
  let current = '';

  for (const part of parts) {
    if (!current) {
      current = part;
      continue;
    }
    const combined = `${current} ${part}`;
    if (combined.length <= MAX_PARAGRAPH_CHARS) {
      current = combined;
    } else {
      result.push(current);
      current = part;
    }
  }

  if (current) {
    if (current.length > MAX_PARAGRAPH_CHARS && result.length > 0 && result.at(-1)!.length < MIN_SPLIT_CHARS) {
      result[result.length - 1] = `${result.at(-1)} ${current}`;
    } else {
      result.push(current);
    }
  }

  return result.length > 0 ? result : [text];
}
