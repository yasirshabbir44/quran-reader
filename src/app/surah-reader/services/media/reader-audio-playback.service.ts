import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  NgZone,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { forkJoin, of, Subscription, catchError } from 'rxjs';
import { alafasyAyahAudioUrl } from '../../../core/audio/ayah-audio-url';
import { AyahAudioTimingService } from '../../../core/audio/ayah-audio-timing.service';
import {
  activeWordPositionAt,
  type AyahWordTiming,
} from '../../../core/audio/ayah-audio-timing.util';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import { QuranWordStudyService } from '../../../core/word-study/quran-word-study.service';
import type { WordStudyToken } from '../../../core/word-study/quran-word-study.types';
import { ReaderActiveAyahService } from '../navigation/reader-active-ayah.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

const LS_CONTINUOUS = 'quran-reader-recitation-continuous';

export interface ReaderPlaybackWord {
  readonly position: number;
  readonly text: string;
}

/**
 * Ayah-by-ayah recitation (Alafasy). Syncs active verse + scroll + word highlight.
 * Feature-scoped — no UI coupling beyond signals the shell binds to.
 */
@Injectable()
export class ReaderAudioPlaybackService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly activeAyah = inject(ReaderActiveAyahService);
  private readonly corpus = inject(ReaderCorpusStateService);
  private readonly wordStudy = inject(QuranWordStudyService);
  private readonly timingApi = inject(AyahAudioTimingService);

  private audioEl: HTMLAudioElement | null = null;
  private activeToken = 0;
  private segments: readonly AyahWordTiming[] = [];
  private onTimeUpdate: (() => void) | null = null;
  private onEnded: (() => void) | null = null;
  private onError: (() => void) | null = null;
  private rafId: number | null = null;
  private highlightSub: Subscription | null = null;

  readonly isPlaying = signal(false);
  readonly currentVerse = signal<VerseRef | null>(null);
  /** Kept for callers that only need the ayah number within the current surah context. */
  readonly currentAyah = computed(() => this.currentVerse()?.ayah ?? null);
  readonly loadError = signal(false);
  readonly continuousMode = signal(true);
  /** Uthmani words for the verse currently loaded for playback (highlight spans). */
  readonly playbackWords = signal<readonly ReaderPlaybackWord[] | null>(null);
  /** 1-based word position currently being recited; null when idle / unknown. */
  readonly activeWordPosition = signal<number | null>(null);

  readonly isPaused = computed(() => {
    const ref = this.currentVerse();
    return ref !== null && !this.isPlaying();
  });

  constructor() {
    this.hydrateContinuous();
    this.destroyRef.onDestroy(() => {
      this.highlightSub?.unsubscribe();
      this.stop();
    });
  }

  isCurrentVerse(surah: number, ayah: number): boolean {
    const ref = this.currentVerse();
    return ref !== null && ref.surah === surah && ref.ayah === ayah;
  }

  isPlayingVerse(surah: number, ayah: number): boolean {
    return this.isPlaying() && this.isCurrentVerse(surah, ayah);
  }

  /** True when this verse should render word spans (playing or paused on it). */
  hasWordHighlight(surah: number, ayah: number): boolean {
    return this.isCurrentVerse(surah, ayah) && this.playbackWords() !== null;
  }

  isActiveWord(surah: number, ayah: number, position: number): boolean {
    return (
      this.isCurrentVerse(surah, ayah) && this.activeWordPosition() === position
    );
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
    this.teardownAudioListeners();
    this.stopAudioElement();
    this.loadError.set(false);
    this.segments = [];
    this.playbackWords.set(null);
    this.activeWordPosition.set(null);
    this.activeAyah.lockActiveFromScroll.set(true);
    this.currentVerse.set(ref);
    this.activeAyah.navigateToVerse(ref);

    const token = ++this.activeToken;
    this.loadHighlightData(surah, ayah, token);

    const url = alafasyAyahAudioUrl(surah, ayah);
    const audio = new Audio(url);
    this.audioEl = audio;
    this.isPlaying.set(true);

    const finish = (error?: boolean) => {
      if (token !== this.activeToken) {
        return;
      }
      this.stopRaf();
      this.isPlaying.set(false);
      this.activeWordPosition.set(null);
      if (error) {
        this.loadError.set(true);
        this.releaseActiveLock();
        this.currentVerse.set(null);
        this.playbackWords.set(null);
        this.segments = [];
        if (this.audioEl === audio) {
          this.teardownAudioListeners();
          this.audioEl = null;
        }
        return;
      }
      if (this.audioEl === audio) {
        this.teardownAudioListeners();
        this.audioEl = null;
      }
      this.playbackWords.set(null);
      this.segments = [];
      this.advanceOrStop(ref);
    };

    this.onTimeUpdate = () => this.syncWordFromAudio(token);
    this.onEnded = () => this.ngZone.run(() => finish(false));
    this.onError = () => this.ngZone.run(() => finish(true));
    audio.addEventListener('timeupdate', this.onTimeUpdate);
    audio.addEventListener('ended', this.onEnded);
    audio.addEventListener('error', this.onError);
    this.startRaf(token);
    void audio.play().catch(() => this.ngZone.run(() => finish(true)));
  }

  pause(): void {
    if (!this.audioEl) {
      return;
    }
    this.audioEl.pause();
    this.stopRaf();
    this.isPlaying.set(false);
    this.syncWordFromAudio(this.activeToken);
  }

  resume(): void {
    if (!isPlatformBrowser(this.platformId) || !this.audioEl) {
      return;
    }
    const token = this.activeToken;
    this.loadError.set(false);
    this.activeAyah.lockActiveFromScroll.set(true);
    this.isPlaying.set(true);
    this.startRaf(token);
    void this.audioEl.play().catch(() => {
      if (token !== this.activeToken) {
        return;
      }
      this.ngZone.run(() => {
        this.stopRaf();
        this.isPlaying.set(false);
        this.loadError.set(true);
        this.releaseActiveLock();
        this.currentVerse.set(null);
        this.playbackWords.set(null);
        this.activeWordPosition.set(null);
        this.segments = [];
        this.teardownAudioListeners();
        this.audioEl = null;
      });
    });
  }

  stop(): void {
    this.activeToken += 1;
    this.highlightSub?.unsubscribe();
    this.highlightSub = null;
    this.stopRaf();
    this.teardownAudioListeners();
    this.stopAudioElement();
    this.isPlaying.set(false);
    this.currentVerse.set(null);
    this.playbackWords.set(null);
    this.activeWordPosition.set(null);
    this.segments = [];
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

  private loadHighlightData(surah: number, ayah: number, token: number): void {
    this.highlightSub?.unsubscribe();
    this.highlightSub = forkJoin({
      words: this.wordStudy.loadVerse(surah, ayah).pipe(catchError(() => of(null))),
      timing: this.timingApi.loadTiming(surah, ayah).pipe(catchError(() => of(null))),
    }).subscribe(({ words, timing }) => {
      if (token !== this.activeToken) {
        return;
      }
      this.ngZone.run(() => {
        this.playbackWords.set(this.toPlaybackWords(words));
        this.segments = timing?.segments ?? [];
        this.syncWordFromAudio(token);
      });
    });
  }

  private toPlaybackWords(
    words: readonly WordStudyToken[] | null,
  ): readonly ReaderPlaybackWord[] | null {
    if (!words || words.length === 0) {
      return null;
    }
    return words.map((w) => ({ position: w.position, text: w.text }));
  }

  private syncWordFromAudio(token: number): void {
    if (token !== this.activeToken) {
      return;
    }
    const audio = this.audioEl;
    if (!audio || this.segments.length === 0) {
      return;
    }
    const timeMs = audio.currentTime * 1000;
    const next = activeWordPositionAt(this.segments, timeMs);
    if (next !== this.activeWordPosition()) {
      this.ngZone.run(() => this.activeWordPosition.set(next));
    }
  }

  private startRaf(token: number): void {
    this.stopRaf();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const tick = () => {
      if (token !== this.activeToken || !this.isPlaying()) {
        this.rafId = null;
        return;
      }
      this.syncWordFromAudio(token);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
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

  private teardownAudioListeners(): void {
    if (!this.audioEl) {
      this.onTimeUpdate = null;
      this.onEnded = null;
      this.onError = null;
      return;
    }
    if (this.onTimeUpdate) {
      this.audioEl.removeEventListener('timeupdate', this.onTimeUpdate);
    }
    if (this.onEnded) {
      this.audioEl.removeEventListener('ended', this.onEnded);
    }
    if (this.onError) {
      this.audioEl.removeEventListener('error', this.onError);
    }
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.onError = null;
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
