# Reader services

Feature-scoped injectables for the surah reader. Each subfolder groups services by **domain** so responsibilities are easy to find.

Import from the barrel when wiring the shell:

```typescript
import { ReaderCorpusStateService, ReaderTafsirPanelService } from './services';
```

Or import from a specific folder when working in one area:

```typescript
import { ReaderCorpusStateService } from './services/corpus/reader-corpus-state.service';
```

## Folder map

| Folder | Purpose | Services |
|--------|---------|----------|
| [`corpus/`](./corpus/) | Loaded Quran JSON and current surah | `ReaderCorpusStateService` |
| [`routing/`](./routing/) | Route params, deep links, fragment URL | `ReaderRouteCoordinatorService`, `ReaderVerseFragmentService` |
| [`navigation/`](./navigation/) | Scroll position, active ayah, search, swipe | `ReaderActiveAyahService`, `ReaderScrollStateService`, `ReaderSurahSearchService`, `ReaderSwipeNavigationService` |
| [`preferences/`](./preferences/) | Reading mode and translation visibility | `ReaderViewPreferencesService` |
| [`panels/`](./panels/) | Overlays: settings coordination, surah nav, tafsir | `ReaderPanelCoordinatorService`, `ReaderSurahNavService`, `ReaderTafsirPanelService` |
| [`bookmark/`](./bookmark/) | Bookmark toast/pulse UI (storage in `core/bookmark`) | `ReaderBookmarkUiService` |
| [`layout/`](./layout/) | Responsive breakpoints (split / mobile) | `ReaderLayoutBreakpointsService` |
| [`presentation/`](./presentation/) | Copy, share, intro copy, document title | `ReaderVerseActionsService`, `ReaderIntroContentService`, `ReaderDocumentTitleService` |
| [`media/`](./media/) | Future recitation audio (no UI) | `ReaderAudioPlaybackService` |

## Dependency flow (simplified)

```
routing/ReaderRouteCoordinatorService
  → corpus, navigation, preferences, panels, bookmark

navigation/ReaderActiveAyahService
  → corpus, routing, scroll, bookmark

panels/ReaderTafsirPanelService
  → corpus, layout, core/tafsir
```

Keep **new services in the matching folder**. If a concern does not fit, add a folder and document it here.

## Registration

All services used on the reader route are listed in `reader.providers.ts` (re-exported from `./services/index.ts`).
