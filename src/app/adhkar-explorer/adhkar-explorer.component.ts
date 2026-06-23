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
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { AdhkarService } from '../core/adhkar/adhkar.service';
import type { AdhkarCollection } from '../core/adhkar/adhkar.types';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

const COLLECTION_ICONS: Record<string, string> = {
  sun: '☀️',
  sunset: '🌇',
  moon: '🌙',
  hands: '🤲',
};

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

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly collections = signal<readonly AdhkarCollection[]>([]);

  protected readonly totalItems = computed(() =>
    this.collections().reduce((sum, c) => sum + c.itemCount, 0),
  );

  ngOnInit(): void {
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

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected collectionIcon(icon: string): string {
    return COLLECTION_ICONS[icon] ?? '🤲';
  }

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.adhkar.retryLoad();
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
