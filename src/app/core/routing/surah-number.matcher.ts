import type { CanMatchFn } from '@angular/router';

/** Only match numeric surah paths 1–114 (e.g. `/67`, not `/about`). */
export const surahNumberCanMatch: CanMatchFn = (_route, segments) => {
  if (segments.length !== 1) {
    return false;
  }
  const raw = segments[0]!.path;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 114 && String(n) === raw;
};
