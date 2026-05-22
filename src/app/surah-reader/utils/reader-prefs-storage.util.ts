const TAFSIR_EDITION_LS_KEY = 'surah-reader-tafsir-edition';
const TRANSLITERATION_LS_KEY = 'surah-reader-show-transliteration';
const FOCUS_MODE_LS_KEY = 'surah-reader-focus-mode';

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

export function readStoredFocusModePref(storage: Storage | null): boolean {
  if (!storage) {
    return false;
  }
  try {
    const raw = storage.getItem(FOCUS_MODE_LS_KEY);
    return raw === '1' || raw === 'true';
  } catch {
    /* ignore */
  }
  return false;
}

export function persistFocusModePref(enabled: boolean, storage: Storage | null): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(FOCUS_MODE_LS_KEY, enabled ? '1' : '0');
  } catch {
    /* private mode / quota */
  }
}
