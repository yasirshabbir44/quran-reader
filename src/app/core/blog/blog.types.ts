export interface BlogLocalizedText {
  readonly en: string;
  readonly ur: string;
  readonly ar: string;
}

export interface BlogCategory {
  readonly id: string;
  readonly name: BlogLocalizedText;
}

export interface BlogTag {
  readonly id: string;
  readonly name: BlogLocalizedText;
}

export interface BlogQuoteSection {
  readonly type: 'quote';
  readonly arabic?: string;
  readonly ref?: string;
  readonly text: BlogLocalizedText;
}

export interface BlogParagraphSection {
  readonly type: 'paragraph';
  readonly text: BlogLocalizedText;
}

export interface BlogHeadingSection {
  readonly type: 'heading';
  readonly text: BlogLocalizedText;
}

export type BlogContentSection =
  | BlogParagraphSection
  | BlogHeadingSection
  | BlogQuoteSection;

export interface BlogPost {
  readonly id: string;
  readonly categoryId: string;
  readonly publishedAt: string;
  readonly image: string;
  readonly imageAlt: BlogLocalizedText;
  readonly readMinutes: number;
  readonly title: BlogLocalizedText;
  readonly excerpt: BlogLocalizedText;
  readonly relatedSurah?: number;
  readonly tags: readonly string[];
  readonly sections: readonly BlogContentSection[];
}

export interface BlogIndexPayload {
  readonly categories: readonly BlogCategory[];
  readonly tags: readonly BlogTag[];
  readonly posts: readonly BlogPost[];
}
