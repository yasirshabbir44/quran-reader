export interface VerseRef {
  readonly surah: number;
  readonly ayah: number;
}

export interface MushafPageStart {
  readonly page: number;
  readonly start: VerseRef;
  readonly juz: number;
}

export interface MushafJuzStart {
  readonly juz: number;
  readonly start: VerseRef;
  readonly page: number;
}

export interface MushafIndexPayload {
  readonly edition: string;
  readonly source: string;
  readonly pages: readonly MushafPageStart[];
  readonly juz: readonly MushafJuzStart[];
  readonly versePage: Readonly<Record<string, number>>;
  readonly verseJuz: Readonly<Record<string, number>>;
}
