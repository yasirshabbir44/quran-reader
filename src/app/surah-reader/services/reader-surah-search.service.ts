import { Injectable, computed, inject, signal } from '@angular/core';
import {
  normalizeVerseTranslations,
  normalizeVerseTransliteration,
} from '../../core/verse-presentation/verse-presentation.strategy';
import { ReaderCorpusStateService } from './reader-corpus-state.service';

@Injectable()
export class ReaderSurahSearchService {
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly query = signal('');
  readonly matchIndex = signal(-1);

  readonly matches = computed(() => {
    const s = this.corpus.surah();
    const raw = this.query().trim().normalize('NFKC');
    if (!s || !raw) {
      return [] as readonly number[];
    }
    const needle = raw.toLowerCase();
    const hits: number[] = [];
    for (const v of s.verses) {
      const tr = normalizeVerseTranslations(v);
      const translit = normalizeVerseTransliteration(v);
      const haystack = `${v.ar}\n${translit}\n${tr.en}\n${tr.ur}`.normalize('NFKC').toLowerCase();
      if (haystack.includes(needle)) {
        hits.push(v.ayah);
      }
    }
    return hits;
  });

  readonly matchSet = computed(() => new Set(this.matches()));

  setQuery(value: string): void {
    this.query.set(value);
    this.matchIndex.set(-1);
  }

  clear(): void {
    this.query.set('');
    this.matchIndex.set(-1);
  }

  resetOnSurahChange(): void {
    this.clear();
  }

  nextMatch(): number | null {
    const m = this.matches();
    if (!m.length) {
      return null;
    }
    const i = (this.matchIndex() + 1 + m.length) % m.length;
    this.matchIndex.set(i);
    return m[i]!;
  }

  prevMatch(): number | null {
    const m = this.matches();
    if (!m.length) {
      return null;
    }
    const cur = this.matchIndex();
    const i = cur < 0 ? m.length - 1 : (cur - 1 + m.length) % m.length;
    this.matchIndex.set(i);
    return m[i]!;
  }

  isHit(ayah: number): boolean {
    return this.matchSet().has(ayah);
  }

  isActive(ayah: number): boolean {
    const m = this.matches();
    const i = this.matchIndex();
    if (i < 0 || i >= m.length) {
      return false;
    }
    return m[i] === ayah;
  }
}
