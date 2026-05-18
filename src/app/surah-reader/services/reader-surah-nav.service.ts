import { Injectable, computed, inject, signal } from '@angular/core';
import { filterSurahNavItems } from '../utils/surah-nav-filter.util';
import { ReaderCorpusStateService } from './reader-corpus-state.service';

@Injectable()
export class ReaderSurahNavService {
  private readonly corpus = inject(ReaderCorpusStateService);

  readonly open = signal(false);
  readonly query = signal('');

  readonly filteredList = computed(() =>
    filterSurahNavItems(this.corpus.surahList(), this.query()),
  );

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.query.set('');
  }

  openPanel(): void {
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
