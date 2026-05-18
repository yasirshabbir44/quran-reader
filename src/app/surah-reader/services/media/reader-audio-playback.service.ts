import { Injectable, signal } from '@angular/core';

/**
 * Placeholder for HTML5 audio / HLS stream parsing (SRP: no UI coupling).
 * Wire recitation URLs and playback state here when audio ships.
 */
@Injectable()
export class ReaderAudioPlaybackService {
  readonly isPlaying = signal(false);
  readonly currentAyah = signal<number | null>(null);
  readonly loadError = signal(false);

  /** @param _surah Surah number (1–114) */
  /** @param _ayah Ayah number within surah */
  playVerse(_surah: number, _ayah: number): void {
    /* future: Audio element + stream parser */
  }

  stop(): void {
    this.isPlaying.set(false);
    this.currentAyah.set(null);
  }
}
