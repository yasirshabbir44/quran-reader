import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import type { SurahSummariesPayload, SurahSummaryEntry } from './surah-summary.types';

@Injectable({ providedIn: 'root' })
export class SurahSummaryService {
  private readonly http = inject(HttpClient);
  private readonly loadGeneration = new BehaviorSubject(0);

  private readonly index$ = this.loadGeneration.pipe(
    switchMap(() =>
      this.http
        .get<SurahSummariesPayload>('/surah-summaries.json')
        .pipe(catchError(() => of(null))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  private readonly byNumber$ = this.index$.pipe(
    map((payload) => {
      const mapByNumber = new Map<number, SurahSummaryEntry>();
      for (const entry of payload?.surahs ?? []) {
        mapByNumber.set(entry.number, entry);
      }
      return mapByNumber;
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<SurahSummariesPayload | null> {
    return this.index$;
  }

  retryLoad(): void {
    this.loadGeneration.next(this.loadGeneration.value + 1);
  }

  getByNumber(surahNumber: number): Observable<SurahSummaryEntry | null> {
    return this.byNumber$.pipe(map((m) => m.get(surahNumber) ?? null));
  }
}
