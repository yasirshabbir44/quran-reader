import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { AdhkarService } from '../core/adhkar/adhkar.service';
import type { AdhkarCollection, AdhkarItem } from '../core/adhkar/adhkar.types';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

@Component({
  selector: 'app-adhkar-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './adhkar-detail.component.html',
  styleUrl: './adhkar-detail.component.scss',
})
export class AdhkarDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly adhkar = inject(AdhkarService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly collection = signal<AdhkarCollection | null>(null);
  protected readonly relatedCollections = signal<readonly AdhkarCollection[]>([]);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.loadError.set(false);
          this.notFound.set(false);
          this.relatedCollections.set([]);
          return combineLatest([this.adhkar.load(), this.adhkar.getCollection(id)]).pipe(
            map(([index, data]) => ({ id, index, data })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, index, data }) => {
        if (!index) {
          this.loading.set(false);
          this.loadError.set(true);
          return;
        }
        const exists = index.collections.some((c) => c.id === id);
        if (!exists) {
          this.loading.set(false);
          this.notFound.set(true);
          this.syncNotFoundSeo();
          return;
        }
        if (!data) {
          return;
        }
        this.loading.set(false);
        this.collection.set(data);
        this.syncCollectionSeo(data);
        this.loadRelated(data.id);
      });
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    const data = this.collection();
    if (data) {
      this.syncCollectionSeo(data);
    }
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected itemTranslation(item: AdhkarItem): string {
    return this.adhkar.pickLocalized(item.translation);
  }

  protected retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    this.loadError.set(false);
    this.adhkar.retryLoad();
    this.adhkar.getCollection(id).subscribe((data) => {
      this.loading.set(false);
      if (!data) {
        this.notFound.set(true);
        this.syncNotFoundSeo();
        return;
      }
      this.collection.set(data);
      this.notFound.set(false);
      this.syncCollectionSeo(data);
      this.loadRelated(data.id);
    });
  }

  private loadRelated(id: string): void {
    this.adhkar
      .getRelatedCollections(id, 2)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((collections) => this.relatedCollections.set(collections));
  }

  private syncCollectionSeo(data: AdhkarCollection): void {
    const title = this.adhkar.pickLocalized(data.title);
    const description = this.adhkar.pickLocalized(data.description);
    const path = `/adhkar/${data.id}`;
    const origin = this.seo.siteOrigin();
    this.seo.apply({
      title: this.ui.translate('adhkarDetailDocumentTitle', { title }),
      description,
      path,
      type: 'article',
      jsonLd: collectionPageJsonLd({
        origin,
        path,
        name: title,
        description,
      }),
    });
  }

  private syncNotFoundSeo(): void {
    this.seo.apply({
      title: this.ui.translate('adhkarNotFoundTitle'),
      description: this.ui.translate('seoNotFoundDescription'),
      path: `/adhkar/${this.route.snapshot.paramMap.get('id') ?? ''}`,
      noindex: true,
    });
  }
}
