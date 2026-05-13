import { InjectionToken } from '@angular/core';

export type ReadingBookmark = { readonly surah: number; readonly ayah: number };

/**
 * Repository + Interface Segregation: bookmark persistence without exposing storage keys.
 */
export interface ReadingBookmarkRepository {
  read(): ReadingBookmark | null;
  scheduleSave(surah: number, ayah: number, onPersisted?: () => void): void;
  flushPending(surah: number, ayah: number): void;
  saveNow(surah: number, ayah: number): void;
}

export const READING_BOOKMARK_REPOSITORY = new InjectionToken<ReadingBookmarkRepository>(
  'READING_BOOKMARK_REPOSITORY',
);
