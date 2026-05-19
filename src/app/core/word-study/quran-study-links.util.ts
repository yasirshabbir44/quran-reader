/** External study URLs for a verse (Quran.com + Corpus.Quran.com). */
export interface QuranStudyLinks {
  readonly quranCom: string;
  readonly corpusWordByWord: string;
  readonly corpusSyntaxTree: string;
}

export function buildQuranStudyLinks(surah: number, ayah: number): QuranStudyLinks {
  return {
    quranCom: `https://quran.com/${surah}/${ayah}`,
    corpusWordByWord: `https://corpus.quran.com/wordbyword.jsp?chapter=${surah}&verse=${ayah}`,
    corpusSyntaxTree: `https://corpus.quran.com/treebank.jsp?chapter=${surah}&verse=${ayah}`,
  };
}

/** Per-word morphology page on the Quranic Arabic Corpus. */
export function corpusWordMorphologyUrl(surah: number, ayah: number, wordPosition: number): string {
  return `https://corpus.quran.com/wordmorphology.jsp?location=(${surah}:${ayah}:${wordPosition})`;
}
