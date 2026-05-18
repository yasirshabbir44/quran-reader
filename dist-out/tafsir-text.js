/** Target length for a single commentary paragraph (characters). */
const MAX_PARAGRAPH_CHARS = 520;
/** Minimum size before forcing a split on sentence boundaries. */
const MIN_SPLIT_CHARS = 300;
const SENTENCE_END = /(?<=[.!?…؟۔])\s+/u;
export const TAFSIR_BLOCK_ORDER = [
    'meaning',
    'context',
    'historical',
    'lessons',
    'reflection',
];
/** i18n keys for block section titles (verse reader). */
export const TAFSIR_BLOCK_LABEL_KEYS = {
    meaning: 'tafsirBlockMeaning',
    context: 'tafsirBlockContext',
    historical: 'tafsirBlockHistorical',
    lessons: 'tafsirBlockLessons',
    reflection: 'tafsirBlockReflection',
};
const HEADING_LINE = /^(?:[\d]+[.)]\s*)?([^\n.!?…؟۔]{3,90})(?:\s*[:：])?\s*$/u;
const HEADING_TYPE_RULES = [
    { type: 'meaning', pattern: /commentary|explanation|meaning|lexical|etymology|semantics|word study|tafsir|معنى|شرح|تفسير|لفظ/i },
    { type: 'context', pattern: /context|occasion|background|setting|reason for revelation|asb[aā]b|situation|سبب|نزول|سياق|خلفية/i },
    {
        type: 'historical',
        pattern: /historical|history|age of ignorance|jahiliyyah|era|chronicle|biograph|companion|caliph|عهد|تاريخ|جاهلية|صحاب/i,
    },
    {
        type: 'lessons',
        pattern: /ruling|rulings|injunction|injunctions|sunnah|fiqh|legal|merit|consideration|obligation|حكم|فقه|سنة|أحكام|فوائد/i,
    },
    { type: 'reflection', pattern: /reflection|spiritual|moral|wisdom|lesson|devotion|heart|soul|تدبر|تأمل|عبرة|موعظ/i },
];
const PARAGRAPH_SCORE_RULES = {
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
 * for scannable reading. Uses embedded headings when present, otherwise
 * classifies paragraphs heuristically.
 */
export function formatTafsirBlocks(text) {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
        return [];
    }
    const fromHeadings = parseByEmbeddedHeadings(normalized);
    const typedChunks = fromHeadings.length > 0
        ? fromHeadings
        : classifyParagraphs(formatTafsirParagraphs(normalized));
    return mergeBlocks(typedChunks);
}
/**
 * Splits raw tafsir API text into shorter paragraphs for comfortable reading.
 */
export function formatTafsirParagraphs(text) {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
        return [];
    }
    const blocks = normalized
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);
    const paragraphs = [];
    for (const block of blocks) {
        if (block.includes('\n')) {
            for (const line of block.split('\n').map((l) => l.trim()).filter(Boolean)) {
                paragraphs.push(...splitLongParagraph(line));
            }
        }
        else {
            paragraphs.push(...splitLongParagraph(block));
        }
    }
    return paragraphs;
}
function parseByEmbeddedHeadings(text) {
    const lines = text.split('\n');
    const chunks = [];
    let currentType = 'meaning';
    let buffer = [];
    const flush = () => {
        const joined = buffer.join('\n').trim();
        buffer = [];
        if (!joined) {
            return;
        }
        const last = chunks.at(-1);
        if (last?.type === currentType) {
            last.lines.push(joined);
        }
        else {
            chunks.push({ type: currentType, lines: [joined] });
        }
    };
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }
        const headingMatch = trimmed.match(HEADING_LINE);
        const headingType = headingMatch ? classifyHeading(headingMatch[1]) : null;
        if (headingType) {
            flush();
            currentType = headingType;
            continue;
        }
        buffer.push(trimmed);
    }
    flush();
    return chunks.flatMap(({ type, lines }) => lines.flatMap((body) => {
        const paragraphs = formatTafsirParagraphs(body);
        return paragraphs.map((p) => ({ type, text: p }));
    }));
}
function classifyHeading(heading) {
    const h = heading.trim();
    if (h.length < 3) {
        return null;
    }
    for (const { type, pattern } of HEADING_TYPE_RULES) {
        if (pattern.test(h)) {
            return type;
        }
    }
    if (looksLikeStandaloneHeading(h)) {
        return 'meaning';
    }
    return null;
}
function looksLikeStandaloneHeading(line) {
    if (line.length > 90 || /[.!?…؟۔]\s*$/.test(line)) {
        return false;
    }
    const words = line.split(/\s+/);
    if (words.length > 12) {
        return false;
    }
    const titleish = /^[A-Z\u0600-\u06FF]/.test(line) && !line.includes('http');
    return titleish;
}
function classifyParagraphs(paragraphs) {
    if (paragraphs.length <= 2) {
        return paragraphs.map((text) => ({ type: 'meaning', text }));
    }
    return paragraphs.map((text, index) => ({
        type: scoreParagraph(text, index, paragraphs.length),
        text,
    }));
}
function scoreParagraph(text, index, total) {
    const scores = {
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
    let best = 'meaning';
    let bestScore = -1;
    for (const type of TAFSIR_BLOCK_ORDER) {
        if (scores[type] > bestScore) {
            bestScore = scores[type];
            best = type;
        }
    }
    return bestScore > 0 ? best : index < total * 0.35 ? 'meaning' : index < total * 0.6 ? 'context' : 'reflection';
}
function mergeBlocks(chunks) {
    const byType = new Map();
    for (const { type, text } of chunks) {
        const list = byType.get(type) ?? [];
        list.push(text);
        byType.set(type, list);
    }
    const result = [];
    for (const type of TAFSIR_BLOCK_ORDER) {
        const paragraphs = byType.get(type);
        if (paragraphs?.length) {
            result.push({ type, paragraphs });
        }
    }
    return result;
}
function splitLongParagraph(text) {
    if (text.length <= MAX_PARAGRAPH_CHARS) {
        return [text];
    }
    const parts = text.split(SENTENCE_END).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
        return [text];
    }
    const result = [];
    let current = '';
    for (const part of parts) {
        if (!current) {
            current = part;
            continue;
        }
        const combined = `${current} ${part}`;
        if (combined.length <= MAX_PARAGRAPH_CHARS) {
            current = combined;
        }
        else {
            result.push(current);
            current = part;
        }
    }
    if (current) {
        if (current.length > MAX_PARAGRAPH_CHARS && result.length > 0 && result.at(-1).length < MIN_SPLIT_CHARS) {
            result[result.length - 1] = `${result.at(-1)} ${current}`;
        }
        else {
            result.push(current);
        }
    }
    return result.length > 0 ? result : [text];
}
