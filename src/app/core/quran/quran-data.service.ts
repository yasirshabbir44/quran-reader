import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, shareReplay, switchMap } from 'rxjs';
import type { QuranCorpusSource } from './quran-corpus.source';

export interface QuranVerseRow {
  readonly ayah: number;
  readonly ar: string;
  readonly en: string;
  readonly ur: string;
}

export interface QuranSurahPayload {
  readonly number: number;
  readonly nameAr: string;
  readonly nameTranslit: string;
  readonly revelationType: 'meccan' | 'medinan';
  readonly versesCount: number;
  readonly verses: readonly QuranVerseRow[];
}

export interface QuranFullPayload {
  readonly surahs: readonly QuranSurahPayload[];
}

@Injectable({ providedIn: 'root' })
export class QuranDataService implements QuranCorpusSource {
  private readonly http = inject(HttpClient);

  private readonly loadGeneration = new BehaviorSubject(0);

  private readonly corpus$ = this.loadGeneration.pipe(
    switchMap(() =>
      this.http.get<QuranFullPayload>('/quran-full.json').pipe(catchError(() => of(null))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<QuranFullPayload | null> {
    return this.corpus$;
  }

  retryLoad(): void {
    this.loadGeneration.next(this.loadGeneration.value + 1);
  }
}
