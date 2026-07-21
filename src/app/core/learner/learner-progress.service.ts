import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { LearnerLesson } from './learner.types';

const LS_KEY = 'quran-reader-learner-progress';

interface LearnerProgressStore {
  /** Item ids marked as known, keyed by lesson id. */
  readonly known: Readonly<Record<string, readonly string[]>>;
}

function itemSetKey(lessonId: string): string {
  return lessonId;
}

@Injectable({ providedIn: 'root' })
export class LearnerProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storeSignal = signal<LearnerProgressStore>({ known: {} });

  readonly store = this.storeSignal.asReadonly();

  /** Reactive snapshot for templates. */
  readonly progressSnapshot = computed(() => this.storeSignal());

  constructor() {
    this.hydrate();
  }

  knownIds(lessonId: string): ReadonlySet<string> {
    const list = this.storeSignal().known[itemSetKey(lessonId)] ?? [];
    return new Set(list);
  }

  isKnown(lessonId: string, itemId: string): boolean {
    return this.knownIds(lessonId).has(itemId);
  }

  lessonProgress(lesson: LearnerLesson): {
    known: number;
    total: number;
    percent: number;
  } {
    const total = lesson.items.length;
    const known = lesson.items.filter((item) => this.isKnown(lesson.id, item.id)).length;
    const percent = total > 0 ? Math.round((known / total) * 100) : 0;
    return { known, total, percent };
  }

  markKnown(lessonId: string, itemId: string): void {
    const current = this.knownIds(lessonId);
    if (current.has(itemId)) {
      return;
    }
    const next = [...current, itemId];
    this.writeKnown(lessonId, next);
  }

  markLearning(lessonId: string, itemId: string): void {
    const current = this.knownIds(lessonId);
    if (!current.has(itemId)) {
      return;
    }
    const next = [...current].filter((id) => id !== itemId);
    this.writeKnown(lessonId, next);
  }

  toggleKnown(lessonId: string, itemId: string): boolean {
    if (this.isKnown(lessonId, itemId)) {
      this.markLearning(lessonId, itemId);
      return false;
    }
    this.markKnown(lessonId, itemId);
    return true;
  }

  resetLesson(lessonId: string): void {
    this.writeKnown(lessonId, []);
  }

  private writeKnown(lessonId: string, ids: readonly string[]): void {
    const known = { ...this.storeSignal().known };
    if (ids.length === 0) {
      delete known[itemSetKey(lessonId)];
    } else {
      known[itemSetKey(lessonId)] = ids;
    }
    this.storeSignal.set({ known });
    this.persist();
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
      const parsed = JSON.parse(raw) as LearnerProgressStore;
      if (!parsed || typeof parsed !== 'object' || !parsed.known) {
        return;
      }
      this.storeSignal.set({ known: parsed.known });
    } catch {
      // ignore corrupt storage
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.storeSignal()));
    } catch {
      // quota / private mode
    }
  }
}
