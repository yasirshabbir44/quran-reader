import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { READING_BOOKMARK_REPOSITORY } from './core/bookmark/reading-bookmark.repository';
import { ReadingBookmarkService } from './core/bookmark/reading-bookmark.service';
import { KHATAM_REPOSITORY } from './core/khatam/khatam.repository';
import { KhatamService } from './core/khatam/khatam.service';
import { QURAN_CORPUS_SOURCE } from './core/quran/quran-corpus.source';
import { QuranDataService } from './core/quran/quran-data.service';
import {
  DefaultVersePresentationStrategy,
  VERSE_PRESENTATION_STRATEGY,
} from './core/verse-presentation/verse-presentation.strategy';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        // Verse deep links scroll manually after the surah renders; restoration
        // can override that and leave the reader at the top or a stale position.
        scrollPositionRestoration: 'disabled',
        anchorScrolling: 'disabled',
      }),
    ),
    provideHttpClient(),
    { provide: QURAN_CORPUS_SOURCE, useExisting: QuranDataService },
    { provide: READING_BOOKMARK_REPOSITORY, useExisting: ReadingBookmarkService },
    { provide: KHATAM_REPOSITORY, useExisting: KhatamService },
    { provide: VERSE_PRESENTATION_STRATEGY, useExisting: DefaultVersePresentationStrategy },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }), provideClientHydration(withEventReplay()),
  ],
};
