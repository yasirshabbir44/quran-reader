import type { UiLocaleCode } from '../ui/ui-locale.service';

export type TafsirEdition = {
  readonly slug: string;
  readonly labelKey: string;
  readonly locales: readonly UiLocaleCode[];
};

/** Curated tafsir editions (spa5k/tafsir_api, MIT). */
export const TAFSIR_EDITIONS: readonly TafsirEdition[] = [
  {
    slug: 'en-tafisr-ibn-kathir',
    labelKey: 'tafsirEditionIbnKathir',
    locales: ['en'],
  },
  {
    slug: 'en-tafsir-maarif-ul-quran',
    labelKey: 'tafsirEditionMaarif',
    locales: ['en'],
  },
  {
    slug: 'ar-tafsir-ibn-kathir',
    labelKey: 'tafsirEditionIbnKathir',
    locales: ['ar'],
  },
  {
    slug: 'ar-tafsir-muyassar',
    labelKey: 'tafsirEditionMuyassar',
    locales: ['ar'],
  },
  {
    slug: 'ur-tafseer-ibn-e-kaseer',
    labelKey: 'tafsirEditionIbnKathir',
    locales: ['ur'],
  },
] as const;

const DEFAULT_BY_LOCALE: Record<UiLocaleCode, string> = {
  en: 'en-tafisr-ibn-kathir',
  ar: 'ar-tafsir-ibn-kathir',
  ur: 'ur-tafseer-ibn-e-kaseer',
};

export function defaultTafsirSlug(locale: UiLocaleCode): string {
  return DEFAULT_BY_LOCALE[locale];
}

export function tafsirEditionsForLocale(locale: UiLocaleCode): readonly TafsirEdition[] {
  return TAFSIR_EDITIONS.filter((e) => e.locales.includes(locale));
}
