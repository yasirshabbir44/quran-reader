# Surah Reader Feature

The surah reader is the main reading surface of the app (`/:n` routes). It was refactored from a single ~1,650-line component into a **feature module** organized by responsibility (SRP) and **signals-first** state, with standalone UI fragments and lazy-loaded tafsir chrome.

## Design goals

| Principle | How it is applied |
|-----------|-------------------|
| **Single Responsibility** | Each service owns one concern (corpus, route sync, scroll, tafsir, search, etc.). The shell component wires DOM events and delegates to services. |
| **Interface segregation** | Shared app contracts stay in `core/` (`QURAN_CORPUS_SOURCE`, `READING_BOOKMARK_REPOSITORY`, `VERSE_PRESENTATION_STRATEGY`). Reader-only state lives under `surah-reader/`. |
| **Signals over RxJS** | Feature state uses `signal` / `computed`. RxJS remains only for corpus HTTP and route `combineLatest` in `ReaderRouteCoordinatorService`. |
| **OnPush** | `SurahReaderComponent` and `ReaderTafsirPanelComponent` use `ChangeDetectionStrategy.OnPush`. |
| **Lazy UI** | Mobile tafsir sheet is behind `@defer` so its template can split into a separate bundle chunk. |

## Directory layout

```
surah-reader/
├── README.md                          ← this file
├── reader.providers.ts                ← feature-scoped DI registry
├── surah-reader.component.ts          ← thin shell (host bindings, @HostListener)
├── surah-reader.component.html
├── surah-reader.component.scss
├── models/
│   ├── reader-mode.model.ts           ← ReaderMode, TranslationVisibility
│   └── surah-nav-item.model.ts
├── utils/
│   ├── translation-query.util.ts      ← parse/build `translations` query param
│   ├── surah-nav-filter.util.ts       ← surah picker search filter
│   └── reader-prefs-storage.util.ts   ← localStorage keys for tafsir edition & transliteration
├── services/                          ← injectable state (grouped by domain)
│   ├── README.md                      ← folder map and import patterns
│   ├── index.ts                       ← barrel re-exports
│   ├── corpus/                        ← corpus + current surah
│   ├── routing/                       ← route sync, verse fragments
│   ├── navigation/                    ← scroll, active ayah, search, swipe
│   ├── preferences/                   ← reading mode, translations
│   ├── panels/                        ← settings, surah nav, tafsir
│   ├── bookmark/                      ← bookmark UI feedback
│   ├── layout/                        ← responsive breakpoints
│   ├── presentation/                  ← copy/share, intro, title
│   └── media/                         ← ayah recitation playback
└── ui/
    └── reader-tafsir-panel/           ← standalone, OnPush tafsir body
```

## Dependency injection

All reader services are registered on the route component, not `providedIn: 'root'`:

```typescript
@Component({
  selector: 'app-surah-reader',
  providers: [...READER_FEATURE_PROVIDERS],
})
```

That gives **one isolated instance per reader navigation**, avoids cross-route leakage, and keeps tests easy to scope.

Shared app services (still root-scoped) used by the reader:

- `QuranDataService` → `QURAN_CORPUS_SOURCE`
- `ReadingBookmarkService` → `READING_BOOKMARK_REPOSITORY`
- `DefaultVersePresentationStrategy` → `VERSE_PRESENTATION_STRATEGY`
- `TafsirService`, `UiLocaleService`, `DailyReminderService`, etc.

## Service responsibilities

Services live in domain subfolders under `services/`. See **[`services/README.md`](./services/README.md)** for the full folder map and import examples.

| Folder | Services |
|--------|----------|
| `corpus/` | `ReaderCorpusStateService` |
| `routing/` | `ReaderRouteCoordinatorService`, `ReaderVerseFragmentService` |
| `navigation/` | `ReaderActiveAyahService`, `ReaderScrollStateService`, `ReaderSurahSearchService`, `ReaderSwipeNavigationService` |
| `preferences/` | `ReaderViewPreferencesService` |
| `panels/` | `ReaderPanelCoordinatorService`, `ReaderSurahNavService`, `ReaderTafsirPanelService` |
| `bookmark/` | `ReaderBookmarkUiService` |
| `layout/` | `ReaderLayoutBreakpointsService` |
| `presentation/` | `ReaderVerseActionsService`, `ReaderIntroContentService`, `ReaderDocumentTitleService` |
| `media/` | `ReaderAudioPlaybackService` (Alafasy ayah playback) |

## Shell component role

`SurahReaderComponent` should stay thin:

- **Host** CSS classes driven by `scroll`, `breakpoints`, `tafsir` signals.
- **HostListeners**: `window:scroll`, `window:resize`, `touchstart`/`touchend`, `keydown.escape`.
- **Template bindings**: exposes `protected readonly` service injections (`corpus`, `viewPrefs`, `tafsir`, …).
- **No business rules** that belong in a service (if you add logic, prefer a service + unit test).

## UI components

### `ReaderTafsirPanelComponent`

Standalone panel for tafsir edition picker + rendered blocks. Injects `ReaderTafsirPanelService` (same feature scope). Inputs:

- `verse` — ayah row for retry/edition change
- `editionId` — unique `<select>` id
- `accordion` — collapse secondary blocks on mobile sheet
- `formatUiNum` — locale-aware number formatting

Used inline under verses, in the desktop side column, and in the deferred mobile sheet.

### Planned extractions

These remain in the shell template today; good next splits:

- `ReaderSettingsPanelComponent` + `@defer (when panels.settingsOpen())`
- `ReaderSurahNavPanelComponent` + `@defer (when surahNav.open())`

## Lazy loading (`@defer`)

The mobile tafsir bottom sheet is wrapped in:

```html
@defer (when tafsir.mobileSheetOpen() && tafsir.verseForPanel()) {
  …
}
```

Angular can emit a separate chunk for deferred template dependencies, keeping the initial reader bundle smaller until the user opens tafsir on mobile.

## Adding a new concern

1. **Pick a layer**: model → util → `services/<domain>/` → ui component.
2. **Create an `@Injectable()` service** in the matching subfolder; avoid storing state on the component.
3. **Export** from `services/index.ts` and **register** in `READER_FEATURE_PROVIDERS`.
4. **Inject** in the shell or a child standalone component (children inherit feature providers).
5. **Document** the service in the table above.

### Example: wire recitation audio

Done: `ReaderAudioPlaybackService` plays Alafasy clips, syncs active verse/scroll, supports continuous mode (settings), and is registered in `READER_FEATURE_PROVIDERS`. Mobile bar + per-verse Play/Pause call `audio.toggleActive()` / `audio.playVerse()`.

## Testing notes

- Provide `READER_FEATURE_PROVIDERS` (or a subset) in `TestBed` when testing the shell or tafsir panel.
- Mock `QURAN_CORPUS_SOURCE` / `READING_BOOKMARK_REPOSITORY` at the app level.
- Pure helpers in `utils/` are the easiest to unit test without Angular.

## Related core modules

| Path | Role |
|------|------|
| `core/quran/` | Corpus types, HTTP load, retry |
| `core/bookmark/` | Reading place persistence |
| `core/tafsir/` | Tafsir JSON fetch + cache |
| `core/reader-layout/` | Font / line / width / color theme |
| `core/verse-presentation/` | Copy & share text builders |
| `core/routing/verse-deep-link.util.ts` | `#ayah-N` fragments |
