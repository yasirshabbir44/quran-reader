import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import {
  GOOGLE_AUTH_CONFIG,
  GOOGLE_AUTH_DEFAULT_SCOPES,
  GOOGLE_OAUTH_CLIENT_ID_PLACEHOLDER,
} from './core/auth/google-auth.config';
import { CompositeReadingBookmarkRepository } from './core/bookmark/composite-bookmark.repository';
import { READING_BOOKMARK_REPOSITORY } from './core/bookmark/reading-bookmark.repository';
import { QURAN_CORPUS_SOURCE } from './core/quran/quran-corpus.source';
import { QuranDataService } from './core/quran/quran-data.service';
import {
  DefaultVersePresentationStrategy,
  VERSE_PRESENTATION_STRATEGY,
} from './core/verse-presentation/verse-presentation.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(),
    { provide: QURAN_CORPUS_SOURCE, useExisting: QuranDataService },
    { provide: READING_BOOKMARK_REPOSITORY, useExisting: CompositeReadingBookmarkRepository },
    { provide: VERSE_PRESENTATION_STRATEGY, useExisting: DefaultVersePresentationStrategy },
    {
      provide: GOOGLE_AUTH_CONFIG,
      useValue: {
        clientId: GOOGLE_OAUTH_CLIENT_ID_PLACEHOLDER,
        scopes: GOOGLE_AUTH_DEFAULT_SCOPES,
      },
    },
  ],
};
