import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
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

  private readonly corpus$ = this.http.get<QuranFullPayload>('/quran-full.json').pipe(
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<QuranFullPayload> {
    return this.corpus$;
  }
}
