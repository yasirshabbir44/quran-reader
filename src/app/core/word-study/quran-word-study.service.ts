import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { corpusWordMorphologyUrl } from './quran-study-links.util';
import type { WordStudyToken } from './quran-word-study.types';

interface QuranComWord {
  readonly position: number;
  readonly char_type_name: string;
  readonly text_uthmani?: string;
  readonly text?: string;
  readonly translation?: { readonly text?: string };
  readonly transliteration?: { readonly text?: string };
}

interface QuranComVerseResponse {
  readonly verse?: {
    readonly words?: readonly QuranComWord[];
  };
}

const API = 'https://api.quran.com/api/v4';

@Injectable({ providedIn: 'root' })
export class QuranWordStudyService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<readonly WordStudyToken[] | null>>();

  loadVerse(surah: number, ayah: number): Observable<readonly WordStudyToken[] | null> {
    const key = `${surah}:${ayah}`;
    const hit = this.cache.get(key);
    if (hit) {
      return hit;
    }
    const url =
      `${API}/verses/by_key/${surah}:${ayah}` +
      '?words=true&translations=false&word_fields=text_uthmani,translation,transliteration';
    const request$ = this.http.get<QuranComVerseResponse>(url).pipe(
      map((payload) => this.mapWords(surah, ayah, payload)),
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.cache.set(key, request$);
    return request$;
  }

  invalidateVerse(surah: number, ayah: number): void {
    this.cache.delete(`${surah}:${ayah}`);
  }

  private mapWords(
    surah: number,
    ayah: number,
    payload: QuranComVerseResponse,
  ): readonly WordStudyToken[] | null {
    const raw = payload.verse?.words ?? [];
    const tokens = raw
      .filter((w) => w.char_type_name === 'word')
      .map((w) => ({
        position: w.position,
        text: (w.text_uthmani ?? w.text ?? '').trim(),
        transliteration: (w.transliteration?.text ?? '').trim(),
        translation: (w.translation?.text ?? '').trim(),
        corpusMorphologyUrl: corpusWordMorphologyUrl(surah, ayah, w.position),
      }))
      .filter((w) => w.text.length > 0);
    return tokens.length > 0 ? tokens : null;
  }
}
