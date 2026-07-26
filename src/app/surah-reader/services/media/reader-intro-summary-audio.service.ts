import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import type { SurahSummaryLang } from '../../../core/surah-summary/surah-summary.types';

/** Google Translate TTS soft limit (characters) per request. */
const CHUNK_MAX = 180;
/** Keep Listen clips conversational — full tafsir intros can be thousands of chars. */
const LISTEN_MAX = 720;

/**
 * Speaks surah intro summaries with a natural networked voice (Google TTS)
 * for English and Urdu, with Web Speech API as offline/fallback.
 */
@Injectable()
export class ReaderIntroSummaryAudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private activeToken = 0;
  private audioEl: HTMLAudioElement | null = null;

  readonly supported = signal(false);
  readonly speaking = signal(false);
  readonly speakingLang = signal<SurahSummaryLang | null>(null);
  readonly lastError = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.supported.set(true);
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.getVoices();
      }
    }
  }

  toggle(text: string, lang: SurahSummaryLang): void {
    if (this.speaking() && this.speakingLang() === lang) {
      this.stop();
      return;
    }
    void this.speak(text, lang);
  }

  async speak(text: string, lang: SurahSummaryLang): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const cleaned = prepareListenText(text);
    if (!cleaned) {
      return;
    }

    this.stop();
    this.supported.set(true);
    this.lastError.set(null);
    const token = ++this.activeToken;
    this.speaking.set(true);
    this.speakingLang.set(lang);

    try {
      await this.speakWithGoogleTts(cleaned, lang, token);
    } catch {
      if (token !== this.activeToken) {
        return;
      }
      // Network / CORS / blocked — fall back to device voices.
      try {
        await this.speakWithWebSpeech(cleaned, lang, token);
      } catch {
        if (token === this.activeToken) {
          this.lastError.set('speak-failed');
          this.speaking.set(false);
          this.speakingLang.set(null);
        }
      }
    }
  }

  stop(): void {
    this.activeToken += 1;
    if (isPlatformBrowser(this.platformId) && typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    if (this.audioEl) {
      this.audioEl.onended = null;
      this.audioEl.onerror = null;
      this.audioEl.pause();
      this.audioEl.removeAttribute('src');
      this.audioEl.load();
      this.audioEl = null;
    }
    this.speaking.set(false);
    this.speakingLang.set(null);
  }

  private async speakWithGoogleTts(
    text: string,
    lang: SurahSummaryLang,
    token: number,
  ): Promise<void> {
    const chunks = chunkForTts(text, CHUNK_MAX);
    if (chunks.length === 0) {
      throw new Error('empty');
    }

    for (const chunk of chunks) {
      if (token !== this.activeToken) {
        return;
      }
      await this.playGoogleChunk(chunk, lang, token);
    }

    if (token === this.activeToken) {
      this.speaking.set(false);
      this.speakingLang.set(null);
    }
  }

  private playGoogleChunk(
    chunk: string,
    lang: SurahSummaryLang,
    token: number,
  ): Promise<void> {
    const url = googleTtsUrl(chunk, lang);
    return new Promise<void>((resolve, reject) => {
      if (token !== this.activeToken) {
        resolve();
        return;
      }

      const audio = new Audio();
      this.audioEl = audio;
      audio.preload = 'auto';
      // Natural pacing — slightly slower for Urdu clarity.
      audio.playbackRate = lang === 'ur' ? 0.96 : 1;

      const finishOk = () => {
        cleanup();
        resolve();
      };
      const finishErr = () => {
        cleanup();
        reject(new Error('google-tts-failed'));
      };
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        if (this.audioEl === audio) {
          this.audioEl = null;
        }
      };

      audio.onended = () => {
        if (token !== this.activeToken) {
          cleanup();
          resolve();
          return;
        }
        finishOk();
      };
      audio.onerror = () => finishErr();
      audio.src = url;
      void audio.play().catch(() => finishErr());
    });
  }

  private speakWithWebSpeech(
    text: string,
    lang: SurahSummaryLang,
    token: number,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
        reject(new Error('unsupported'));
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
      // Softer, more human pacing than the default robotic rate.
      utter.rate = lang === 'ur' ? 0.88 : 0.92;
      utter.pitch = lang === 'ur' ? 1.02 : 1;
      const voice = this.pickVoice(lang);
      if (voice) {
        utter.voice = voice;
      }

      utter.onend = () => {
        if (token === this.activeToken) {
          this.speaking.set(false);
          this.speakingLang.set(null);
        }
        resolve();
      };
      utter.onerror = () => {
        if (token === this.activeToken) {
          this.speaking.set(false);
          this.speakingLang.set(null);
        }
        reject(new Error('webspeech-failed'));
      };

      const start = () => {
        if (token !== this.activeToken) {
          resolve();
          return;
        }
        const late = this.pickVoice(lang);
        if (late) {
          utter.voice = late;
        }
        speechSynthesis.speak(utter);
      };

      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', start, { once: true });
        window.setTimeout(() => {
          if (token === this.activeToken && !speechSynthesis.speaking) {
            start();
          }
        }, 300);
        return;
      }
      start();
    });
  }

  private pickVoice(lang: SurahSummaryLang): SpeechSynthesisVoice | null {
    if (typeof speechSynthesis === 'undefined') {
      return null;
    }
    const voices = speechSynthesis.getVoices();
    if (lang === 'ur') {
      const scored = voices
        .map((v) => ({ v, score: scoreUrduVoice(v) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      return scored[0]?.v ?? null;
    }

    const prefer = [
      /samantha|karen|moira|google us|google uk|microsoft aria|microsoft jenny|natural/i,
      /^en/i,
    ];
    for (const re of prefer) {
      const hit = voices.find((v) => re.test(`${v.name} ${v.lang}`));
      if (hit) {
        return hit;
      }
    }
    return (
      voices.find((v) => v.lang.toLowerCase() === 'en-us') ??
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
      null
    );
  }
}

function prepareListenText(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }
  if (cleaned.length <= LISTEN_MAX) {
    return cleaned;
  }
  return trimAtBoundary(cleaned, LISTEN_MAX);
}

function googleTtsUrl(text: string, lang: SurahSummaryLang): string {
  const tl = lang === 'ur' ? 'ur' : 'en';
  const params = new URLSearchParams({
    ie: 'UTF-8',
    client: 'gtx',
    tl,
    q: text,
  });
  // Same-origin proxy (Vercel `/api/tts` in prod, Angular proxy in `ng serve`).
  return `/api/tts?${params.toString()}`;
}

function chunkForTts(text: string, max: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= max) {
    return [normalized];
  }

  const parts: string[] = [];
  let rest = normalized;
  while (rest.length > max) {
    const window = rest.slice(0, max + 1);
    const cut = Math.max(
      window.lastIndexOf('۔'),
      window.lastIndexOf('؟'),
      window.lastIndexOf('!'),
      window.lastIndexOf('?'),
      window.lastIndexOf('. '),
      window.lastIndexOf('،'),
      window.lastIndexOf(','),
      window.lastIndexOf(' '),
    );
    const idx = cut >= Math.floor(max * 0.4) ? cut + 1 : max;
    parts.push(rest.slice(0, idx).trim());
    rest = rest.slice(idx).trim();
  }
  if (rest) {
    parts.push(rest);
  }
  return parts.filter(Boolean);
}

function trimAtBoundary(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  const window = text.slice(0, max);
  const cut = Math.max(
    window.lastIndexOf('۔'),
    window.lastIndexOf('؟'),
    window.lastIndexOf('. '),
    window.lastIndexOf('!'),
    window.lastIndexOf('?'),
    window.lastIndexOf(' '),
  );
  const trimmed = (cut > max * 0.45 ? window.slice(0, cut + 1) : window).trim();
  return /[۔.!?؟]$/.test(trimmed) ? trimmed : `${trimmed}…`;
}

function scoreUrduVoice(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();
  let score = 0;
  if (lang === 'ur-pk' || lang === 'ur-in') {
    score += 100;
  } else if (lang.startsWith('ur')) {
    score += 80;
  }
  if (/urdu/.test(name)) {
    score += 40;
  }
  // Prefer neural / natural branded voices when present.
  if (/natural|neural|google|premium|enhanced/.test(name)) {
    score += 25;
  }
  if (v.localService) {
    score += 5;
  }
  return score;
}
