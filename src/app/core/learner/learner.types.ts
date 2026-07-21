export interface LearnerLocalizedText {
  readonly en: string;
  readonly ur: string;
  readonly ar: string;
}

export type LearnerLessonKind = 'letters' | 'vowels' | 'words' | 'verse';
export type LearnerSkill = 'reading' | 'vocabulary';

export interface LearnerItem {
  readonly id: string;
  readonly arabic: string;
  readonly transliteration: string;
  readonly meaning: LearnerLocalizedText;
  readonly tip?: LearnerLocalizedText;
  readonly verseRef?: string;
}

export interface LearnerLesson {
  readonly id: string;
  readonly kind: LearnerLessonKind;
  readonly icon: string;
  readonly sortOrder: number;
  readonly skill: LearnerSkill;
  readonly title: LearnerLocalizedText;
  readonly description: LearnerLocalizedText;
  readonly itemCount: number;
  readonly items: readonly LearnerItem[];
}

export interface LearnerIndexPayload {
  readonly version: number;
  readonly lessons: readonly LearnerLesson[];
}
