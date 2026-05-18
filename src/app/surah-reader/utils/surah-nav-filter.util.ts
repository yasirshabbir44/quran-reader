import type { SurahNavItem } from '../models/surah-nav-item.model';

export function filterSurahNavItems(
  items: readonly SurahNavItem[],
  rawQuery: string,
): readonly SurahNavItem[] {
  const raw = rawQuery.trim().normalize('NFKC');
  if (!raw) {
    return items;
  }
  const q = raw.toLowerCase();
  const qDigits = raw.replace(/\D/g, '');
  const qLatin = q.replace(/[^a-z0-9]/gi, '');
  return items.filter((s) => {
    if (qDigits && String(s.number).includes(qDigits)) {
      return true;
    }
    if (s.nameAr.includes(raw)) {
      return true;
    }
    const translit = s.nameTranslit.normalize('NFKC').toLowerCase();
    if (translit.includes(q)) {
      return true;
    }
    const translitCompact = translit.replace(/[^a-z0-9]/g, '');
    return qLatin.length > 0 && translitCompact.includes(qLatin);
  });
}
