export interface LocalizedString {
  readonly en: string;
  readonly ur: string;
  readonly ar: string;
}

export type HadithGrade = 'Sahih' | 'Hasan' | 'Muttafaq Alayh' | 'Sahih li-Ghayrihi';

export interface RelatedHadith {
  readonly id: string;
  readonly surah: number;
  /** Specific ayah, or null/undefined if applies to the whole surah/theme. */
  readonly ayah?: number;
  /** Ayah range end if applicable (e.g. 285-286). */
  readonly ayahEnd?: number;
  /** Full Arabic hadith text with tashkeel. */
  readonly arabic: string;
  /** Urdu translation. */
  readonly urdu: string;
  /** English translation. */
  readonly english: string;
  /** Companion/narrator name. */
  readonly narrator: LocalizedString;
  /** Source collection, e.g. "Sahih al-Bukhari 5006". */
  readonly source: LocalizedString;
  /** Hadith grade label. */
  readonly grade: LocalizedString;
  /** Thematic category. */
  readonly theme: LocalizedString;
}
