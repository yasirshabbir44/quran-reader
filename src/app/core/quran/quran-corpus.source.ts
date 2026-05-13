import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { QuranFullPayload } from './quran-data.service';

/**
 * Dependency Inversion: consumers depend on this abstraction, not HTTP details.
 * Gang of Four: enables swapping implementations (e.g. tests, offline bundle).
 */
export interface QuranCorpusSource {
  load(): Observable<QuranFullPayload | null>;
  /** Discards any cached error and issues a new request (supported by the default HTTP source). */
  retryLoad(): void;
}

export const QURAN_CORPUS_SOURCE = new InjectionToken<QuranCorpusSource>('QURAN_CORPUS_SOURCE');
