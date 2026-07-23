import type { LearnerItem, LearnerLocalizedText } from './learner.types';

export type LearnerQuizPromptKind = 'meaning' | 'arabic';
export type LearnerQuizFocus = 'all' | 'learning';

export interface LearnerQuizChoice {
  readonly id: string;
  readonly label: string;
  readonly arabic?: string;
}

export interface LearnerQuizQuestion {
  readonly itemId: string;
  readonly promptKind: LearnerQuizPromptKind;
  readonly promptArabic: string;
  readonly promptMeaning: string;
  readonly promptTransliteration: string;
  readonly correctChoiceId: string;
  readonly choices: readonly LearnerQuizChoice[];
}

export interface LearnerMatchPair {
  readonly id: string;
  readonly arabic: string;
  readonly meaning: string;
  readonly transliteration: string;
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

function pickDistractors(
  pool: readonly LearnerItem[],
  correctId: string,
  count: number,
): LearnerItem[] {
  const others = pool.filter((item) => item.id !== correctId);
  return shuffleInPlace([...others]).slice(0, count);
}

export function filterLearnerItems(
  items: readonly LearnerItem[],
  focus: LearnerQuizFocus,
  isKnown: (itemId: string) => boolean,
): readonly LearnerItem[] {
  if (focus === 'all') {
    return items;
  }
  const learning = items.filter((item) => !isKnown(item.id));
  return learning.length >= 2 ? learning : items;
}

/**
 * Builds a shuffled quiz from lesson items.
 * Alternates meaning-from-Arabic and Arabic-from-meaning when possible.
 */
export function buildLearnerQuiz(
  items: readonly LearnerItem[],
  pickLocalized: (text: LearnerLocalizedText) => string,
  maxQuestions = 12,
): LearnerQuizQuestion[] {
  if (items.length < 2) {
    return [];
  }

  const ordered = shuffleInPlace([...items]).slice(0, Math.min(maxQuestions, items.length));
  const choiceCount = Math.min(4, items.length);

  return ordered.map((item, index) => {
    const promptKind: LearnerQuizPromptKind = index % 2 === 0 ? 'meaning' : 'arabic';
    const distractors = pickDistractors(items, item.id, choiceCount - 1);
    const optionItems = shuffleInPlace([item, ...distractors]);

    const choices: LearnerQuizChoice[] =
      promptKind === 'meaning'
        ? optionItems.map((opt) => ({
            id: opt.id,
            label: pickLocalized(opt.meaning),
          }))
        : optionItems.map((opt) => ({
            id: opt.id,
            label: opt.arabic,
            arabic: opt.arabic,
          }));

    return {
      itemId: item.id,
      promptKind,
      promptArabic: item.arabic,
      promptMeaning: pickLocalized(item.meaning),
      promptTransliteration: item.transliteration,
      correctChoiceId: item.id,
      choices,
    };
  });
}

export function buildLearnerMatchPairs(
  items: readonly LearnerItem[],
  pickLocalized: (text: LearnerLocalizedText) => string,
  maxPairs = 6,
): LearnerMatchPair[] {
  if (items.length < 2) {
    return [];
  }
  return shuffleInPlace([...items])
    .slice(0, Math.min(maxPairs, items.length))
    .map((item) => ({
      id: item.id,
      arabic: item.arabic,
      meaning: pickLocalized(item.meaning),
      transliteration: item.transliteration,
    }));
}
