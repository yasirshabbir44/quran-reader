/** Runtime payload served from `/surah-summaries.json`. */
export interface SurahSummaryEntry {
  readonly number: number;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly nameTranslit: string;
  readonly revelationPlace: 'meccan' | 'medinan';
  readonly revelationOrder: number;
  readonly versesCount: number;
  readonly mushafPageStart: number | null;
  readonly juz: number | null;
  readonly summaryEn: string;
  readonly summaryUr: string;
  readonly detailEn: string;
  readonly detailUr: string;
  readonly sourceEn: string;
  readonly sourceUr: string;
}

export interface SurahSummariesPayload {
  readonly version: number;
  readonly generatedAt: string;
  readonly source: string;
  readonly surahs: readonly SurahSummaryEntry[];
}

export type SurahSummaryLang = 'en' | 'ur';
