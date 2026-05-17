import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { QuranDataService, type QuranFullPayload, type QuranVerseRow } from '../quran/quran-data.service';
import type {
  ThematicCategory,
  ThematicIndexPayload,
  ThematicTheme,
  ThematicVerseMapping,
} from './thematic-index.types';

export interface ThematicThemeListItem extends ThematicTheme {
  readonly categoryName: string;
}

export interface ThematicCategoryGroup {
  readonly category: ThematicCategory;
  readonly themes: readonly ThematicThemeListItem[];
}

export interface ThematicVerseDetail {
  readonly surah: number;
  readonly ayah: number;
  readonly surahNameAr: string;
  readonly surahNameTranslit: string;
  readonly verse: QuranVerseRow;
}

export interface ThemeVersesResult {
  readonly theme: ThematicTheme;
  readonly categoryName: string;
  readonly verses: readonly ThematicVerseDetail[];
}

@Injectable({ providedIn: 'root' })
export class ThematicIndexService {
  private readonly http = inject(HttpClient);
  private readonly quranData = inject(QuranDataService);

  private readonly loadGeneration = new BehaviorSubject(0);

  private readonly index$ = this.loadGeneration.pipe(
    switchMap(() =>
      this.http.get<ThematicIndexPayload>('/thematic-index.json').pipe(catchError(() => of(null))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<ThematicIndexPayload | null> {
    return this.index$;
  }

  retryLoad(): void {
    this.loadGeneration.next(this.loadGeneration.value + 1);
  }

  getThemes(): Observable<readonly ThematicThemeListItem[]> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return [];
        }
        const categoryById = new Map(payload.categories.map((c) => [c.id, c.name]));
        return [...payload.themes]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((t) => ({
            ...t,
            categoryName: categoryById.get(t.categoryId) ?? t.categoryId,
          }));
      }),
    );
  }

  getThemesByCategory(): Observable<readonly ThematicCategoryGroup[]> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return [];
        }
        const categoryById = new Map(payload.categories.map((c) => [c.id, c]));
        const themesByCategory = new Map<string, ThematicThemeListItem[]>();

        for (const t of payload.themes) {
          const cat = categoryById.get(t.categoryId);
          const item: ThematicThemeListItem = {
            ...t,
            categoryName: cat?.name ?? t.categoryId,
          };
          const list = themesByCategory.get(t.categoryId) ?? [];
          list.push(item);
          themesByCategory.set(t.categoryId, list);
        }

        return [...payload.categories]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((category) => ({
            category,
            themes: (themesByCategory.get(category.id) ?? []).sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          }))
          .filter((g) => g.themes.length > 0);
      }),
    );
  }

  getTheme(themeId: string): Observable<ThematicThemeListItem | null> {
    return this.getThemes().pipe(map((themes) => themes.find((t) => t.id === themeId) ?? null));
  }

  getVersesByTheme(themeId: string): Observable<ThemeVersesResult | null> {
    return combineLatest([this.index$, this.quranData.load()]).pipe(
      map(([payload, corpus]) => this.buildThemeVerses(payload, corpus, themeId)),
    );
  }

  private buildThemeVerses(
    payload: ThematicIndexPayload | null,
    corpus: QuranFullPayload | null,
    themeId: string,
  ): ThemeVersesResult | null {
    if (!payload || !corpus) {
      return null;
    }

    const theme = payload.themes.find((t) => t.id === themeId);
    if (!theme) {
      return null;
    }

    const categoryName =
      payload.categories.find((c) => c.id === theme.categoryId)?.name ?? theme.categoryId;

    const refs = payload.mappings.filter((m) => m.themeId === themeId);
    const verses = refs
      .map((ref) => this.resolveVerse(corpus, ref))
      .filter((v): v is ThematicVerseDetail => v !== null);

    return { theme, categoryName, verses };
  }

  private resolveVerse(
    corpus: QuranFullPayload,
    ref: ThematicVerseMapping,
  ): ThematicVerseDetail | null {
    const surah = corpus.surahs[ref.surah - 1];
    if (!surah) {
      return null;
    }
    const verse = surah.verses.find((v) => v.ayah === ref.ayah);
    if (!verse) {
      return null;
    }
    return {
      surah: ref.surah,
      ayah: ref.ayah,
      surahNameAr: surah.nameAr,
      surahNameTranslit: surah.nameTranslit,
      verse,
    };
  }
}
