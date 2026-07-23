import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { alafasyAyahAudioUrl } from '../audio/ayah-audio-url';

const LS_AUTOPLAY = 'quran-reader-learner-audio-autoplay';

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
    utter.rate = 0.78;
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
    const url = alafasyAyahAudioUrl(parsed.surah, parsed.ayah);

    const audio = new Audio(url);
    this.audioEl = audio;
    this.speaking.set(true);

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

    audio.addEventListener('ended', () => finish());
    audio.addEventListener('error', () => finish('ayah-failed'));
    void audio.play().catch(() => finish('ayah-failed'));
  }

  /** Prefer Arabic TTS; fall back to ayah audio when available. */
  playItem(arabic: string, verseRef?: string): void {
    if (typeof speechSynthesis !== 'undefined') {
      this.playArabic(arabic);
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

  maybeAutoPlay(arabic: string): void {
    if (!this.autoPlay()) {
      return;
    }
    this.playArabic(arabic);
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
    } catch {
      this.autoPlay.set(false);
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
}
