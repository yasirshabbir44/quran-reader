import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import {
  scoreArabicSpeech,
  type LearnerSpeechScore,
} from './learner-speech-score.util';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: { isFinal?: boolean; [index: number]: { transcript?: string } };
  };
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

@Injectable({ providedIn: 'root' })
export class LearnerSpeechService {
  private readonly platformId = inject(PLATFORM_ID);
  private recognition: SpeechRecognitionLike | null = null;
  private activeToken = 0;

  readonly supported = signal(false);
  readonly listening = signal(false);
  readonly lastHeard = signal<string | null>(null);
  readonly lastScore = signal<LearnerSpeechScore | null>(null);
  readonly lastError = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.supported.set(recognitionCtor() !== null);
    }
  }

  listen(expectedArabic: string, expectedLatin?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) {
      this.supported.set(false);
      this.lastError.set('unsupported');
      return;
    }

    this.stop();
    this.lastHeard.set(null);
    this.lastScore.set(null);
    this.lastError.set(null);
    this.supported.set(true);

    const token = ++this.activeToken;
    const rec = new Ctor();
    this.recognition = rec;
    rec.lang = 'ar-SA';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onresult = (event) => {
      if (token !== this.activeToken) {
        return;
      }
      const transcript = this.bestTranscript(event);
      this.lastHeard.set(transcript);
      this.lastScore.set(scoreArabicSpeech(expectedArabic, transcript, expectedLatin));
    };
    rec.onerror = (event) => {
      if (token !== this.activeToken) {
        return;
      }
      this.listening.set(false);
      const err = event.error || 'speak-failed';
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        this.lastError.set('permission');
        return;
      }
      if (err === 'no-speech') {
        this.lastError.set('no-speech');
        return;
      }
      this.lastError.set('speak-failed');
    };
    rec.onend = () => {
      if (token !== this.activeToken) {
        return;
      }
      this.listening.set(false);
      this.recognition = null;
    };

    try {
      this.listening.set(true);
      rec.start();
    } catch {
      this.listening.set(false);
      this.lastError.set('speak-failed');
    }
  }

  stop(): void {
    this.activeToken += 1;
    this.listening.set(false);
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  clearResult(): void {
    this.lastHeard.set(null);
    this.lastScore.set(null);
    this.lastError.set(null);
  }

  private bestTranscript(event: SpeechRecognitionEventLike): string {
    const results = event.results;
    if (!results?.length) {
      return '';
    }
    const first = results[0];
    const alts: string[] = [];
    if (first) {
      for (let i = 0; i < 3; i += 1) {
        const piece = first[i]?.transcript?.trim();
        if (piece) {
          alts.push(piece);
        }
      }
    }
    return alts[0] ?? '';
  }
}
