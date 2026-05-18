import type { TranslationVisibility } from '../models/reader-mode.model';

export function parseTranslationSelection(raw: string | null): TranslationVisibility {
  if (!raw) {
    return { en: true, ur: true };
  }
  const tokens = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) {
    return { en: true, ur: true };
  }
  const en = tokens.includes('131') || tokens.includes('en');
  const ur = tokens.includes('95') || tokens.includes('ur');
  if (!en && !ur) {
    return { en: true, ur: true };
  }
  return { en, ur };
}

export function buildTranslationsQueryParam(en: boolean, ur: boolean): string {
  const translations: string[] = [];
  if (en) {
    translations.push('131');
  }
  if (ur) {
    translations.push('95');
  }
  return translations.join(',');
}
