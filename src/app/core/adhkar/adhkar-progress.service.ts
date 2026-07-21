import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { AdhkarCollection, AdhkarItem } from './adhkar.types';

const LS_KEY = 'quran-reader-adhkar-progress';

interface AdhkarProgressStore {
  readonly date: string;
  readonly counts: Readonly<Record<string, number>>;
}

function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function itemKey(collectionId: string, itemId: string): string {
  return `${collectionId}:${itemId}`;
}

function targetRepeats(item: AdhkarItem): number {
  const n = item.repeat ?? 1;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

/**
 * Suggest morning / evening / night from local clock.
 * Morning: after Fajr window; evening: post-Asr; night: Maghrib onward.
 */
export function suggestedAdhkarCollectionId(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 4 && hour < 12) {
    return 'morning';
  }
  // Post-Asr window (approx. 15:00–18:00); midday keeps morning suggestion.
  if (hour >= 15 && hour < 18) {
    return 'evening';
  }
  if (hour >= 18 || hour < 4) {
    return 'night';
  }
  return 'morning';
}

@Injectable({ providedIn: 'root' })
export class AdhkarProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storeSignal = signal<AdhkarProgressStore>({
    date: localDateKey(),
    counts: {},
  });

  readonly store = this.storeSignal.asReadonly();

  /** Reactive snapshot for templates. */
  readonly progressSnapshot = computed(() => this.storeSignal());

  constructor() {
    this.hydrate();
  }

  /** Call from component init / user actions — never from computed/template getters. */
  syncDay(): void {
    const today = localDateKey();
    if (this.storeSignal().date === today) {
      return;
    }
    this.storeSignal.set({ date: today, counts: {} });
    this.persist();
  }

  count(collectionId: string, itemId: string): number {
    const store = this.activeStore();
    return store.counts[itemKey(collectionId, itemId)] ?? 0;
  }

  target(item: AdhkarItem): number {
    return targetRepeats(item);
  }

  isItemComplete(collectionId: string, item: AdhkarItem): boolean {
    return this.count(collectionId, item.id) >= targetRepeats(item);
  }

  collectionProgress(collection: AdhkarCollection): {
    completed: number;
    total: number;
    percent: number;
  } {
    const total = collection.items.length;
    let completed = 0;
    for (const item of collection.items) {
      if (this.isItemComplete(collection.id, item)) {
        completed += 1;
      }
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  /** Increment by 1 (capped at target). Returns the new count. */
  tap(collectionId: string, item: AdhkarItem): number {
    this.syncDay();
    const key = itemKey(collectionId, item.id);
    const max = targetRepeats(item);
    const current = this.storeSignal().counts[key] ?? 0;
    if (current >= max) {
      return current;
    }
    const next = current + 1;
    this.writeCounts({ ...this.storeSignal().counts, [key]: next });
    return next;
  }

  resetCollection(collectionId: string, items: readonly AdhkarItem[]): void {
    this.syncDay();
    const next = { ...this.storeSignal().counts };
    for (const item of items) {
      delete next[itemKey(collectionId, item.id)];
    }
    this.writeCounts(next);
  }

  resetItem(collectionId: string, itemId: string): void {
    this.syncDay();
    const next = { ...this.storeSignal().counts };
    delete next[itemKey(collectionId, itemId)];
    this.writeCounts(next);
  }

  /** Pure read: treat stale-day store as empty without writing. */
  private activeStore(): AdhkarProgressStore {
    const store = this.storeSignal();
    const today = localDateKey();
    if (store.date === today) {
      return store;
    }
    return { date: today, counts: {} };
  }

  private hydrate(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AdhkarProgressStore>;
      const date = typeof parsed.date === 'string' ? parsed.date : localDateKey();
      const counts =
        parsed.counts && typeof parsed.counts === 'object' && !Array.isArray(parsed.counts)
          ? (parsed.counts as Record<string, number>)
          : {};
      const today = localDateKey();
      if (date !== today) {
        this.storeSignal.set({ date: today, counts: {} });
        this.persist();
        return;
      }
      this.storeSignal.set({ date, counts: this.sanitizeCounts(counts) });
    } catch {
      /* ignore corrupt storage */
    }
  }

  private writeCounts(counts: Record<string, number>): void {
    this.storeSignal.set({ date: localDateKey(), counts });
    this.persist();
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.storeSignal()));
    } catch {
      /* private mode / quota */
    }
  }

  private sanitizeCounts(raw: Record<string, number>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(raw)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        out[key] = Math.floor(n);
      }
    }
    return out;
  }
}
