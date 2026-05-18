import { Injectable, computed, inject, signal } from '@angular/core';
import type { MushafIndexPayload } from '../../../core/mushaf/mushaf-index.types';

export type MushafNavKind = 'page' | 'juz';

@Injectable()
export class ReaderMushafNavService {
  readonly open = signal(false);
  readonly kind = signal<MushafNavKind>('page');
  readonly query = signal('');

  private readonly index = signal<MushafIndexPayload | null>(null);

  readonly filteredPages = computed(() => {
    const idx = this.index();
    if (!idx) {
      return [] as readonly MushafIndexPayload['pages'][number][];
    }
    const raw = this.query().trim();
    if (!raw) {
      return idx.pages;
    }
    const needle = raw.toLowerCase();
    return idx.pages.filter((p) => {
      const start = p.start;
      return (
        String(p.page).includes(needle) ||
        String(p.juz).includes(needle) ||
        String(start.surah).includes(needle) ||
        `${start.surah}:${start.ayah}`.includes(needle)
      );
    });
  });

  readonly filteredJuz = computed(() => {
    const idx = this.index();
    if (!idx) {
      return [] as readonly MushafIndexPayload['juz'][number][];
    }
    const raw = this.query().trim();
    if (!raw) {
      return idx.juz;
    }
    const needle = raw.toLowerCase();
    return idx.juz.filter((j) => {
      const start = j.start;
      return (
        String(j.juz).includes(needle) ||
        String(j.page).includes(needle) ||
        String(start.surah).includes(needle) ||
        `${start.surah}:${start.ayah}`.includes(needle)
      );
    });
  });

  setIndex(payload: MushafIndexPayload | null): void {
    this.index.set(payload);
  }

  toggle(kind: MushafNavKind): void {
    if (this.open() && this.kind() === kind) {
      this.close();
      return;
    }
    this.kind.set(kind);
    this.open.set(true);
    this.query.set('');
  }

  openPanel(kind: MushafNavKind): void {
    this.kind.set(kind);
    this.open.set(true);
    this.query.set('');
  }

  close(): void {
    this.open.set(false);
    this.query.set('');
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  clearQuery(): void {
    this.query.set('');
  }
}
