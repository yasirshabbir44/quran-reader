import {
  ReaderActiveAyahService,
  ReaderAudioPlaybackService,
  ReaderBookmarkUiService,
  ReaderCorpusStateService,
  ReaderDocumentTitleService,
  ReaderIntroContentService,
  ReaderLayoutBreakpointsService,
  ReaderPanelCoordinatorService,
  ReaderRouteCoordinatorService,
  ReaderScrollStateService,
  ReaderMushafNavService,
  ReaderSurahNavService,
  ReaderSurahSearchService,
  ReaderSwipeNavigationService,
  ReaderTafsirPanelService,
  ReaderWordStudyPanelService,
  ReaderVerseActionsService,
  ReaderVerseFragmentService,
  ReaderViewPreferencesService,
} from './services';

/**
 * Injectable providers for the surah reader route.
 *
 * Registered on `SurahReaderComponent` so each navigation gets a fresh instance
 * (no shared mutable state across routes). See `surah-reader/README.md` and
 * `services/README.md` for folder layout and responsibilities.
 *
 * @see ./README.md
 * @see ./services/README.md
 */
export const READER_FEATURE_PROVIDERS = [
  ReaderCorpusStateService,
  ReaderViewPreferencesService,
  ReaderRouteCoordinatorService,
  ReaderActiveAyahService,
  ReaderScrollStateService,
  ReaderVerseFragmentService,
  ReaderSurahSearchService,
  ReaderSurahNavService,
  ReaderMushafNavService,
  ReaderBookmarkUiService,
  ReaderTafsirPanelService,
  ReaderWordStudyPanelService,
  ReaderLayoutBreakpointsService,
  ReaderDocumentTitleService,
  ReaderPanelCoordinatorService,
  ReaderVerseActionsService,
  ReaderSwipeNavigationService,
  ReaderIntroContentService,
  ReaderAudioPlaybackService,
] as const;
