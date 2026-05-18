const TAFSIR_EDITION_LS_KEY = 'surah-reader-tafsir-edition';
const TRANSLITERATION_LS_KEY = 'surah-reader-show-transliteration';

export function readStoredTafsirEdition(
  fallback: string,
  storage: Storage | null,
): string {
  if (!storage) {
    return fallback;
  }
  try {
    const saved = storage.getItem(TAFSIR_EDITION_LS_KEY);
    if (saved) {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function persistTafsirEdition(slug: string, storage: Storage | null): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(TAFSIR_EDITION_LS_KEY, slug);
  } catch {
    /* ignore */
  }
}

export function readStoredTransliterationPref(storage: Storage | null): boolean {
  if (!storage) {
    return true;
  }
  try {
    const raw = storage.getItem(TRANSLITERATION_LS_KEY);
    if (raw === '0' || raw === 'false') {
      return false;
    }
  } catch {
    /* ignore */
  }
  return true;
}

export function persistTransliterationPref(checked: boolean, storage: Storage | null): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(TRANSLITERATION_LS_KEY, checked ? '1' : '0');
  } catch {
    /* private mode / quota */
  }
}
