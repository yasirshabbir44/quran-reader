import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import {
  mapRecitationSegments,
  type AyahRecitationTiming,
} from './ayah-audio-timing.util';
import { DEFAULT_RECITER_ID } from './ayah-audio-url';

const API = 'https://api.quran.com/api/v4';

interface QuranComAyahAudioResponse {
  readonly audio_files?: readonly {
    readonly verse_key?: string;
    readonly segments?: readonly (readonly unknown[])[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class AyahAudioTimingService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<AyahRecitationTiming | null>>();

  loadTiming(
    surah: number,
    ayah: number,
    reciterId = DEFAULT_RECITER_ID,
  ): Observable<AyahRecitationTiming | null> {
    const key = `${reciterId}:${surah}:${ayah}`;
    const hit = this.cache.get(key);
    if (hit) {
      return hit;
    }
    const url =
      `${API}/recitations/${reciterId}/by_ayah/${surah}:${ayah}` +
      '?fields=segments,duration';
    const request$ = this.http.get<QuranComAyahAudioResponse>(url).pipe(
      map((payload) => {
        const raw = payload.audio_files?.[0]?.segments ?? [];
        const segments = mapRecitationSegments(raw);
        return segments.length > 0 ? { surah, ayah, segments } : null;
      }),
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.cache.set(key, request$);
    return request$;
  }
}
