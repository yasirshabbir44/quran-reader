export interface LearnerLocalizedText {
  readonly en: string;
  readonly ur: string;
  readonly ar: string;
}

export type LearnerLessonKind = 'letters' | 'vowels' | 'words' | 'verse';
export type LearnerSkill = 'reading' | 'vocabulary' | 'speaking';
export type LearnerLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearnerItem {
  readonly id: string;
  readonly arabic: string;
  readonly transliteration: string;
  readonly meaning: LearnerLocalizedText;
  readonly tip?: LearnerLocalizedText;
  readonly verseRef?: string;
  /** Preferred TTS text (e.g. letter name باء instead of isolated ب). */
  readonly spoken?: string;
}

export interface LearnerLesson {
  readonly id: string;
  readonly kind: LearnerLessonKind;
  readonly icon: string;
  readonly sortOrder: number;
  readonly skill: LearnerSkill;
  readonly level: LearnerLevel;
  readonly title: LearnerLocalizedText;
  readonly description: LearnerLocalizedText;
  readonly itemCount: number;
  readonly items: readonly LearnerItem[];
}

export interface LearnerIndexPayload {
  readonly version: number;
  readonly lessons: readonly LearnerLesson[];
}

export const LEARNER_LEVELS: readonly LearnerLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
];

export function learnerSkillI18nKey(skill: LearnerSkill): string {
  if (skill === 'speaking') {
    return 'learnerSkillSpeaking';
  }
  if (skill === 'vocabulary') {
    return 'learnerSkillVocabulary';
  }
  return 'learnerSkillReading';
}

export function learnerLevelI18nKey(level: LearnerLevel): string {
  if (level === 'intermediate') {
    return 'learnerLevelIntermediate';
  }
  if (level === 'advanced') {
    return 'learnerLevelAdvanced';
  }
  return 'learnerLevelBeginner';
}
