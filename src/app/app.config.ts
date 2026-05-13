import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { READING_BOOKMARK_REPOSITORY } from './core/bookmark/reading-bookmark.repository';
import { ReadingBookmarkService } from './core/bookmark/reading-bookmark.service';
import { QURAN_CORPUS_SOURCE } from './core/quran/quran-corpus.source';
import { QuranDataService } from './core/quran/quran-data.service';
import {
  DefaultVersePresentationStrategy,
  VERSE_PRESENTATION_STRATEGY,
} from './core/verse-presentation/verse-presentation.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    { provide: QURAN_CORPUS_SOURCE, useExisting: QuranDataService },
    { provide: READING_BOOKMARK_REPOSITORY, useExisting: ReadingBookmarkService },
    { provide: VERSE_PRESENTATION_STRATEGY, useExisting: DefaultVersePresentationStrategy },
  ],
};
