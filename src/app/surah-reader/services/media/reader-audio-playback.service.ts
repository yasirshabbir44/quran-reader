import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { alafasyAyahAudioUrl } from '../../../core/audio/ayah-audio-url';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import { ReaderActiveAyahService } from '../navigation/reader-active-ayah.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

const LS_CONTINUOUS = 'quran-reader-recitation-continuous';

/**
 * Ayah-by-ayah recitation (Alafasy). Syncs active verse + scroll; optional continuous mode.
 * Feature-scoped — no UI coupling beyond signals the shell binds to.
 */
@Injectable()
export class ReaderAudioPlaybackService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activeAyah = inject(ReaderActiveAyahService);
  private readonly corpus = inject(ReaderCorpusStateService);

  private audioEl: HTMLAudioElement | null = null;
  private activeToken = 0;

  readonly isPlaying = signal(false);
  readonly currentVerse = signal<VerseRef | null>(null);
  /** Kept for callers that only need the ayah number within the current surah context. */
  readonly currentAyah = computed(() => this.currentVerse()?.ayah ?? null);
  readonly loadError = signal(false);
  readonly continuousMode = signal(true);

  readonly isPaused = computed(() => {
    const ref = this.currentVerse();
    return ref !== null && !this.isPlaying();
  });

  constructor() {
    this.hydrateContinuous();
    this.destroyRef.onDestroy(() => this.stop());
  }

  isCurrentVerse(surah: number, ayah: number): boolean {
    const ref = this.currentVerse();
    return ref !== null && ref.surah === surah && ref.ayah === ayah;
  }

  isPlayingVerse(surah: number, ayah: number): boolean {
    return this.isPlaying() && this.isCurrentVerse(surah, ayah);
  }

  /** Play / pause / resume for the reader's active verse. */
  toggleActive(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const active = this.activeAyah.activeVerse();
    const current = this.currentVerse();
    if (
      current &&
      current.surah === active.surah &&
      current.ayah === active.ayah
    ) {
      if (this.isPlaying()) {
        this.pause();
        return;
      }
      if (this.audioEl) {
        this.resume();
        return;
      }
    }
    this.playVerse(active.surah, active.ayah);
  }

  /** Play a specific verse (also used from per-verse action buttons). */
  playVerse(surah: number, ayah: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!Number.isFinite(surah) || surah < 1 || !Number.isFinite(ayah) || ayah < 1) {
      return;
    }

    const ref: VerseRef = { surah, ayah };
    this.stopAudioElement();
    this.loadError.set(false);
    this.activeAyah.lockActiveFromScroll.set(true);
    this.currentVerse.set(ref);
    this.activeAyah.navigateToVerse(ref);

    const token = ++this.activeToken;
    const url = alafasyAyahAudioUrl(surah, ayah);
    const audio = new Audio(url);
    this.audioEl = audio;
    this.isPlaying.set(true);

    const finish = (error?: boolean) => {
      if (token !== this.activeToken) {
        return;
      }
      this.isPlaying.set(false);
      if (error) {
        this.loadError.set(true);
        this.releaseActiveLock();
        this.currentVerse.set(null);
        if (this.audioEl === audio) {
          this.audioEl = null;
        }
        return;
      }
      if (this.audioEl === audio) {
        this.audioEl = null;
      }
      this.advanceOrStop(ref);
    };

    audio.addEventListener('ended', () => finish(false));
    audio.addEventListener('error', () => finish(true));
    void audio.play().catch(() => finish(true));
  }

  pause(): void {
    if (!this.audioEl) {
      return;
    }
    this.audioEl.pause();
    this.isPlaying.set(false);
  }

  resume(): void {
    if (!isPlatformBrowser(this.platformId) || !this.audioEl) {
      return;
    }
    const token = this.activeToken;
    this.loadError.set(false);
    this.activeAyah.lockActiveFromScroll.set(true);
    this.isPlaying.set(true);
    void this.audioEl.play().catch(() => {
      if (token !== this.activeToken) {
        return;
      }
      this.isPlaying.set(false);
      this.loadError.set(true);
      this.releaseActiveLock();
      this.currentVerse.set(null);
      this.audioEl = null;
    });
  }

  stop(): void {
    this.activeToken += 1;
    this.stopAudioElement();
    this.isPlaying.set(false);
    this.currentVerse.set(null);
    this.loadError.set(false);
    this.releaseActiveLock();
  }

  /** Keep playback aligned after prev/next while audio was playing. */
  syncAfterNavigation(wasPlaying: boolean): void {
    if (!wasPlaying) {
      if (this.currentVerse() !== null && !this.isPlaying()) {
        this.stop();
      }
      return;
    }
    const ref = this.activeAyah.activeVerse();
    this.playVerse(ref.surah, ref.ayah);
  }

  setContinuousMode(enabled: boolean): void {
    this.continuousMode.set(enabled);
    this.persistContinuous();
  }

  toggleContinuousMode(): boolean {
    const next = !this.continuousMode();
    this.setContinuousMode(next);
    return next;
  }

  private advanceOrStop(justFinished: VerseRef): void {
    if (!this.continuousMode()) {
      this.currentVerse.set(null);
      this.releaseActiveLock();
      return;
    }
    const list = this.corpus.displayVerses();
    const idx = list.findIndex(
      (v) => v.surah === justFinished.surah && v.ayah === justFinished.ayah,
    );
    if (idx < 0 || idx >= list.length - 1) {
      this.currentVerse.set(null);
      this.releaseActiveLock();
      return;
    }
    const next = list[idx + 1]!;
    this.playVerse(next.surah, next.ayah);
  }

  private stopAudioElement(): void {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
  }

  private releaseActiveLock(): void {
    this.activeAyah.lockActiveFromScroll.set(false);
  }

  private hydrateContinuous(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const raw = localStorage.getItem(LS_CONTINUOUS);
      if (raw === null) {
        this.continuousMode.set(true);
        return;
      }
      this.continuousMode.set(raw === '1');
    } catch {
      this.continuousMode.set(true);
    }
  }

  private persistContinuous(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_CONTINUOUS, this.continuousMode() ? '1' : '0');
    } catch {
      // ignore
    }
  }
}
