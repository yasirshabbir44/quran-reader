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
import {
  ThematicIndexService,
  type ThematicCategoryGroup,
  type ThematicThemeListItem,
} from '../core/thematic-index/thematic-index.service';
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
};

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

  protected readonly filteredGroups = computed(() => {
    const raw = this.searchQuery().trim().normalize('NFKC').toLowerCase();
    const source = this.groups();
    if (!raw) {
      return source;
    }
    return source
      .map((g) => ({
        category: g.category,
        themes: g.themes.filter((t) => this.themeMatchesQuery(t, raw)),
      }))
      .filter((g) => g.themes.length > 0);
  });

  protected readonly totalThemes = computed(() =>
    this.groups().reduce((n, g) => n + g.themes.length, 0),
  );

  protected readonly shownThemes = computed(() =>
    this.filteredGroups().reduce((n, g) => n + g.themes.length, 0),
  );

  ngOnInit(): void {
    this.title.setTitle(this.ui.translate('themesDocumentTitle'));
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

  protected themeIcon(theme: ThematicThemeListItem): string {
    return theme.icon ? (THEME_ICONS[theme.icon] ?? '✦') : '✦';
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
