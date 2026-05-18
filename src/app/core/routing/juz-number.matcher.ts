import type { CanMatchFn } from '@angular/router';

/** Match `/juz/:j` where j is 1–30. */
export const juzNumberCanMatch: CanMatchFn = (_route, segments) => {
  if (segments.length !== 2 || segments[0]!.path !== 'juz') {
    return false;
  }
  const raw = segments[1]!.path;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 30 && String(n) === raw;
};
