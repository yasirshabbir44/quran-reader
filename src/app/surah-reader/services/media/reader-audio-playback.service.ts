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
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { AyahAudioTimingService } from '../../../core/audio/ayah-audio-timing.service';
import {
  activeWordPositionAt,
  type AyahWordTiming,
} from '../../../core/audio/ayah-audio-timing.util';
import {
  DEFAULT_RECITER_ID,
  QURAN_RECITERS,
  ayahAudioUrl,
} from '../../../core/audio/ayah-audio-url';
import type { VerseRef } from '../../../core/mushaf/mushaf-index.types';
import { QuranWordStudyService } from '../../../core/word-study/quran-word-study.service';
import type { WordStudyToken } from '../../../core/word-study/quran-word-study.types';
import { ReaderActiveAyahService } from '../navigation/reader-active-ayah.service';
import { ReaderCorpusStateService } from '../corpus/reader-corpus-state.service';

const LS_CONTINUOUS = 'quran-reader-recitation-continuous';
const LS_RECITER = 'quran-reader-recitation-voice';
const LS_RATE = 'quran-reader-recitation-rate';

export interface ReaderPlaybackWord {
  readonly position: number;
  readonly text: string;
}

/**
 * Ayah recitation with voice selection, seekable progress, and word-level sync.
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
  private highlightSub: Subscription | null = null;
  private rafId: number | null = null;
  private onEnded: (() => void) | null = null;
  private onError: (() => void) | null = null;
  private onLoadedMetadata: (() => void) | null = null;

  readonly isPlaying = signal(false);
  readonly isLoading = signal(false);
  readonly currentVerse = signal<VerseRef | null>(null);
  /** Kept for callers that only need the ayah number within the current surah context. */
  readonly currentAyah = computed(() => this.currentVerse()?.ayah ?? null);
  readonly loadError = signal(false);
  readonly continuousMode = signal(true);
  readonly reciters = QURAN_RECITERS;
  readonly selectedReciterId = signal(DEFAULT_RECITER_ID);
  readonly playbackRate = signal(1);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly playbackWords = signal<readonly ReaderPlaybackWord[] | null>(null);
  readonly activeWordPosition = signal<number | null>(null);
  readonly progressPercent = computed(() => {
    const duration = this.duration();
    return duration > 0 ? (this.currentTime() / duration) * 100 : 0;
  });

  readonly isPaused = computed(() => {
    const ref = this.currentVerse();
    return ref !== null && !this.isPlaying();
  });

  constructor() {
    this.hydratePreferences();
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

  hasWordHighlight(surah: number, ayah: number): boolean {
    return this.isCurrentVerse(surah, ayah) && this.playbackWords() !== null;
  }

  isActiveWord(surah: number, ayah: number, position: number): boolean {
    return this.isCurrentVerse(surah, ayah) && this.activeWordPosition() === position;
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
    this.isLoading.set(true);
    this.segments = [];
    this.playbackWords.set(null);
    this.activeWordPosition.set(null);
    this.currentTime.set(0);
    this.duration.set(0);
    this.activeAyah.lockActiveFromScroll.set(true);
    this.currentVerse.set(ref);
    this.activeAyah.navigateToVerse(ref);

    const token = ++this.activeToken;
    this.loadHighlightData(surah, ayah, token);
    const url = ayahAudioUrl(this.selectedReciterId(), surah, ayah);
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audio.playbackRate = this.playbackRate();
    this.audioEl = audio;
    this.isPlaying.set(true);

    const finish = (error?: boolean) => {
      if (token !== this.activeToken) {
        return;
      }
      this.stopRaf();
      this.isPlaying.set(false);
      this.isLoading.set(false);
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

    this.onEnded = () => this.ngZone.run(() => finish(false));
    this.onError = () => this.ngZone.run(() => finish(true));
    this.onLoadedMetadata = () =>
      this.ngZone.run(() => {
        if (token !== this.activeToken) {
          return;
        }
        this.isLoading.set(false);
        this.duration.set(Number.isFinite(audio.duration) ? audio.duration : 0);
      });
    audio.addEventListener('ended', this.onEnded);
    audio.addEventListener('error', this.onError);
    audio.addEventListener('loadedmetadata', this.onLoadedMetadata);
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
    this.syncPlaybackState(this.activeToken);
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
    this.isLoading.set(false);
    this.currentVerse.set(null);
    this.playbackWords.set(null);
    this.activeWordPosition.set(null);
    this.currentTime.set(0);
    this.duration.set(0);
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

  setReciter(reciterId: number): void {
    if (!this.reciters.some((reciter) => reciter.id === reciterId)) {
      return;
    }
    const ref = this.currentVerse();
    const wasPlaying = this.isPlaying();
    this.selectedReciterId.set(reciterId);
    this.persistPreference(LS_RECITER, String(reciterId));
    if (ref) {
      if (wasPlaying) {
        this.playVerse(ref.surah, ref.ayah);
      } else {
        this.stop();
      }
    }
  }

  setPlaybackRate(rate: number): void {
    if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) {
      return;
    }
    this.playbackRate.set(rate);
    if (this.audioEl) {
      this.audioEl.playbackRate = rate;
    }
    this.persistPreference(LS_RATE, String(rate));
  }

  seekTo(seconds: number): void {
    const audio = this.audioEl;
    if (!audio || !Number.isFinite(seconds)) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : this.duration();
    audio.currentTime = Math.min(Math.max(seconds, 0), Math.max(duration, 0));
    this.syncPlaybackState(this.activeToken);
  }

  seekToPercent(percent: number): void {
    if (!Number.isFinite(percent) || this.duration() <= 0) {
      return;
    }
    this.seekTo((Math.min(Math.max(percent, 0), 100) / 100) * this.duration());
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  private loadHighlightData(surah: number, ayah: number, token: number): void {
    this.highlightSub?.unsubscribe();
    this.highlightSub = forkJoin({
      words: this.wordStudy.loadVerse(surah, ayah).pipe(catchError(() => of(null))),
      timing: this.timingApi
        .loadTiming(surah, ayah, this.selectedReciterId())
        .pipe(catchError(() => of(null))),
    }).subscribe(({ words, timing }) => {
      if (token !== this.activeToken) {
        return;
      }
      this.ngZone.run(() => {
        this.playbackWords.set(this.toPlaybackWords(words));
        this.segments = timing?.segments ?? [];
        this.syncPlaybackState(token);
      });
    });
  }

  private toPlaybackWords(
    words: readonly WordStudyToken[] | null,
  ): readonly ReaderPlaybackWord[] | null {
    if (!words || words.length === 0) {
      return null;
    }
    return words.map((word) => ({ position: word.position, text: word.text }));
  }

  private syncPlaybackState(token: number): void {
    if (token !== this.activeToken || !this.audioEl) {
      return;
    }
    const currentTime = this.audioEl.currentTime;
    this.ngZone.run(() => {
      this.currentTime.set(currentTime);
      if (this.segments.length > 0) {
        this.activeWordPosition.set(
          activeWordPositionAt(this.segments, currentTime * 1000),
        );
      }
    });
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
      this.syncPlaybackState(token);
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
    if (this.audioEl) {
      if (this.onEnded) {
        this.audioEl.removeEventListener('ended', this.onEnded);
      }
      if (this.onError) {
        this.audioEl.removeEventListener('error', this.onError);
      }
      if (this.onLoadedMetadata) {
        this.audioEl.removeEventListener('loadedmetadata', this.onLoadedMetadata);
      }
    }
    this.onEnded = null;
    this.onError = null;
    this.onLoadedMetadata = null;
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

  private hydratePreferences(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const raw = localStorage.getItem(LS_CONTINUOUS);
      this.continuousMode.set(raw === null || raw === '1');
      const reciter = Number(localStorage.getItem(LS_RECITER));
      if (this.reciters.some((candidate) => candidate.id === reciter)) {
        this.selectedReciterId.set(reciter);
      }
      const rate = Number(localStorage.getItem(LS_RATE));
      if (rate >= 0.5 && rate <= 2) {
        this.playbackRate.set(rate);
      }
    } catch {
      this.continuousMode.set(true);
    }
  }

  private persistContinuous(): void {
    this.persistPreference(LS_CONTINUOUS, this.continuousMode() ? '1' : '0');
  }

  private persistPreference(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
}
