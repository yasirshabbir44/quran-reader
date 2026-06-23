import { SEO_SITE } from './seo.config';

export interface SurahSchemaInput {
  readonly number: number;
  readonly nameAr: string;
  readonly nameTranslit: string;
  readonly versesCount: number;
}

export interface VerseSchemaInput {
  readonly ayah: number;
  readonly surah: number;
}

export function quranBookId(origin: string): string {
  return `${origin}/#quran`;
}

export function chapterId(origin: string, number: number): string {
  return `${origin}/${number}#chapter`;
}

export function verseId(origin: string, surah: number, ayah: number): string {
  return `${origin}/${surah}#${ayah}`;
}

export function chapterRefJsonLd(origin: string, surah: SurahSchemaInput): Record<string, unknown> {
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

export function verseRefJsonLd(origin: string, verse: VerseSchemaInput): Record<string, unknown> {
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

export function quranBookJsonLd(params: {
  origin: string;
  surahs: readonly SurahSchemaInput[];
  totalVerses: number;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': quranBookId(params.origin),
    name: 'The Holy Quran',
    alternateName: ['القرآن الكريم', 'Quran', 'Koran'],
    inLanguage: 'ar',
    url: params.origin,
    bookFormat: 'https://schema.org/EBook',
    numberOfPages: params.totalVerses,
    hasPart: params.surahs.map((surah) => chapterRefJsonLd(params.origin, surah)),
  };
}

export function websiteJsonLd(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE.name,
    url: origin,
    description:
      'Read the Quran online in Uthmani Arabic with English and Urdu translations, thematic index, and Islamic stories.',
    about: { '@id': quranBookId(origin) },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function homeJsonLd(params: {
  origin: string;
  surahs: readonly SurahSchemaInput[];
  totalVerses: number;
  description: string;
}): readonly Record<string, unknown>[] {
  return [
    websiteJsonLd(params.origin),
    quranBookJsonLd({
      origin: params.origin,
      surahs: params.surahs,
      totalVerses: params.totalVerses,
    }),
    collectionPageJsonLd({
      origin: params.origin,
      path: '/',
      name: 'Quran Surah Index',
      description: params.description,
      isPartOfBook: true,
    }),
  ];
}

export function surahJsonLd(params: {
  origin: string;
  path: string;
  nameAr: string;
  nameTranslit: string;
  number: number;
  versesCount: number;
  verses?: readonly VerseSchemaInput[];
}): Record<string, unknown> {
  const bookId = quranBookId(params.origin);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    '@id': chapterId(params.origin, params.number),
    name: params.nameTranslit,
    alternateName: params.nameAr,
    position: params.number,
    isPartOf: { '@id': bookId },
    url: `${params.origin}${params.path}`,
    numberOfPages: params.versesCount,
    mainEntity: { '@id': bookId },
  };
  if (params.verses?.length) {
    schema['hasPart'] = params.verses.map((verse) => verseRefJsonLd(params.origin, verse));
  }
  return schema;
}

export function articleJsonLd(params: {
  origin: string;
  path: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    image: params.image.startsWith('http') ? params.image : `${params.origin}${params.image}`,
    datePublished: params.datePublished,
    author: {
      '@type': 'Organization',
      name: SEO_SITE.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${params.origin}/favicon.svg`,
      },
    },
    mainEntityOfPage: `${params.origin}${params.path}`,
  };
}

export function collectionPageJsonLd(params: {
  origin: string;
  path: string;
  name: string;
  description: string;
  isPartOfBook?: boolean;
  verses?: readonly VerseSchemaInput[];
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: `${params.origin}${params.path}`,
    isPartOf: params.isPartOfBook
      ? { '@id': quranBookId(params.origin) }
      : {
          '@type': 'WebSite',
          name: SEO_SITE.name,
          url: params.origin,
        },
  };
  if (params.verses?.length) {
    schema['hasPart'] = params.verses.map((verse) => verseRefJsonLd(params.origin, verse));
  }
  return schema;
}

export function mushafPageCollectionJsonLd(params: {
  origin: string;
  page: number;
  description: string;
  verses: readonly VerseSchemaInput[];
}): Record<string, unknown> {
  return collectionPageJsonLd({
    origin: params.origin,
    path: `/page/${params.page}`,
    name: `Quran Mushaf Page ${params.page}`,
    description: params.description,
    isPartOfBook: true,
    verses: params.verses,
  });
}

export function juzCollectionJsonLd(params: {
  origin: string;
  juz: number;
  description: string;
  verses: readonly VerseSchemaInput[];
}): Record<string, unknown> {
  return collectionPageJsonLd({
    origin: params.origin,
    path: `/juz/${params.juz}`,
    name: `Juz ${params.juz}`,
    description: params.description,
    isPartOfBook: true,
    verses: params.verses,
  });
}
