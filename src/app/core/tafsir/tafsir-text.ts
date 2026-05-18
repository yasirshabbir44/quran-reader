/** Target length for a single commentary paragraph (characters). */
const MAX_PARAGRAPH_CHARS = 520;
/** Minimum size before forcing a split on sentence boundaries. */
const MIN_SPLIT_CHARS = 300;

const SENTENCE_END = /(?<=[.!?…؟۔])\s+/u;

export type TafsirBlockType = 'meaning' | 'context' | 'historical' | 'lessons' | 'reflection';

export const TAFSIR_BLOCK_ORDER: readonly TafsirBlockType[] = [
  'meaning',
  'context',
  'historical',
  'lessons',
  'reflection',
] as const;

export interface TafsirBlock {
  type: TafsirBlockType;
  paragraphs: readonly string[];
}

/** i18n keys for block section titles (verse reader). */
export const TAFSIR_BLOCK_LABEL_KEYS: Record<TafsirBlockType, string> = {
  meaning: 'tafsirBlockMeaning',
  context: 'tafsirBlockContext',
  historical: 'tafsirBlockHistorical',
  lessons: 'tafsirBlockLessons',
  reflection: 'tafsirBlockReflection',
};

/** Known section titles in API text (English + Arabic). */
const EXPLICIT_HEADING =
  /^(?:[\d]+[.)]\s*)?(commentary|explanation|meaning|ruling|rulings|injunctions?|historical|history|context|reflection|merits|considerations?|الحكم|المعنى|الشرح|التفسير|السبب|التاريخ|تأمل|فوائد|خلفية)(?:\s+.{0,60})?\s*[:：]?\s*$/iu;

const HEADING_TYPE_RULES: readonly { type: TafsirBlockType; pattern: RegExp }[] = [
  { type: 'meaning', pattern: /^(?:commentary|explanation|meaning|lexical|etymology|semantics|word study|tafsir|المعنى|الشرح|التفسير|لفظ)/i },
  { type: 'context', pattern: /^(?:context|occasion|background|setting|reason for revelation|asb[aā]b|situation|سبب|نزول|سياق|خلفية)/i },
  {
    type: 'historical',
    pattern: /^(?:historical|history|age of ignorance|jahiliyyah|era|chronicle|عهد|تاريخ|جاهلية)/i,
  },
  {
    type: 'lessons',
    pattern: /^(?:ruling|rulings|injunction|injunctions|sunnah|fiqh|legal|merit|consideration|obligation|حكم|فقه|سنة|أحكام|فوائد)/i,
  },
  { type: 'reflection', pattern: /^(?:reflection|spiritual|moral|wisdom|lesson|devotion|تدبر|تأمل|عبرة|موعظ)/i },
];

const PARAGRAPH_SCORE_RULES: Record<TafsirBlockType, readonly RegExp[]> = {
  meaning: [
    /\bmeans\b/i,
    /\brefer(s|red)?\s+to\b/i,
    /\bsignif(y|ies|ication)\b/i,
    /\bword\b/i,
    /\bphrase\b/i,
    /\bverse\b/i,
    /\btranslat/i,
    /\blexical\b/i,
    /\bdenotes\b/i,
    /يعني/,
    /معنى/,
    /أي\s/,
  ],
  context: [
    /\bsurah\b/i,
    /\brevealed\b/i,
    /\boccasion\b/i,
    /\bbefore islam\b/i,
    /\bcontext\b/i,
    /\bwhen\b.+\bprophet\b/i,
    /\bnazul\b/i,
    /سبب\s+النزول/,
    /نزلت/,
    /سورة/,
  ],
  historical: [
    /\bprophet\b/i,
    /\bcompanion/i,
    /\bcaliph\b/i,
    /\bjahiliyyah\b/i,
    /\bage of ignorance\b/i,
    /\bhadith\b/i,
    /\btradition\b/i,
    /\bnarrat(ed|or)\b/i,
    /\bcentury\b/i,
    /\bbattle\b/i,
    /\bhistory\b/i,
    /الصحابة/,
    /عهد/,
    /تاريخ/,
  ],
  lessons: [
    /\bsunnah\b/i,
    /\bruling\b/i,
    /\binjunction\b/i,
    /\bobligat(ory|ed)\b/i,
    /\bpermissible\b/i,
    /\bforbidden\b/i,
    /\bmust\b/i,
    /\bshould not\b/i,
    /\bwajib\b/i,
    /\bmakruh\b/i,
    /\bhalal\b/i,
    /\bharam\b/i,
    /يجب/,
    /حرام/,
    /سنة/,
    /حكم/,
  ],
  reflection: [
    /\bworship\b/i,
    /\bmercy\b/i,
    /\bheart\b/i,
    /\bsoul\b/i,
    /\bbeliever\b/i,
    /\bspiritual\b/i,
    /\bponder\b/i,
    /\breflect\b/i,
    /\breminder\b/i,
    /\bfaith\b/i,
    /\bgratitude\b/i,
    /تدبر/,
    /قلب/,
    /إيمان/,
  ],
};

/**
 * Splits raw tafsir API text into labeled blocks (meaning, context, etc.)
 * for scannable reading.
 */
