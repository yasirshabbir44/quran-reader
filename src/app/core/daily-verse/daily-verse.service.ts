import { Injectable } from '@angular/core';
import type { QuranFullPayload, QuranSurahPayload } from '../quran/quran-data.service';

export interface DailyVerseRef {
  readonly surah: number;
  readonly ayah: number;
  readonly surahNameAr: string;
  readonly arabic: string;
  readonly translationEn: string;
}

interface FlatVerse {
  readonly surah: number;
  readonly ayah: number;
  readonly surahNameAr: string;
  readonly arabic: string;
  readonly translationEn: string;
}

@Injectable({ providedIn: 'root' })
export class DailyVerseService {
  private flat: readonly FlatVerse[] | null = null;

  /** Deterministic verse for a calendar day (stable across devices for the same date). */
  verseForDate(corpus: QuranFullPayload, date: Date = new Date()): DailyVerseRef {
    const verses = this.flatten(corpus);
    const key = this.dateKey(date);
    const index = this.hashString(key) % verses.length;
    return verses[index]!;
  }

  private flatten(corpus: QuranFullPayload): readonly FlatVerse[] {
    if (this.flat !== null) {
      return this.flat;
    }
    const out: FlatVerse[] = [];
    for (const s of corpus.surahs) {
      out.push(...this.surahVerses(s));
    }
    this.flat = out;
    return out;
  }

  private surahVerses(s: QuranSurahPayload): FlatVerse[] {
    return s.verses.map((v) => ({
      surah: s.number,
      ayah: v.ayah,
      surahNameAr: s.nameAr,
      arabic: v.ar,
      translationEn: v.en,
    }));
  }

  private dateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
