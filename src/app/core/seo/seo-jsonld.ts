import { SEO_SITE } from './seo.config';

export function websiteJsonLd(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE.name,
    url: origin,
    description:
      'Read the Quran online in Uthmani Arabic with English and Urdu translations, thematic index, and Islamic stories.',
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

export function surahJsonLd(params: {
  origin: string;
  path: string;
  nameAr: string;
  nameTranslit: string;
  number: number;
  versesCount: number;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: params.nameTranslit,
    alternateName: params.nameAr,
    position: params.number,
    isPartOf: {
      '@type': 'Book',
      name: 'The Holy Quran',
      inLanguage: 'ar',
      url: params.origin,
    },
    url: `${params.origin}${params.path}`,
    numberOfPages: params.versesCount,
  };
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
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: `${params.origin}${params.path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SEO_SITE.name,
      url: params.origin,
    },
  };
}
