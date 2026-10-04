import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdhkarAudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private activeToken = 0;

  readonly supported = signal(true);
  readonly playingId = signal<string | null>(null);
  readonly slowRate = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof window !== 'undefined' && typeof window.speechSynthesis === 'undefined') {
        this.supported.set(false);
      }
    }
  }

  isSpeaking(id: string): boolean {
    return this.playingId() === id;
  }

  toggleSlowRate(): void {
    this.slowRate.set(!this.slowRate());
  }

  play(itemId: string, text: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
      this.supported.set(false);
      return;
    }

    if (this.playingId() === itemId) {
      this.stop();
      return;
    }

    this.stop();
    const token = ++this.activeToken;
    this.playingId.set(itemId);

    // Clean text for speech
    const cleanText = text.replace(/[\n\r]+/g, ' ').trim();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'ar-SA';
    utter.rate = this.slowRate() ? 0.65 : 0.85;
    utter.pitch = 1;

    const voice = this.pickArabicVoice();
    if (voice) {
      utter.voice = voice;
    }

    utter.onend = () => {
      if (this.activeToken === token) {
        this.playingId.set(null);
      }
    };

    utter.onerror = () => {
      if (this.activeToken === token) {
        this.playingId.set(null);
      }
    };

    try {
      window.speechSynthesis.speak(utter);
    } catch {
      this.playingId.set(null);
    }
  }

  stop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.activeToken++;
    this.playingId.set(null);
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {
      /* ignore */
    }
  }

  private pickArabicVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return null;
    }
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      return null;
    }
    const arVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ar'));
    if (arVoices.length === 0) {
      return null;
    }
    // Prefer Saudi, Egyptian, or natural voices
    const sa = arVoices.find((v) => v.lang.toLowerCase().includes('sa'));
    if (sa) return sa;
    const eg = arVoices.find((v) => v.lang.toLowerCase().includes('eg'));
    if (eg) return eg;
    return arVoices[0];
  }
}
