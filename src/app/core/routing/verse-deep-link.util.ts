/** DOM id and URL fragment for a verse (e.g. `/67#12`). */
export function verseElementId(ayah: number): string {
  return String(ayah);
}

export function verseFragment(ayah: number): string {
  return verseElementId(ayah);
}

export function parseVerseFragment(fragment: string | null | undefined): number | null {
  if (fragment === null || fragment === undefined || fragment === '') {
    return null;
  }
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return Math.floor(n);
}

/** Read `#ayah` from the browser location when the router fragment lags behind. */
export function parseVerseFragmentFromHash(hash: string | null | undefined): number | null {
  if (hash === null || hash === undefined || hash === '') {
    return null;
  }
  return parseVerseFragment(hash.startsWith('#') ? hash.slice(1) : hash);
}

export function buildSurahPath(surahNumber: number): string {
  return `/${surahNumber}`;
}

export function buildVerseDeepLink(origin: string, surahNumber: number, ayah: number): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${buildSurahPath(surahNumber)}#${verseFragment(ayah)}`;
}
