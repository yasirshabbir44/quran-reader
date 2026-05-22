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
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { verseFragment } from '../core/routing/verse-deep-link.util';
import {
  ThematicIndexService,
  type DailyThemeInspiration,
  type ThematicCategoryGroup,
  type ThematicThemeListItem,
} from '../core/thematic-index/thematic-index.service';
import type { ThematicTheme } from '../core/thematic-index/thematic-index.types';
import { normalizeVerseTranslations } from '../core/verse-presentation/verse-presentation.strategy';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

const THEME_ICONS: Record<string, string> = {
  hourglass: '⏳',
  heart: '💚',
  handshake: '🤝',
  dove: '🕊️',
  seed: '🌱',
  prayer: '🕌',
  droplet: '💧',
  sparkles: '✨',
  scroll: '📜',
  scales: '⚖️',
  gift: '🎁',
  gavel: '⚖️',
  parents: '👨‍👩‍👧',
  rings: '💍',
  house: '🏠',
  sun: '☀️',
  star: '⭐',
  book: '📖',
  shield: '🛡️',
  hands: '🤲',
  flame: '🔥',
  moon: '🌙',
  'open-book': '📗',
  'hands-pray': '🙏',
  leaf: '🍃',
  ribbon: '🎗️',
  cup: '☕',
  child: '👶',
  wheat: '🌾',
  healing: '💚',
  garden: '🌴',
};

export type ThemesSortMode = 'name' | 'verses';
export type ThemesViewMode = 'grid' | 'list';

const FEATURED_COUNT = 6;

@Component({
  selector: 'app-themes-explorer',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './themes-explorer.component.html',
  styleUrl: './themes-explorer.component.scss',
})
export class ThemesExplorerComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly thematicIndex = inject(ThematicIndexService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly groups = signal<readonly ThematicCategoryGroup[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly categoryFilter = signal<string>('all');
  protected readonly sortMode = signal<ThemesSortMode>('name');
  protected readonly viewMode = signal<ThemesViewMode>('grid');
  protected readonly dailyTopic = signal<DailyThemeInspiration | null>(null);

  protected readonly allThemes = computed(() =>
    this.groups().flatMap((g) => g.themes),
  );

  protected readonly categoryCount = computed(() => this.groups().length);

  protected readonly totalVerses = computed(() =>
    this.allThemes().reduce((n, t) => n + t.verseCount, 0),
  );

  protected readonly maxVerseCount = computed(() => {
    const counts = this.allThemes().map((t) => t.verseCount);
    return counts.length > 0 ? Math.max(...counts) : 1;
  });

  protected readonly featuredThemes = computed(() =>
    [...this.allThemes()]
      .sort((a, b) => b.verseCount - a.verseCount || a.name.localeCompare(b.name))
      .slice(0, FEATURED_COUNT),
  );

  protected readonly categoryChips = computed(() =>
    this.groups().map((g) => ({
      id: g.category.id,
      name: g.category.name,
      count: g.themes.length,
    })),
  );

  protected readonly filteredGroups = computed(() => {
    const raw = this.searchQuery().trim().normalize('NFKC').toLowerCase();
    const cat = this.categoryFilter();
    const sort = this.sortMode();
    let source = this.groups();

    if (cat !== 'all') {
      source = source.filter((g) => g.category.id === cat);
    }

    const mapped = source
      .map((g) => ({
        category: g.category,
        themes: g.themes
          .filter((t) => !raw || this.themeMatchesQuery(t, raw))
          .sort((a, b) => this.compareThemes(a, b, sort)),
      }))
      .filter((g) => g.themes.length > 0);

    return mapped;
  });

  protected readonly totalThemes = computed(() =>
    this.groups().reduce((n, g) => n + g.themes.length, 0),
  );

  protected readonly shownThemes = computed(() =>
    this.filteredGroups().reduce((n, g) => n + g.themes.length, 0),
  );

  protected readonly hasActiveFilters = computed(
    () => this.categoryFilter() !== 'all' || this.searchQuery().trim().length > 0,
  );

  ngOnInit(): void {
    this.title.setTitle(this.ui.translate('themesDocumentTitle'));

    this.thematicIndex
      .getDailyInspiration()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((inspiration) => {
        this.dailyTopic.set(inspiration);
      });

    this.thematicIndex
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (!payload) {
          this.loading.set(false);
          this.loadError.set(true);
          return;
        }
        this.thematicIndex
          .getThemesByCategory()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((groups) => {
            this.groups.set(groups);
            this.loading.set(false);
            this.loadError.set(groups.length === 0);
          });
      });
  }

  protected onLocaleChange(code: UiLocaleCode): void {
    this.ui.setLocale(code);
    this.title.setTitle(this.ui.translate('themesDocumentTitle'));
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected themeIcon(theme: ThematicTheme | ThematicThemeListItem): string {
    return theme.icon ? (THEME_ICONS[theme.icon] ?? '✦') : '✦';
  }

  protected verseBarPercent(theme: ThematicThemeListItem): number {
    return Math.round((theme.verseCount / this.maxVerseCount()) * 100);
  }

  protected setCategoryFilter(id: string): void {
    this.categoryFilter.set(id);
  }

  protected setSortMode(mode: ThemesSortMode): void {
    this.sortMode.set(mode);
  }

  protected setViewMode(mode: ThemesViewMode): void {
    this.viewMode.set(mode);
  }

  protected clearFilters(): void {
    this.categoryFilter.set('all');
    this.searchQuery.set('');
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected verseLink(surah: number, ayah: number): readonly (string | number)[] {
    return ['/', surah];
  }

  protected verseFragment(ayah: number): string {
    return verseFragment(ayah);
  }

  protected dailyTopicTranslation(inspiration: DailyThemeInspiration): string {
    const tr = normalizeVerseTranslations(inspiration.verse.verse);
    return this.ui.locale() === 'ur' ? tr.ur : tr.en;
  }

  protected dailyVerseRef(inspiration: DailyThemeInspiration): string {
    const v = inspiration.verse;
    return `${v.surahNameTranslit} ${this.formatUiNum(v.surah)}:${this.formatUiNum(v.ayah)}`;
  }

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.thematicIndex.retryLoad();
    this.thematicIndex.getThemesByCategory().subscribe((groups) => {
      this.groups.set(groups);
      this.loading.set(false);
      this.loadError.set(groups.length === 0);
    });
  }

  private compareThemes(
    a: ThematicThemeListItem,
    b: ThematicThemeListItem,
    sort: ThemesSortMode,
  ): number {
    if (sort === 'verses') {
      return b.verseCount - a.verseCount || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  }

  private themeMatchesQuery(t: ThematicThemeListItem, needle: string): boolean {
    if (t.name.toLowerCase().includes(needle)) {
      return true;
    }
    if (t.categoryName.toLowerCase().includes(needle)) {
      return true;
    }
    if (t.description?.toLowerCase().includes(needle)) {
      return true;
    }
    return false;
  }
}
