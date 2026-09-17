import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { alafasyAyahAudioUrl, ayahAudioUrl } from '../audio/ayah-audio-url';

const LS_AUTOPLAY = 'quran-reader-learner-audio-autoplay';
const LS_SLOW = 'quran-reader-learner-audio-slow';
/** Husary Muallim — slower teaching recitation for learners. */
const LEARNER_RECITER_ID = 12;

function parseVerseRef(ref: string | undefined): { surah: number; ayah: number } | null {
  if (!ref) {
    return null;
  }
  const [surahRaw, ayahRaw] = ref.split(':');
  const surah = Number(surahRaw);
  const ayah = Number(ayahRaw);
  if (!Number.isFinite(surah) || surah < 1 || !Number.isFinite(ayah) || ayah < 1) {
    return null;
  }
  return { surah, ayah };
}

@Injectable({ providedIn: 'root' })
export class LearnerAudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private audioEl: HTMLAudioElement | null = null;
  private activeToken = 0;

  readonly supported = signal(false);
  readonly speaking = signal(false);
  readonly autoPlay = signal(false);
  readonly slowMode = signal(true);
  readonly lastError = signal<string | null>(null);

  constructor() {
    this.hydrate();
  }

  /** Speak Arabic text slowly for learning (Web Speech API). */
  playArabic(text: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const cleaned = text?.trim();
    if (!cleaned) {
      return;
    }
    if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
      this.supported.set(false);
      this.lastError.set('unsupported');
      return;
    }

    this.stop();
    this.supported.set(true);
    this.lastError.set(null);
    const token = ++this.activeToken;

    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = 'ar-SA';
    utter.rate = this.slowMode() ? 0.58 : 0.82;
    utter.pitch = 1;
    const voice = this.pickArabicVoice();
    if (voice) {
      utter.voice = voice;
    }

    utter.onstart = () => {
      if (token === this.activeToken) {
        this.speaking.set(true);
      }
    };
    utter.onend = () => {
      if (token === this.activeToken) {
        this.speaking.set(false);
      }
    };
    utter.onerror = () => {
      if (token === this.activeToken) {
        this.speaking.set(false);
        this.lastError.set('speak-failed');
      }
    };

    // Some browsers need voices loaded asynchronously.
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.addEventListener(
        'voiceschanged',
        () => {
          if (token !== this.activeToken) {
            return;
          }
          const late = this.pickArabicVoice();
          if (late) {
            utter.voice = late;
          }
          speechSynthesis.speak(utter);
        },
        { once: true },
      );
      // Fallback if voiceschanged never fires.
      window.setTimeout(() => {
        if (token === this.activeToken && !speechSynthesis.speaking) {
          speechSynthesis.speak(utter);
        }
      }, 250);
      return;
    }

    speechSynthesis.speak(utter);
  }

  /** Play full ayah recitation when a verse reference is available. */
  playAyah(verseRef: string | undefined): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const parsed = parseVerseRef(verseRef);
    if (!parsed) {
      return;
    }

    this.stop();
    this.lastError.set(null);
    const token = ++this.activeToken;
    const primary = ayahAudioUrl(LEARNER_RECITER_ID, parsed.surah, parsed.ayah);
    const fallback = alafasyAyahAudioUrl(parsed.surah, parsed.ayah);
    this.startAyahAudio(primary, token, fallback);
  }

  /**
   * Prefer teaching recitation for multi-word ayahs; otherwise slow TTS.
   * `spoken` is used for isolated letters (letter name instead of the glyph).
   */
  playItem(arabic: string, verseRef?: string, spoken?: string): void {
    const phrase = arabic.trim();
    const isPhrase = /\s/.test(phrase) || phrase.length >= 8;
    if (isPhrase && verseRef) {
      this.playAyah(verseRef);
      return;
    }
    const tts = spoken?.trim() || phrase;
    if (typeof speechSynthesis !== 'undefined') {
      this.playArabic(tts);
      return;
    }
    if (verseRef) {
      this.playAyah(verseRef);
    }
  }

  stop(): void {
    this.activeToken += 1;
    if (isPlatformBrowser(this.platformId) && typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    this.speaking.set(false);
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay.set(enabled);
    this.persistAutoPlay();
  }

  toggleAutoPlay(): boolean {
    const next = !this.autoPlay();
    this.setAutoPlay(next);
    return next;
  }

  setSlowMode(enabled: boolean): void {
    this.slowMode.set(enabled);
    this.persistSlowMode();
  }

  toggleSlowMode(): boolean {
    const next = !this.slowMode();
    this.setSlowMode(next);
    return next;
  }

  maybeAutoPlay(arabic: string, verseRef?: string, spoken?: string): void {
    if (!this.autoPlay()) {
      return;
    }
    this.playItem(arabic, verseRef, spoken);
  }

  private pickArabicVoice(): SpeechSynthesisVoice | null {
    if (typeof speechSynthesis === 'undefined') {
      return null;
    }
    const voices = speechSynthesis.getVoices();
    const exact =
      voices.find((v) => v.lang === 'ar-SA') ??
      voices.find((v) => v.lang === 'ar-EG') ??
      voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
    return exact ?? null;
  }

  private hydrate(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.supported.set(typeof speechSynthesis !== 'undefined');
    try {
      this.autoPlay.set(localStorage.getItem(LS_AUTOPLAY) === '1');
      const slowRaw = localStorage.getItem(LS_SLOW);
      this.slowMode.set(slowRaw !== '0');
    } catch {
      this.autoPlay.set(false);
      this.slowMode.set(true);
    }
    // Warm voice list.
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.getVoices();
    }
  }

  private persistAutoPlay(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_AUTOPLAY, this.autoPlay() ? '1' : '0');
    } catch {
      // ignore
    }
  }

  private persistSlowMode(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_SLOW, this.slowMode() ? '1' : '0');
    } catch {
      // ignore
    }
  }

  private startAyahAudio(url: string, token: number, fallback?: string): void {
    const audio = new Audio(url);
    this.audioEl = audio;
    this.speaking.set(true);
    audio.playbackRate = this.slowMode() ? 0.82 : 0.95;

    const finish = (error?: string) => {
      if (token !== this.activeToken) {
        return;
      }
      this.speaking.set(false);
      if (error) {
        this.lastError.set(error);
      }
      if (this.audioEl === audio) {
        this.audioEl = null;
      }
    };

    let usedFallback = false;
    const tryFallback = () => {
      if (usedFallback || token !== this.activeToken) {
        return;
      }
      usedFallback = true;
      if (fallback && fallback !== url) {
        audio.pause();
        if (this.audioEl === audio) {
          this.audioEl = null;
        }
        this.startAyahAudio(fallback, token);
        return;
      }
      finish('ayah-failed');
    };

    audio.addEventListener('ended', () => finish());
    audio.addEventListener('error', () => tryFallback());
    void audio.play().catch(() => tryFallback());
  }
}
