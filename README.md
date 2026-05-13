# Surah Mulk Reader

A lightweight Angular app for reading Quran with a focused default experience on Surah Al-Mulk (67), including Arabic text, English translation, and Urdu translation in one interface.

## Project Overview

This app is designed for distraction-free recitation and study:

- Opens directly to Surah Al-Mulk by default (`/surah/67`)
- Supports reading any surah from `1` to `114` through route params (`/surah/:n`)
- Shows Arabic + English + Urdu per ayah
- Provides UI localization in English, Arabic, and Urdu
- Tracks active ayah while scrolling and supports quick jump-to-ayah navigation
- Saves reader preferences (font size, line spacing, content width) in `localStorage`

## Tech Stack

- Angular 18 (standalone components + router + HttpClient)
- TypeScript
- SCSS
- Local JSON corpus served from `public/quran-full.json`

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm start
```

Open `http://localhost:4200/`.

### 3) Build for production

```bash
npm run build
```

Build output is generated in `dist/surah-mulk-reader/`.

## Available Scripts

- `npm start` - Run Angular dev server
- `npm run build` - Create production build
- `npm run watch` - Build in watch mode with development configuration
- `npm run build-quran-data` - Rebuild `public/quran-full.json` from source datasets

## Data Pipeline

Quran data is loaded via `QuranDataService` from:

- `public/quran-full.json`

The `build-quran-data` script merges Arabic text, English translation, and Urdu translation into a single payload to keep the app offline-friendly and fast at runtime.

## Localization

UI locale packs live in:

- `src/app/i18n/en.json`
- `src/app/i18n/ar.json`
- `src/app/i18n/ur.json`

`UiLocaleService` also updates document language and direction (`lang` and `dir`) based on selected locale.

## Routing

- `/` redirects to `/surah/67`
- `/surah/:n` renders the reader for the selected surah number
- Unknown routes redirect back to `/surah/67`

## Project Structure (Key Files)

- `src/app/surah-reader/surah-reader.component.ts` - main reader logic and interactions
- `src/app/core/quran-data.service.ts` - data loading service
- `src/app/core/ui-locale.service.ts` - locale state and translation helpers
- `src/app/core/ui-translate.pipe.ts` - template translation pipe
- `src/app/app.routes.ts` - route definitions
- `scripts/build-quran-data.mjs` - corpus build/merge script

## Notes

- The repository currently does not define a test script.
- If you refresh Quran data sources, run `npm run build-quran-data` before building/deploying.

## References

- [Angular Documentation](https://angular.dev/)
- [Angular CLI Command Reference](https://angular.dev/tools/cli)
- [Quran JSON dataset (risan/quran-json)](https://github.com/risan/quran-json)
- [Amiri Quran Font](https://fonts.google.com/specimen/Amiri+Quran)
- [Noto Naskh Arabic Font](https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic)
