/** Build-time mirror of src/app/core/seo/seo-jsonld.ts for prerendered HTML. */

export const SEO_SITE_NAME = 'QuranDaily';

export function quranBookId(origin) {
  return `${origin}/#quran`;
}

export function chapterId(origin, number) {
  return `${origin}/${number}#chapter`;
}

export function verseId(origin, surah, ayah) {
  return `${origin}/${surah}#${ayah}`;
}

export function chapterRefJsonLd(origin, surah) {
  return {
    '@type': 'Chapter',
    '@id': chapterId(origin, surah.number),
    name: surah.nameTranslit,
    alternateName: surah.nameAr,
    position: surah.number,
    url: `${origin}/${surah.number}`,
    numberOfPages: surah.versesCount,
  };
}

export function verseRefJsonLd(origin, verse) {
  return {
    '@type': 'CreativeWork',
    '@id': verseId(origin, verse.surah, verse.ayah),
    position: verse.ayah,
    name: `Verse ${verse.ayah}`,
    url: `${origin}/${verse.surah}#${verse.ayah}`,
    inLanguage: 'ar',
    isPartOf: { '@id': chapterId(origin, verse.surah) },
  };
}

export function quranBookJsonLd({ origin, surahs, totalVerses }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': quranBookId(origin),
    name: 'The Holy Quran',
    alternateName: ['القرآن الكريم', 'Quran', 'Koran'],
    inLanguage: 'ar',
    url: origin,
    bookFormat: 'https://schema.org/EBook',
    numberOfPages: totalVerses,
    hasPart: surahs.map((surah) => chapterRefJsonLd(origin, surah)),
  };
}

export function websiteJsonLd(origin, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE_NAME,
    url: origin,
    description,
    about: { '@id': quranBookId(origin) },
  };
}

export function homeJsonLd({ origin, surahs, totalVerses, description }) {
  return [
    websiteJsonLd(origin, description),
    quranBookJsonLd({ origin, surahs, totalVerses }),
    collectionPageJsonLd({
      origin,
      path: '/',
      name: 'Quran Surah Index',
      description,
      isPartOfBook: true,
    }),
  ];
}

export function surahJsonLd({ origin, surah }) {
  const bookId = quranBookId(origin);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    '@id': chapterId(origin, surah.number),
    name: surah.nameTranslit,
    alternateName: surah.nameAr,
    position: surah.number,
    isPartOf: { '@id': bookId },
    url: `${origin}/${surah.number}`,
    numberOfPages: surah.versesCount,
    mainEntity: { '@id': bookId },
  };
  if (surah.verses?.length) {
    schema.hasPart = surah.verses.map((verse) =>
      verseRefJsonLd(origin, { surah: surah.number, ayah: verse.ayah }),
    );
  }
  return schema;
}

export function collectionPageJsonLd({
  origin,
  path,
  name,
  description,
  isPartOfBook = false,
  verses,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${origin}${path}`,
    isPartOf: isPartOfBook
      ? { '@id': quranBookId(origin) }
      : { '@type': 'WebSite', name: SEO_SITE_NAME, url: origin },
  };
  if (verses?.length) {
    schema.hasPart = verses.map((verse) => verseRefJsonLd(origin, verse));
  }
  return schema;
}

export function articleJsonLd({ origin, path, headline, description, image, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: image.startsWith('http') ? image : `${origin}${image}`,
    datePublished,
    author: { '@type': 'Organization', name: SEO_SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SEO_SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${origin}/favicon.svg` },
    },
    mainEntityOfPage: `${origin}${path}`,
  };
}

function endBeforeNextStart(starts, idx) {
  const next = starts[idx + 1];
  if (next) {
    return next.start;
  }
  return { surah: 114, ayah: 6 };
}

export function versesForMushafPage(quran, mushaf, pageNumber) {
  const pageIndex = mushaf.pages.findIndex((p) => p.page === pageNumber);
  if (pageIndex < 0) {
    return [];
  }
  const start = mushaf.pages[pageIndex].start;
  const end = endBeforeNextStart(mushaf.pages, pageIndex);
  return collectVersesInRange(quran, start, end);
}

export function versesForJuz(quran, mushaf, juzNumber) {
  const juzIndex = (mushaf.juz ?? []).findIndex((j) => j.juz === juzNumber);
  if (juzIndex < 0) {
    return [];
  }
  const start = mushaf.juz[juzIndex].start;
  const end = endBeforeNextStart(mushaf.juz, juzIndex);
  return collectVersesInRange(quran, start, end);
}

function collectVersesInRange(quran, start, endExclusive) {
  const verses = [];
  let surah = start.surah;
  let ayah = start.ayah;

  while (surah < endExclusive.surah || (surah === endExclusive.surah && ayah < endExclusive.ayah)) {
    const payload = quran.surahs[surah - 1];
    if (!payload) {
      break;
    }
    const row = payload.verses.find((v) => v.ayah === ayah);
    if (row) {
      verses.push({ surah, ayah });
    }
    if (ayah < payload.versesCount) {
      ayah += 1;
    } else {
      surah += 1;
      ayah = 1;
    }
  }

  return verses;
}
