import type { UiLocaleCode } from '../ui/ui-locale.service';

export type TafsirLanguageCode = 'ur' | 'en' | 'ar';

export interface TafsirEdition {
  readonly slug: string;
  readonly labelKey: string;
  readonly language: TafsirLanguageCode;
  readonly direction: 'rtl' | 'ltr';
  readonly author: string;
  readonly titleNative: string;
  readonly locales: readonly UiLocaleCode[];
}

/** Default Tafsir edition slug (Urdu Ibn Kathir by user requirement). */
export const DEFAULT_TAFSIR_SLUG = 'ur-tafseer-ibn-e-kaseer';
export const DEFAULT_TAFSIR_LANGUAGE: TafsirLanguageCode = 'ur';

/** Curated tafsir editions (spa5k/tafsir_api, MIT). */
export const TAFSIR_EDITIONS: readonly TafsirEdition[] = [
  // --- Urdu Editions (Default) ---
  {
    slug: 'ur-tafseer-ibn-e-kaseer',
    labelKey: 'tafsirEditionIbnKathir',
    language: 'ur',
    direction: 'rtl',
    author: 'حافظ عماد الدین ابن کثیر',
    titleNative: 'تفسیر ابن کثیر (اردو)',
    locales: ['ur', 'en', 'ar'],
  },
  {
    slug: 'ur-tafsir-bayan-ul-quran',
    labelKey: 'tafsirEditionBayanUlQuran',
    language: 'ur',
    direction: 'rtl',
    author: 'ڈاکٹر اسرار احمد / مولانا اشرف علی تھانوی',
    titleNative: 'بیان القرآن (اردو)',
    locales: ['ur', 'en', 'ar'],
  },
  {
    slug: 'ur-tafsir-as-saadi-urdu',
    labelKey: 'tafsirEditionSaadi',
    language: 'ur',
    direction: 'rtl',
    author: 'علامہ عبد الرحمن السعدی',
    titleNative: 'تفسیر السعدی (اردو)',
    locales: ['ur', 'en', 'ar'],
  },
  {
    slug: 'ur-tazkirul-quran',
    labelKey: 'tafsirEditionTazkirulQuran',
    language: 'ur',
    direction: 'rtl',
    author: 'مولانا وحید الدین خان',
    titleNative: 'تذکیر القرآن (اردو)',
    locales: ['ur', 'en', 'ar'],
  },

  // --- English Editions ---
  {
    slug: 'en-tafisr-ibn-kathir',
    labelKey: 'tafsirEditionIbnKathir',
    language: 'en',
    direction: 'ltr',
    author: 'Hafiz Ibn Kathir',
    titleNative: 'Tafsir Ibn Kathir (English)',
    locales: ['en', 'ur', 'ar'],
  },
  {
    slug: 'en-tafsir-maarif-ul-quran',
    labelKey: 'tafsirEditionMaarif',
    language: 'en',
    direction: 'ltr',
    author: 'Mufti Muhammad Shafi',
    titleNative: "Ma'ariful Quran (English)",
    locales: ['en', 'ur', 'ar'],
  },
  {
    slug: 'en-asbab-al-nuzul-by-al-wahidi',
    labelKey: 'tafsirEditionAsbabAlNuzul',
    language: 'en',
    direction: 'ltr',
    author: 'Ali ibn Ahmad al-Wahidi',
    titleNative: 'Asbab al-Nuzul (Occasions of Revelation)',
    locales: ['en', 'ur', 'ar'],
  },
  {
    slug: 'en-tazkirul-quran',
    labelKey: 'tafsirEditionTazkirulQuran',
    language: 'en',
    direction: 'ltr',
    author: 'Maulana Wahiduddin Khan',
    titleNative: 'Tazkirul Quran (English)',
    locales: ['en', 'ur', 'ar'],
  },

  // --- Arabic Editions ---
  {
    slug: 'ar-tafsir-ibn-kathir',
    labelKey: 'tafsirEditionIbnKathir',
    language: 'ar',
    direction: 'rtl',
    author: 'الإمام ابن كثير الدمشقي',
    titleNative: 'تفسير ابن كثير (تفسير القرآن العظيم)',
    locales: ['ar', 'ur', 'en'],
  },
  {
    slug: 'ar-tafsir-muyassar',
    labelKey: 'tafsirEditionMuyassar',
    language: 'ar',
    direction: 'rtl',
    author: 'نخبة من العلماء (مجمع الملك فهد)',
    titleNative: 'التفسير الميسر',
    locales: ['ar', 'ur', 'en'],
  },
  {
    slug: 'ar-tafseer-al-saddi',
    labelKey: 'tafsirEditionSaadi',
    language: 'ar',
    direction: 'rtl',
    author: 'الشيخ عبد الرحمن السعدي',
    titleNative: 'تفسير السعدي (تيسير الكريم الرحمن)',
    locales: ['ar', 'ur', 'en'],
  },
  {
    slug: 'ar-tafseer-al-qurtubi',
    labelKey: 'tafsirEditionQurtubi',
    language: 'ar',
    direction: 'rtl',
    author: 'الإمام القرطبي',
    titleNative: 'تفسير القرطبي (الجامع لأحكام القرآن)',
    locales: ['ar', 'ur', 'en'],
  },
] as const;

export const DEFAULT_EDITION_BY_LANGUAGE: Record<TafsirLanguageCode, string> = {
  ur: 'ur-tafseer-ibn-e-kaseer',
  en: 'en-tafisr-ibn-kathir',
  ar: 'ar-tafsir-ibn-kathir',
};

/**
 * Returns default tafsir slug. By user preference, Urdu Ibn Kathir is always default.
 */
export function defaultTafsirSlug(_locale?: UiLocaleCode): string {
  return DEFAULT_TAFSIR_SLUG;
}

export function defaultTafsirSlugForLanguage(lang: TafsirLanguageCode): string {
  return DEFAULT_EDITION_BY_LANGUAGE[lang] ?? DEFAULT_TAFSIR_SLUG;
}

export function tafsirEditionBySlug(slug: string): TafsirEdition | undefined {
  return TAFSIR_EDITIONS.find((e) => e.slug === slug);
}

export function tafsirEditionsByLanguage(lang: TafsirLanguageCode): readonly TafsirEdition[] {
  return TAFSIR_EDITIONS.filter((e) => e.language === lang);
}

/** Legacy backwards-compatibility helper */
export function tafsirEditionsForLocale(locale: UiLocaleCode): readonly TafsirEdition[] {
  return TAFSIR_EDITIONS.filter((e) => e.locales.includes(locale));
}
