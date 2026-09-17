const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

export type LearnerSpeechScore = 'match' | 'close' | 'miss';

/** Strip marks and fold common Arabic letter variants for speech matching. */
export function normalizeArabicForSpeech(text: string): string {
  return text
    .normalize('NFC')
    .replace(TASHKEEL, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0600-\u06FF]/g, '')
    .trim();
}

function latinFold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z]/g, '');
}

function letterOverlap(expected: string, heard: string): number {
  if (!expected) {
    return 0;
  }
  let hits = 0;
  for (const ch of expected) {
    if (heard.includes(ch)) {
      hits += 1;
    }
  }
  return hits / expected.length;
}

/**
 * Compare a spoken transcript with the target Arabic (and optional latin name).
 * Recognition usually returns undiacritized text, so harakat are ignored.
 */
export function scoreArabicSpeech(
  expectedArabic: string,
  heard: string,
  expectedLatin?: string,
): LearnerSpeechScore {
  const target = normalizeArabicForSpeech(expectedArabic);
  const said = normalizeArabicForSpeech(heard);
  const latinTarget = expectedLatin ? latinFold(expectedLatin) : '';
  const latinHeard = latinFold(heard);

  if (latinTarget && latinHeard && (latinHeard.includes(latinTarget) || latinTarget.includes(latinHeard))) {
    return 'match';
  }

  if (!said) {
    return 'miss';
  }
  if (said === target || said.includes(target) || (target.length >= 2 && target.includes(said))) {
    return 'match';
  }

  const overlap = letterOverlap(target, said);
  if (overlap >= 0.7 || (target.length === 1 && said.includes(target))) {
    return 'close';
  }
  if (overlap >= 0.45) {
    return 'close';
  }
  return 'miss';
}
