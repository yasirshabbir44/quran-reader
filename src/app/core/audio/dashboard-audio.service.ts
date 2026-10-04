import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { QURAN_RECITERS, DEFAULT_RECITER_ID, ayahAudioUrl, type QuranReciter } from './ayah-audio-url';

export interface PlayingVerseRef {
  readonly surah: number;
  readonly ayah: number;
  readonly label?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardAudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private audioElement: HTMLAudioElement | null = null;

  readonly reciters = QURAN_RECITERS;
  readonly selectedReciterId = signal<number>(DEFAULT_RECITER_ID);
  readonly currentTrack = signal<PlayingVerseRef | null>(null);
  readonly isPlaying = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly progressPercent = signal<number>(0);
  readonly duration = signal<number>(0);
  readonly currentTime = signal<number>(0);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAudio();
    }
  }

  setReciter(reciterId: number): void {
    this.selectedReciterId.set(reciterId);
    // If currently playing, reload with new reciter
    const track = this.currentTrack();
    if (track && this.isPlaying()) {
      this.play(track.surah, track.ayah, track.label);
    }
  }

  play(surah: number, ayah: number, label?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const track: PlayingVerseRef = { surah, ayah, label };
    const current = this.currentTrack();

    if (current?.surah === surah && current?.ayah === ayah) {
      if (this.isPlaying()) {
        this.pause();
        return;
      } else if (this.audioElement) {
        this.audioElement.play().catch(() => this.isPlaying.set(false));
        this.isPlaying.set(true);
        return;
      }
    }

    this.currentTrack.set(track);
    this.isLoading.set(true);
    this.progressPercent.set(0);

    const url = ayahAudioUrl(this.selectedReciterId(), surah, ayah);
    if (!this.audioElement) {
      this.initAudio();
    }

    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.load();
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying.set(true);
          this.isLoading.set(false);
        })
        .catch(() => {
          this.isPlaying.set(false);
          this.isLoading.set(false);
        });
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying.set(false);
    }
  }

  toggle(surah: number, ayah: number, label?: string): void {
    const current = this.currentTrack();
    if (current?.surah === surah && current?.ayah === ayah && this.isPlaying()) {
      this.pause();
    } else {
      this.play(surah, ayah, label);
    }
  }

  isCurrentAyahPlaying(surah: number, ayah: number): boolean {
    const cur = this.currentTrack();
    return cur !== null && cur.surah === surah && cur.ayah === ayah && this.isPlaying();
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying.set(false);
      this.currentTrack.set(null);
      this.progressPercent.set(0);
    }
  }

  private initAudio(): void {
    if (typeof Audio === 'undefined') return;
    this.audioElement = new Audio();

    this.audioElement.addEventListener('playing', () => {
      this.isPlaying.set(true);
      this.isLoading.set(false);
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying.set(false);
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.progressPercent.set(100);
      setTimeout(() => {
        if (!this.isPlaying()) {
          this.progressPercent.set(0);
        }
      }, 1200);
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.audioElement) return;
      const cur = this.audioElement.currentTime;
      const dur = this.audioElement.duration;
      this.currentTime.set(cur);
      if (dur > 0) {
        this.duration.set(dur);
        this.progressPercent.set(Math.min(100, (cur / dur) * 100));
      }
    });

    this.audioElement.addEventListener('error', () => {
      this.isLoading.set(false);
      this.isPlaying.set(false);
    });
  }
}
