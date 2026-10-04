import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { UiLocaleService, type UiLocaleCode } from '../ui/ui-locale.service';
import type {
  AdhkarCollection,
  AdhkarIndexPayload,
  AdhkarLocalizedText,
  AdhkarSearchResult,
} from './adhkar.types';

export function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // remove Arabic diacritics / tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .trim();
}

@Injectable({ providedIn: 'root' })
export class AdhkarService {
  private readonly http = inject(HttpClient);
  private readonly ui = inject(UiLocaleService);

  private readonly loadGeneration = new BehaviorSubject(0);

  private readonly index$ = this.loadGeneration.pipe(
    switchMap(() =>
      this.http.get<AdhkarIndexPayload>('/adhkar-index.json').pipe(catchError(() => of(null))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<AdhkarIndexPayload | null> {
    return this.index$;
  }

  retryLoad(): void {
    this.loadGeneration.next(this.loadGeneration.value + 1);
  }

  getCollections(): Observable<readonly AdhkarCollection[]> {
    return this.index$.pipe(map((payload) => payload?.collections ?? []));
  }

  getCollection(id: string): Observable<AdhkarCollection | null> {
    return this.index$.pipe(
      map((payload) => payload?.collections.find((c) => c.id === id) ?? null),
    );
  }

  getRelatedCollections(id: string, limit = 2): Observable<readonly AdhkarCollection[]> {
    return this.getCollections().pipe(
      map((collections) => collections.filter((c) => c.id !== id).slice(0, limit)),
    );
  }

  getAdjacentCollections(
    id: string,
  ): Observable<{ prev: AdhkarCollection | null; next: AdhkarCollection | null }> {
    return this.getCollections().pipe(
      map((collections) => {
        const idx = collections.findIndex((c) => c.id === id);
        if (idx === -1) {
          return { prev: null, next: null };
        }
        const prev = idx > 0 ? collections[idx - 1] : null;
        const next = idx < collections.length - 1 ? collections[idx + 1] : null;
        return { prev, next };
      }),
    );
  }

  search(rawQuery: string): Observable<readonly AdhkarSearchResult[]> {
    const query = normalizeSearchText(rawQuery);
    if (!query || query.length < 2) {
      return of([]);
    }

    return this.getCollections().pipe(
      map((collections) => {
        const results: AdhkarSearchResult[] = [];

        for (const col of collections) {
          for (const item of col.items) {
            const arNorm = normalizeSearchText(item.arabic);
            const translitNorm = normalizeSearchText(item.transliteration ?? '');
            const enNorm = normalizeSearchText(item.translation.en);
            const urNorm = normalizeSearchText(item.translation.ur);
            const srcNorm = normalizeSearchText(item.source ?? '');
            const benEnNorm = normalizeSearchText(item.benefit?.en ?? '');
            const benUrNorm = normalizeSearchText(item.benefit?.ur ?? '');

            let matchField: AdhkarSearchResult['matchField'] | null = null;

            if (arNorm.includes(query)) {
              matchField = 'arabic';
            } else if (translitNorm.includes(query)) {
              matchField = 'transliteration';
            } else if (enNorm.includes(query) || urNorm.includes(query) || benEnNorm.includes(query) || benUrNorm.includes(query)) {
              matchField = 'translation';
            } else if (srcNorm.includes(query)) {
              matchField = 'source';
            }

            if (matchField) {
              results.push({
                item,
                collectionId: col.id,
                collectionTitle: col.title,
                collectionIcon: col.icon,
                matchField,
              });
            }
          }
        }

        return results;
      }),
    );
  }

  pickLocalized(text: AdhkarLocalizedText, locale?: UiLocaleCode): string {
    const code = locale ?? this.ui.locale();
    if (code === 'ur') {
      return text.ur || text.en;
    }
    if (code === 'ar') {
      return text.ar || text.en;
    }
    return text.en;
  }
}

