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
import type { AdhkarCollection, AdhkarIndexPayload, AdhkarLocalizedText } from './adhkar.types';

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
