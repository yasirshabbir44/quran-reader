/** Canonical verse reference used in theme–verse mappings. */
export interface ThematicVerseRef {
  readonly surah: number;
  readonly ayah: number;
}

/** Broader grouping for themes in the directory explorer. */
export interface ThematicCategory {
  readonly id: string;
  readonly name: string;
  readonly sortOrder: number;
}

/** Life topic shown in the themes directory. */
export interface ThematicTheme {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly icon?: string;
  readonly description?: string;
  /** Denormalized count of unique verses linked to this theme (set at build time). */
  readonly verseCount: number;
}

/** Many-to-many link: one theme, one verse; a verse may appear under multiple themes. */
export interface ThematicVerseMapping {
  readonly themeId: string;
  readonly surah: number;
  readonly ayah: number;
}

/** Runtime payload served from `/thematic-index.json`. */
export interface ThematicIndexPayload {
  readonly version: number;
  readonly categories: readonly ThematicCategory[];
  readonly themes: readonly ThematicTheme[];
  readonly mappings: readonly ThematicVerseMapping[];
}

/** Authoring format in `thematic-index.seed.json` (verse counts are computed by the build script). */
export interface ThematicIndexSeed {
  readonly version: number;
  readonly categories: readonly Omit<ThematicCategory, never>[];
  readonly themes: readonly ThematicThemeSeed[];
  readonly mappings: readonly ThematicVerseMapping[];
}

export interface ThematicThemeSeed {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly icon?: string;
  readonly description?: string;
}
