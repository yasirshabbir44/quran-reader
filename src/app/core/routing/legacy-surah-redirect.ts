import { inject } from '@angular/core';
import { Router, type RedirectFunction } from '@angular/router';
import { parseVerseFragment, verseFragment } from './verse-deep-link.util';

/** `/surah/:n` → `/:n`, mapping legacy `?startingVerse=` to `#ayah`. */
export const legacySurahRedirect: RedirectFunction = (snapshot) => {
  const router = inject(Router);
  const raw = snapshot.params['n'];
  const parsed = Number(raw);
  const surah =
    Number.isFinite(parsed) && parsed >= 1 && parsed <= 114 ? Math.floor(parsed) : 67;
  const legacyStart = snapshot.queryParams['startingVerse'];
  const fragmentAyah =
    parseVerseFragment(snapshot.fragment) ??
    (legacyStart !== undefined && legacyStart !== ''
      ? parseVerseFragment(String(legacyStart))
      : null);
  const queryParams = { ...snapshot.queryParams };
  delete queryParams['startingVerse'];
  return router.createUrlTree(['/', surah], {
    fragment: fragmentAyah !== null ? verseFragment(fragmentAyah) : undefined,
    queryParams,
  });
};
