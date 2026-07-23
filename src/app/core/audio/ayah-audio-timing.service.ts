import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import {
  mapRecitationSegments,
  type AyahRecitationTiming,
} from './ayah-audio-timing.util';

/** Mishari Rashid Alafasy — same MP3s as everyayah Alafasy_128kbps. */
const ALAFASY_RECITATION_ID = 7;
const API = 'https://api.quran.com/api/v4';

interface QuranComAyahAudioResponse {
  readonly audio_files?: readonly {
    readonly verse_key?: string;
    readonly segments?: readonly (readonly number[])[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class AyahAudioTimingService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<AyahRecitationTiming | null>>();

  loadTiming(surah: number, ayah: number): Observable<AyahRecitationTiming | null> {
    const key = `${surah}:${ayah}`;
    const hit = this.cache.get(key);
    if (hit) {
      return hit;
    }
    const url =
      `${API}/recitations/${ALAFASY_RECITATION_ID}/by_ayah/${surah}:${ayah}` +
      '?fields=segments,duration';
    const request$ = this.http.get<QuranComAyahAudioResponse>(url).pipe(
      map((payload) => this.mapTiming(surah, ayah, payload)),
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.cache.set(key, request$);
    return request$;
  }

  private mapTiming(
    surah: number,
    ayah: number,
    payload: QuranComAyahAudioResponse,
  ): AyahRecitationTiming | null {
    const file = payload.audio_files?.[0];
    const raw = file?.segments ?? [];
    const segments = mapRecitationSegments(raw);
    if (segments.length === 0) {
      return null;
    }
    return { surah, ayah, segments };
  }
}
