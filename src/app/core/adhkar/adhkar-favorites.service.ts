import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { AdhkarItem } from './adhkar.types';

const LS_KEY = 'quran-reader-adhkar-favorites';

export interface AdhkarFavoriteEntry {
  readonly itemId: string;
  readonly collectionId: string;
  readonly savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdhkarFavoritesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly favoritesSignal = signal<readonly AdhkarFavoriteEntry[]>([]);

  readonly favorites = this.favoritesSignal.asReadonly();
  readonly favoriteCount = computed(() => this.favoritesSignal().length);
  readonly favoriteItemIds = computed(() => new Set(this.favoritesSignal().map((f) => f.itemId)));

  constructor() {
    this.hydrate();
  }

  isFavorite(itemId: string): boolean {
    return this.favoriteItemIds().has(itemId);
  }

  toggle(item: AdhkarItem, collectionId: string): boolean {
    const current = this.favoritesSignal();
    const exists = current.some((f) => f.itemId === item.id);
    let next: readonly AdhkarFavoriteEntry[];
    let nowFavorite = false;

    if (exists) {
      next = current.filter((f) => f.itemId !== item.id);
      nowFavorite = false;
    } else {
      next = [
        ...current,
        {
          itemId: item.id,
          collectionId,
          savedAt: new Date().toISOString(),
        },
      ];
      nowFavorite = true;
    }

    this.favoritesSignal.set(next);
    this.persist(next);
    return nowFavorite;
  }

  remove(itemId: string): void {
    const next = this.favoritesSignal().filter((f) => f.itemId !== itemId);
    this.favoritesSignal.set(next);
    this.persist(next);
  }

  private hydrate(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.favoritesSignal.set(
          parsed.filter((item) => typeof item?.itemId === 'string' && typeof item?.collectionId === 'string'),
        );
      }
    } catch {
      /* ignore */
    }
  }

  private persist(entries: readonly AdhkarFavoriteEntry[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(entries));
    } catch {
      /* ignore quota */
    }
  }
}
