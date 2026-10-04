/** Target length for a single commentary paragraph (characters). */
const MAX_PARAGRAPH_CHARS = 520;
/** Minimum size before forcing a split on sentence boundaries. */
const MIN_SPLIT_CHARS = 300;

const SENTENCE_END = /(?<=[.!?…؟۔])\s+/u;

export type TafsirBlockType = 'meaning' | 'hadith' | 'context' | 'historical' | 'lessons' | 'reflection';

export const TAFSIR_BLOCK_ORDER: readonly TafsirBlockType[] = [
  'meaning',
  'hadith',
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
  hadith: 'tafsirBlockHadith',
  context: 'tafsirBlockContext',
  historical: 'tafsirBlockHistorical',
  lessons: 'tafsirBlockLessons',
  reflection: 'tafsirBlockReflection',
};

/** Known section titles in API text (Urdu, Arabic, English). */
const EXPLICIT_HEADING =
  /^(?:[\d]+[.)]\s*)?(commentary|explanation|meaning|ruling|rulings|injunctions?|historical|history|context|reflection|merits|considerations?|hadith|traditions?|الحكم|المعنى|الشرح|التفسير|السبب|التاريخ|تأمل|فوائد|خلفية|الحديث|الأحاديث|أثر|تفسير|معنی|مفہوم|تشریح|حدیث|احادیث|شان نزول|سبب نزول|احکام|مسائل|سبق|تدبر|تزکیہ)(?:\s+.{0,60})?\s*[:：۔]?\s*$/iu;

const HEADING_TYPE_RULES: readonly { type: TafsirBlockType; pattern: RegExp }[] = [
  {
    type: 'hadith',
    pattern:
      /^(?:hadith|hadiths|tradition|traditions|prophetic|narration|narrations|الحديث|الأحاديث|الأثر|الآثار|الرواية|حدیث|احادیث|روایات|روایت|فرمان نبوی)/i,
  },
  {
    type: 'meaning',
    pattern:
      /^(?:commentary|explanation|meaning|lexical|etymology|semantics|word study|tafsir|المعنى|الشرح|التفسير|المراد|لفظ|معنی|مفہوم|تشریح|تفسیر|الفاظ کے معنی)/i,
  },
  {
    type: 'context',
    pattern:
      /^(?:context|occasion|background|setting|reason for revelation|asb[aā]b|situation|سبب|نزول|سياق|خلفية|أسباب النزول|شان نزول|سبب نزول|پس منظر)/i,
  },
  {
    type: 'historical',
    pattern:
      /^(?:historical|history|age of ignorance|jahiliyyah|era|chronicle|عهد|تاريخ|جاهلية|واقعہ|تاریخی پس منظر)/i,
  },
  {
    type: 'lessons',
    pattern:
      /^(?:ruling|rulings|injunction|injunctions|sunnah|fiqh|legal|merit|consideration|obligation|حكم|فقه|سنة|أحكام|فوائد|احکام|مسائل|شرعی حکم|سبق)/i,
  },
  {
    type: 'reflection',
    pattern:
      /^(?:reflection|spiritual|moral|wisdom|lesson|devotion|تدبر|تأمل|عبرة|موعظة|تزكية|تدبر و تفکر|تزکیہ|نصیحت|عبرت)/i,
  },
];

const PARAGRAPH_SCORE_RULES: Record<TafsirBlockType, readonly RegExp[]> = {
  hadith: [
    /رسول\s*اللہ/i,
    /نبی\s*کریم/i,
    /صلی\s*اللہ\s*علیہ\s*وسلم/i,
    /ﷺ/,
    /حدیث/i,
    /احادیث/i,
    /روایت\s*ہے/i,
    /روایت\s*کرتے/i,
    /بخاری/i,
    /مسلم/i,
    /ترمذی/i,
    /ابوداؤد|ابو\s*داؤد/i,
    /نسائی/i,
    /ابن\s*ماجہ/i,
    /مسند\s*احمد/i,
    /قال\s*رسول\s*الله/i,
    /صلى\s*الله\s*عليه\s*وسلم/i,
    /عن\s*النبي/i,
    /أخرجه/i,
    /رواه/i,
    /\bhadith\b/i,
    /\bthe prophet\b.*\b(said|stated|taught|instructed)\b/i,
    /\bmessenger of allah\b.*\b(said|stated)\b/i,
    /\bpeace and blessings be upon him\b/i,
    /\bnarrat(ed|or)\b/i,
    /\b(bukhari|muslim|tirmidhi|abu dawud|nasai|ibn majah)\b/i,
  ],
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
    /معنی/i,
    /مفہوم/i,
    /مراد\s*ہے/i,
    /یعنی/i,
    /الفاظ/i,
    /تشریح/i,
    /تفسیر/i,
    /يعني/,
    /معنى/,
    /أي\s/,
    /المراد/,
    /تأويل/,
  ],
  context: [
    /\bsurah\b/i,
    /\brevealed\b/i,
    /\boccasion\b/i,
    /\bbefore islam\b/i,
    /\bcontext\b/i,
    /\bwhen\b.+\bprophet\b/i,
    /\bnazul\b/i,
    /\basbab\b/i,
    /شان\s*نزول/i,
    /سبب\s*نزول/i,
    /پس\s*منظر/i,
    /نازل\s*ہوئی/i,
    /سبب\s+النزول/,
    /نزلت/,
    /سورة/,
    /سياق/,
  ],
  historical: [
    /\bprophet\b/i,
    /\bcompanion/i,
    /\bcaliph\b/i,
    /\bjahiliyyah\b/i,
    /\bage of ignorance\b/i,
    /\bcentury\b/i,
    /\bbattle\b/i,
    /\bhistory\b/i,
    /الصحابة/,
    /عهد/,
    /تاريخ/,
    /زمانہ\s*جاہلیت/i,
    /واقعہ/i,
    /تاریخی/i,
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
    /احکام/i,
    /مسائل/i,
    /شرعی\s*حکم/i,
    /واجب/i,
    /حلال/i,
    /حرام/i,
    /جائز/i,
    /ناجائز/i,
    /يجب/,
    /حرام/,
    /سنة/,
    /حكم/,
    /أحكام/,
    /فقه/,
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
    /تدبر/i,
    /تفکر/i,
    /تزکیہ/i,
    /نصیحت/i,
    /عبرت/i,
    /خوف\s*خدا/i,
    /ایمان/i,
    /قلب/i,
    /روحانی/i,
    /قلب/,
    /إيمان/,
    /تأمل/,
    /موعظة/,
  ],
};

/**
 * Splits raw tafsir API text into labeled blocks (meaning, hadith, context, etc.)
 * for scannable, rich scholarly reading.
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

/**
 * Checks whether a paragraph contains a prophetic hadith quotation or narration.
 */
export function isHadithParagraph(text: string): boolean {
  return PARAGRAPH_SCORE_RULES.hadith.some((pattern) => pattern.test(text));
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
    hadith: 0,
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

  // First paragraph usually sets meaning
  if (index === 0) {
    scores.meaning += 2;
  }

  // Strong bonus for Hadith citations
  if (scores.hadith >= 2) {
    scores.hadith += 2;
  }

  if (index >= total - 1 && /reflect|worship|mercy|heart|soul|تدبر|قلب|تزکیہ|عبرت/i.test(text)) {
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
    // If paragraph contains hadith, prioritize hadith bucket
    if (isHadithParagraph(p)) {
      const list = buckets.get('hadith') ?? [];
      list.push(p);
      buckets.set('hadith', list);
      return;
    }

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
