import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';

export interface TafsirVersePayload {
  readonly text: string;
  readonly ayah: number;
  readonly surah: number;
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

@Injectable({ providedIn: 'root' })
export class TafsirService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<TafsirVersePayload | null>>();

  loadVerse(editionSlug: string, surah: number, ayah: number): Observable<TafsirVersePayload | null> {
    const key = `${editionSlug}:${surah}:${ayah}`;
    const hit = this.cache.get(key);
    if (hit) {
      return hit;
    }
    const localUrl = `/tafsir/${editionSlug}/${surah}/${ayah}.json`;
    const cdnUrl = `${CDN_BASE}/${editionSlug}/${surah}/${ayah}.json`;
    const request$ = this.http.get<TafsirVersePayload>(localUrl).pipe(
      catchError(() => this.http.get<TafsirVersePayload>(cdnUrl)),
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.cache.set(key, request$);
    return request$;
  }

  /** Drop in-flight cache entries after a failed load so retry can refetch. */
  invalidateVerse(editionSlug: string, surah: number, ayah: number): void {
    this.cache.delete(`${editionSlug}:${surah}:${ayah}`);
  }
}