export function formatTafsirBlocks(text: string): readonly TafsirBlock[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const fromSections = blocksFromExplicitHeadings(normalized);
  if (fromSections) {
    return fromSections;
  }

  const paragraphs = formatTafsirParagraphs(normalized);
  if (!paragraphs.length) {
    return [];
  }

  const typedChunks = paragraphs.map((p, i) => ({
    type: scoreParagraph(p, i, paragraphs.length),
    text: p,
  }));

  let blocks = mergeBlocks(typedChunks);
  blocks = ensureReadableBlocks(blocks, paragraphs);
  return blocks;
}

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

/** Split on known section titles when the source has 2+ sections. */
function blocksFromExplicitHeadings(text: string): TafsirBlock[] | null {
  const lines = text.split('\n');
  const sections: { type: TafsirBlockType; bodies: string[] }[] = [];
  let currentType: TafsirBlockType = 'meaning';
  let buffer: string[] = [];

  const flush = (): void => {
    const joined = buffer.join('\n').trim();
    buffer = [];
    if (!joined) {
      return;
    }
    const last = sections.at(-1);
    if (last?.type === currentType) {
      last.bodies.push(joined);
    } else {
      sections.push({ type: currentType, bodies: [joined] });
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingType = classifyExplicitHeading(line);
    if (headingType) {
      flush();
      currentType = headingType;
      continue;
    }

    buffer.push(line);
  }

  flush();

  if (sections.length < 2) {
    return null;
  }

  const chunks: { type: TafsirBlockType; text: string }[] = [];
  for (const { type, bodies } of sections) {
    for (const body of bodies) {
      for (const p of formatTafsirParagraphs(body)) {
        chunks.push({ type, text: p });
      }
    }
  }

  const merged = mergeBlocks(chunks);
  return merged.length > 0 ? merged : null;
}

function classifyExplicitHeading(line: string): TafsirBlockType | null {
  const h = line.replace(/^[\d]+[.)]\s*/, '').trim();
  if (!EXPLICIT_HEADING.test(h) && h.length > 72) {
    return null;
  }
  for (const { type, pattern } of HEADING_TYPE_RULES) {
    if (pattern.test(h)) {
      return type;
    }
  }
  return EXPLICIT_HEADING.test(h) ? 'meaning' : null;
}

function scoreParagraph(text: string, index: number, total: number): TafsirBlockType {
  const scores: Record<TafsirBlockType, number> = {
    meaning: 0,
    context: 0,
    historical: 0,
    lessons: 0,
    reflection: 0,
  };

  for (const type of TAFSIR_BLOCK_ORDER) {
    for (const rule of PARAGRAPH_SCORE_RULES[type]) {
      if (rule.test(text)) {
        scores[type] += 1;
      }
    }
  }

  if (index === 0) {
    scores.meaning += 2;
  }
  if (index >= total - 1 && /reflect|worship|mercy|heart|soul|تدبر|قلب/i.test(text)) {
    scores.reflection += 2;
  }

  let best: TafsirBlockType = 'meaning';
  let bestScore = -1;
  for (const type of TAFSIR_BLOCK_ORDER) {
    if (scores[type] > bestScore) {
      bestScore = scores[type];
      best = type;
    }
  }

  if (bestScore > 0) {
    return best;
  }

  const slot = Math.floor((index / Math.max(total, 1)) * TAFSIR_BLOCK_ORDER.length);
  return TAFSIR_BLOCK_ORDER[Math.min(slot, TAFSIR_BLOCK_ORDER.length - 1)];
}

/** Long tafsir with one bucket → split by position so sections are visible. */
function ensureReadableBlocks(blocks: TafsirBlock[], paragraphs: readonly string[]): TafsirBlock[] {
  const totalParas = paragraphs.length;
  if (totalParas < 4 || blocks.length >= 2) {
    return blocks;
  }

  const buckets = new Map<TafsirBlockType, string[]>();
  paragraphs.forEach((p, i) => {
    const slot = Math.floor((i / totalParas) * TAFSIR_BLOCK_ORDER.length);
    const type = TAFSIR_BLOCK_ORDER[Math.min(slot, TAFSIR_BLOCK_ORDER.length - 1)];
    const list = buckets.get(type) ?? [];
    list.push(p);
    buckets.set(type, list);
  });

  const result: TafsirBlock[] = [];
  for (const type of TAFSIR_BLOCK_ORDER) {
    const paras = buckets.get(type);
    if (paras?.length) {
      result.push({ type, paragraphs: paras });
    }
  }
  return result.length > 0 ? result : blocks;
}

function mergeBlocks(chunks: { type: TafsirBlockType; text: string }[]): TafsirBlock[] {
  const byType = new Map<TafsirBlockType, string[]>();

  for (const { type, text } of chunks) {
    const list = byType.get(type) ?? [];
    list.push(text);
    byType.set(type, list);
  }

  const result: TafsirBlock[] = [];
  for (const type of TAFSIR_BLOCK_ORDER) {
    const paragraphs = byType.get(type);
    if (paragraphs?.length) {
      result.push({ type, paragraphs });
    }
  }

  return result;
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
