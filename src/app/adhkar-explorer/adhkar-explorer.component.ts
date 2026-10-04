import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdhkarAudioService } from '../core/adhkar/adhkar-audio.service';
import { AdhkarFavoritesService } from '../core/adhkar/adhkar-favorites.service';
import {
  AdhkarProgressService,
  suggestedAdhkarCollectionId,
} from '../core/adhkar/adhkar-progress.service';
import { AdhkarService } from '../core/adhkar/adhkar.service';
import type { AdhkarCollection, AdhkarItem, AdhkarSearchResult } from '../core/adhkar/adhkar.types';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

const COLLECTION_ICONS: Record<string, string> = {
  sun: '☀️',
  sunset: '🌇',
  moon: '🌙',
  prayer: '🕌',
  book: '📖',
  heart: '💚',
  shield: '🛡️',
  sparkle: '✨',
  hands: '🤲',
};

export interface AdhkarCategoryFilter {
  readonly id: string;
  readonly labelKey: string;
  readonly icon: string;
}

const CATEGORY_FILTERS: readonly AdhkarCategoryFilter[] = [
  { id: 'all', labelKey: 'adhkarFilterAll', icon: '✨' },
  { id: 'time', labelKey: 'adhkarFilterTime', icon: '🌅' },
  { id: 'salah', labelKey: 'adhkarFilterSalah', icon: '🕌' },
  { id: 'quran', labelKey: 'adhkarFilterQuran', icon: '📖' },
  { id: 'daily', labelKey: 'adhkarFilterDaily', icon: '💚' },
  { id: 'protection', labelKey: 'adhkarFilterProtection', icon: '🛡️' },
  { id: 'praise', labelKey: 'adhkarFilterPraise', icon: '📿' },
  { id: 'favorites', labelKey: 'adhkarFilterFavorites', icon: '⭐' },
];

@Component({
  selector: 'app-adhkar-explorer',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './adhkar-explorer.component.html',
  styleUrl: './adhkar-explorer.component.scss',
})
export class AdhkarExplorerComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly adhkar = inject(AdhkarService);
  protected readonly progress = inject(AdhkarProgressService);
  protected readonly favorites = inject(AdhkarFavoritesService);
  protected readonly audio = inject(AdhkarAudioService);
  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly collections = signal<readonly AdhkarCollection[]>([]);
  protected readonly suggestedId = signal(suggestedAdhkarCollectionId());

  // Search & Filter State
  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<string>('all');
  protected readonly categoryFilters = CATEGORY_FILTERS;

  protected readonly totalItems = computed(() =>
    this.collections().reduce((sum, c) => sum + c.itemCount, 0),
  );

  protected readonly totalCompletedToday = computed(() => {
    this.progress.progressSnapshot();
    let total = 0;
    for (const col of this.collections()) {
      total += this.progress.collectionProgress(col).completed;
    }
    return total;
  });

  protected readonly suggestedCollection = computed(() => {
    const id = this.suggestedId();
    return this.collections().find((c) => c.id === id) ?? null;
  });

  // Filtered collections based on category
  protected readonly filteredCollections = computed(() => {
    const cat = this.selectedCategory();
    const all = this.collections();
    if (cat === 'all') {
      return all;
    }
    if (cat === 'favorites') {
      return [];
    }
    return all.filter((c) => c.category === cat);
  });

  // Favorite items resolved with collection metadata
  protected readonly favoriteItemsWithMeta = computed(() => {
    const favs = this.favorites.favorites();
    const cols = this.collections();
    const results: Array<{ item: AdhkarItem; collection: AdhkarCollection; itemIndex: number }> = [];

    for (const fav of favs) {
      const col = cols.find((c) => c.id === fav.collectionId);
      if (!col) continue;
      const idx = col.items.findIndex((i) => i.id === fav.itemId);
      if (idx !== -1) {
        results.push({ item: col.items[idx], collection: col, itemIndex: idx + 1 });
      }
    }
    return results;
  });

  // Instant reactive search results
  protected readonly searchResults = computed<readonly AdhkarSearchResult[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query || query.length < 2) {
      return [];
    }
    const cols = this.collections();
    const results: AdhkarSearchResult[] = [];

    for (const col of cols) {
      for (const item of col.items) {
        const ar = item.arabic.toLowerCase();
        const translit = (item.transliteration ?? '').toLowerCase();
        const en = item.translation.en.toLowerCase();
        const ur = item.translation.ur.toLowerCase();
        const src = (item.source ?? '').toLowerCase();
        const benefitEn = (item.benefit?.en ?? '').toLowerCase();
        const benefitUr = (item.benefit?.ur ?? '').toLowerCase();

        let matchField: AdhkarSearchResult['matchField'] | null = null;
        if (ar.includes(query)) {
          matchField = 'arabic';
        } else if (translit.includes(query)) {
          matchField = 'transliteration';
        } else if (en.includes(query) || ur.includes(query) || benefitEn.includes(query) || benefitUr.includes(query)) {
          matchField = 'translation';
        } else if (src.includes(query)) {
          matchField = 'source';
        }

        if (matchField) {
          results.push({
            item,
            collectionId: col.id,
            collectionTitle: col.title,
            collectionIcon: col.icon,
            matchField,
          });
        }
      }
    }
    return results;
  });

  ngOnInit(): void {
    this.progress.syncDay();
    this.syncSeo();
    this.adhkar
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        this.loading.set(false);
        if (!payload) {
          this.loadError.set(true);
          return;
        }
        this.collections.set(payload.collections);
      });
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    this.syncSeo();
  }

  protected setCategory(catId: string): void {
    this.selectedCategory.set(catId);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected collectionIcon(icon: string): string {
    return COLLECTION_ICONS[icon] ?? '🤲';
  }

  protected collectionProgressLabel(collection: AdhkarCollection): string | null {
    this.progress.progressSnapshot();
    const p = this.progress.collectionProgress(collection);
    if (p.completed <= 0) {
      return null;
    }
    if (p.completed === p.total) {
      return this.ui.translate('adhkarCardComplete');
    }
    return this.ui.translate('adhkarCardProgress', {
      done: this.formatUiNum(p.completed),
      total: this.formatUiNum(p.total),
    });
  }

  protected collectionProgressPercent(collection: AdhkarCollection): number {
    this.progress.progressSnapshot();
    return this.progress.collectionProgress(collection).percent;
  }

  protected isSuggested(id: string): boolean {
    return this.suggestedId() === id;
  }

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.adhkar.retryLoad();
  }

  protected playItemAudio(item: AdhkarItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.audio.play(item.id, item.arabic);
  }

  protected toggleFavorite(item: AdhkarItem, collectionId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(item, collectionId);
  }

  private syncSeo(): void {
    const origin = this.seo.siteOrigin();
    this.seo.apply({
      title: this.ui.translate('adhkarDocumentTitle'),
      description: this.ui.translate('seoAdhkarDescription'),
      path: '/adhkar',
      jsonLd: collectionPageJsonLd({
        origin,
        path: '/adhkar',
        name: this.ui.translate('adhkarTitle'),
        description: this.ui.translate('seoAdhkarDescription'),
      }),
    });
  }
}
