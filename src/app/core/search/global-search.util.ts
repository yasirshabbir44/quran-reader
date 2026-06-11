import type { ThematicThemeListItem } from '../thematic-index/thematic-index.service';
import type { SurahNavItem } from '../../surah-reader/models/surah-nav-item.model';
import { filterSurahNavItems } from '../../surah-reader/utils/surah-nav-filter.util';

export type GlobalSearchResultKind = 'surah' | 'theme';

export interface GlobalSearchResult {
  readonly kind: GlobalSearchResultKind;
  readonly label: string;
  readonly meta: string;
  readonly routerLink: readonly (string | number)[];
}

const MAX_SURAH_RESULTS = 6;
const MAX_THEME_RESULTS = 4;

function themeMatchesQuery(theme: ThematicThemeListItem, needle: string): boolean {
  if (theme.name.toLowerCase().includes(needle)) {
    return true;
  }
  if (theme.categoryName.toLowerCase().includes(needle)) {
    return true;
  }
  if (theme.description?.toLowerCase().includes(needle)) {
    return true;
  }
  return false;
}

export function buildGlobalSearchResults(
  query: string,
  surahs: readonly SurahNavItem[],
  themes: readonly ThematicThemeListItem[],
): readonly GlobalSearchResult[] {
  const raw = query.trim().normalize('NFKC');
  if (!raw) {
    return [];
  }
  const needle = raw.toLowerCase();

  const surahMatches = filterSurahNavItems(surahs, raw).slice(0, MAX_SURAH_RESULTS);
  const themeMatches = themes.filter((t) => themeMatchesQuery(t, needle)).slice(0, MAX_THEME_RESULTS);

  const results: GlobalSearchResult[] = [];

  for (const s of surahMatches) {
    results.push({
      kind: 'surah',
      label: s.nameAr,
      meta: `${s.number} · ${s.nameTranslit}`,
      routerLink: ['/', s.number],
    });
  }

  for (const t of themeMatches) {
    results.push({
      kind: 'theme',
      label: t.name,
      meta: t.categoryName,
      routerLink: ['/themes', t.id],
    });
  }

  return results;
}
