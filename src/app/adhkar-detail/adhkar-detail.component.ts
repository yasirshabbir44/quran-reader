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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { AdhkarProgressService } from '../core/adhkar/adhkar-progress.service';
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
  protected readonly progress = inject(AdhkarProgressService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly collection = signal<AdhkarCollection | null>(null);
  protected readonly relatedCollections = signal<readonly AdhkarCollection[]>([]);
  protected readonly copiedItemId = signal<string | null>(null);
  protected readonly pulseItemId = signal<string | null>(null);

  protected readonly collectionProgress = computed(() => {
    const group = this.collection();
    this.progress.progressSnapshot();
    if (!group) {
      return { completed: 0, total: 0, percent: 0 };
    }
    return this.progress.collectionProgress(group);
  });

  protected readonly allComplete = computed(() => {
    const p = this.collectionProgress();
    return p.total > 0 && p.completed === p.total;
  });

  ngOnInit(): void {
    this.progress.syncDay();
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.loadError.set(false);
          this.notFound.set(false);
          this.relatedCollections.set([]);
          this.copiedItemId.set(null);
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

  protected itemCount(item: AdhkarItem): number {
    const group = this.collection();
    this.progress.progressSnapshot();
    if (!group) {
      return 0;
    }
    return this.progress.count(group.id, item.id);
  }

  protected itemTarget(item: AdhkarItem): number {
    return this.progress.target(item);
  }

  protected itemComplete(item: AdhkarItem): boolean {
    const group = this.collection();
    this.progress.progressSnapshot();
    if (!group) {
      return false;
    }
    return this.progress.isItemComplete(group.id, item);
  }

  protected itemPercent(item: AdhkarItem): number {
    const target = this.itemTarget(item);
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.itemCount(item) / target) * 100));
  }

  protected onTapCount(item: AdhkarItem): void {
    const group = this.collection();
    if (!group || this.itemComplete(item)) {
      return;
    }
    this.progress.tap(group.id, item);
    this.pulseItemId.set(item.id);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (this.pulseItemId() === item.id) {
          this.pulseItemId.set(null);
        }
      }, 280);
    }
    if (this.progress.isItemComplete(group.id, item)) {
      this.scrollToNextIncomplete(group, item.id);
    }
  }

  protected resetProgress(): void {
    const group = this.collection();
    if (!group) {
      return;
    }
    this.progress.resetCollection(group.id, group.items);
  }

  protected async copyArabic(item: AdhkarItem): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(item.arabic);
      this.copiedItemId.set(item.id);
      window.setTimeout(() => {
        if (this.copiedItemId() === item.id) {
          this.copiedItemId.set(null);
        }
      }, 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  protected retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    this.loadError.set(false);
    this.notFound.set(false);
    this.adhkar.retryLoad();
    this.adhkar
      .load()
      .pipe(
        switchMap((index) => {
          if (!index) {
            return of({ kind: 'error' as const });
          }
          const exists = index.collections.some((c) => c.id === id);
          if (!exists) {
            return of({ kind: 'missing' as const });
          }
          return this.adhkar.getCollection(id).pipe(
            map((data) =>
              data ? ({ kind: 'ok' as const, data }) : ({ kind: 'error' as const }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result.kind === 'error') {
          this.loadError.set(true);
          return;
        }
        if (result.kind === 'missing') {
          this.notFound.set(true);
          this.syncNotFoundSeo();
          return;
        }
        this.collection.set(result.data);
        this.syncCollectionSeo(result.data);
        this.loadRelated(result.data.id);
      });
  }

  private scrollToNextIncomplete(group: AdhkarCollection, justCompletedId: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    const idx = group.items.findIndex((i) => i.id === justCompletedId);
    const next = group.items.slice(idx + 1).find((i) => !this.progress.isItemComplete(group.id, i));
    if (!next) {
      return;
    }
    const el = document.getElementById(`adhkar-item-${group.items.indexOf(next) + 1}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
