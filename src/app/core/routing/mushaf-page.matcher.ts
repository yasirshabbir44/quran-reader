import type { CanMatchFn } from '@angular/router';

/** Match `/page/:p` where p is 1–604. */
export const mushafPageCanMatch: CanMatchFn = (_route, segments) => {
  if (segments.length !== 2 || segments[0]!.path !== 'page') {
    return false;
  }
  const raw = segments[1]!.path;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 604 && String(n) === raw;
};
