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
  LearnerIndexPayload,
  LearnerLesson,
  LearnerLocalizedText,
} from './learner.types';

@Injectable({ providedIn: 'root' })
export class LearnerService {
  private readonly http = inject(HttpClient);
  private readonly ui = inject(UiLocaleService);

  private readonly loadGeneration = new BehaviorSubject(0);

  private readonly index$ = this.loadGeneration.pipe(
    switchMap(() =>
      this.http.get<LearnerIndexPayload>('/learner-index.json').pipe(catchError(() => of(null))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<LearnerIndexPayload | null> {
    return this.index$;
  }

  retryLoad(): void {
    this.loadGeneration.next(this.loadGeneration.value + 1);
  }

  getLessons(): Observable<readonly LearnerLesson[]> {
    return this.index$.pipe(map((payload) => payload?.lessons ?? []));
  }

  getLesson(id: string): Observable<LearnerLesson | null> {
    return this.index$.pipe(
      map((payload) => payload?.lessons.find((l) => l.id === id) ?? null),
    );
  }

  getRelatedLessons(id: string, limit = 2): Observable<readonly LearnerLesson[]> {
    return this.getLessons().pipe(
      map((lessons) => {
        const sorted = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = sorted.findIndex((l) => l.id === id);
        if (idx < 0) {
          return [];
        }
        const related: LearnerLesson[] = [];
        if (idx > 0) {
          related.push(sorted[idx - 1]!);
        }
        if (idx < sorted.length - 1) {
          related.push(sorted[idx + 1]!);
        }
        return related.slice(0, Math.max(limit, related.length));
      }),
    );
  }

  pickLocalized(text: LearnerLocalizedText, locale?: UiLocaleCode): string {
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
