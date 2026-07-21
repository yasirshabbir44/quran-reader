import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  buildGlobalSearchResults,
  type GlobalSearchResult,
} from '../../search/global-search.util';
import type { ThematicThemeListItem } from '../../thematic-index/thematic-index.service';
import { UiLocaleService } from '../ui-locale.service';
import { UiTranslatePipe } from '../ui-translate.pipe';
import type { SurahNavItem } from '../../../surah-reader/models/surah-nav-item.model';

@Component({
  selector: 'app-global-search',
  imports: [FormsModule, RouterLink, UiTranslatePipe],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly ui = inject(UiLocaleService);

  readonly surahs = input.required<readonly SurahNavItem[]>();
  readonly themes = input.required<readonly ThematicThemeListItem[]>();
  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly results = computed(() => {
    this.ui.locale();
    return buildGlobalSearchResults(this.query(), this.surahs(), this.themes(), this.ui.locale());
  });

  protected readonly hasQuery = computed(() => this.query().trim().length > 0);

  protected readonly surahResults = computed(() =>
    this.results().filter((r) => r.kind === 'surah'),
  );

  protected readonly themeResults = computed(() =>
    this.results().filter((r) => r.kind === 'theme'),
  );

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.open.set(value.trim().length > 0);
    this.activeIndex.set(-1);
  }

  protected onFocus(): void {
    if (this.hasQuery()) {
      this.open.set(true);
    }
  }

  protected onBlur(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.setTimeout(() => this.open.set(false), 150);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const list = this.results();
    if (!this.open() || list.length === 0) {
      if (event.key === 'Enter' && this.hasQuery()) {
        event.preventDefault();
        const first = list[0];
        if (first) {
          void this.navigateTo(first);
        }
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => (i + 1) % list.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => (i <= 0 ? list.length - 1 : i - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      const target = idx >= 0 ? list[idx] : list[0];
      if (target) {
        void this.navigateTo(target);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.open.set(false);
      this.activeIndex.set(-1);
    }
  }

  protected isActive(result: GlobalSearchResult): boolean {
    const idx = this.activeIndex();
    return idx >= 0 && this.results()[idx] === result;
  }

  protected async navigateTo(result: GlobalSearchResult): Promise<void> {
    this.open.set(false);
    this.query.set('');
    this.activeIndex.set(-1);
    await this.router.navigate(result.routerLink);
  }

}
