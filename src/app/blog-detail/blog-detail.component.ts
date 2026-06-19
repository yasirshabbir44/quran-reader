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
import { combineLatest, map, switchMap } from 'rxjs';
import { BlogService, type BlogPostListItem } from '../core/blog/blog.service';
import type { BlogContentSection, BlogTag } from '../core/blog/blog.types';
import { articleJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

export interface BlogTocEntry {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly blog = inject(BlogService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly post = signal<BlogPostListItem | null>(null);
  protected readonly relatedPosts = signal<readonly BlogPostListItem[]>([]);
  protected readonly tags = signal<readonly BlogTag[]>([]);

  protected readonly tocEntries = computed((): readonly BlogTocEntry[] => {
    const article = this.post();
    if (!article) {
      return [];
    }
    return article.sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => section.type === 'heading')
      .map(({ section, index }) => ({
        id: `section-${index}`,
        label: this.blog.pickLocalized(section.text),
      }));
  });

  ngOnInit(): void {
    this.blog
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        this.tags.set(payload?.tags ?? []);
      });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.loadError.set(false);
          this.notFound.set(false);
          this.relatedPosts.set([]);
          return combineLatest([this.blog.load(), this.blog.getPost(id)]).pipe(
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
        const exists = index.posts.some((p) => p.id === id);
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
        this.post.set(data);
        this.syncPostSeo(data);
        this.loadRelatedPosts(data);
      });
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    const data = this.post();
    if (data) {
      this.syncPostSeo(data);
    }
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected formatDate(iso: string): string {
    this.ui.locale();
    const tag = this.ui.locale() === 'ur' ? 'ur-PK' : this.ui.locale() === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(iso + 'T12:00:00').toLocaleDateString(tag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected sectionText(section: BlogContentSection): string {
    return this.blog.pickLocalized(section.text);
  }

  protected sectionAnchor(index: number): string {
    return `section-${index}`;
  }

  protected tagLabel(tagId: string): string {
    const tag = this.tags().find((t) => t.id === tagId);
    return tag ? this.blog.tagLabel(tag) : tagId;
  }

  protected retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    this.loadError.set(false);
    this.blog.retryLoad();
    this.blog.getPost(id).subscribe((data) => {
      this.loading.set(false);
      if (!data) {
        this.notFound.set(true);
        this.syncNotFoundSeo();
        return;
      }
      this.post.set(data);
      this.notFound.set(false);
      this.syncPostSeo(data);
      this.loadRelatedPosts(data);
    });
  }

  private loadRelatedPosts(data: BlogPostListItem): void {
    this.blog
      .getRelatedPosts(data.id, data.categoryId, 3)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((posts) => this.relatedPosts.set(posts));
  }

  private syncPostSeo(data: BlogPostListItem): void {
    const title = this.blog.pickLocalized(data.title);
    const excerpt = this.blog.pickLocalized(data.excerpt);
    const path = `/blog/${data.id}`;
    const origin = this.seo.siteOrigin();
    this.seo.apply({
      title: this.ui.translate('blogDetailDocumentTitle', { title }),
      description: excerpt,
      path,
      type: 'article',
      image: data.image,
      imageAlt: this.blog.pickLocalized(data.imageAlt),
      jsonLd: articleJsonLd({
        origin,
        path,
        headline: title,
        description: excerpt,
        image: data.image,
        datePublished: data.publishedAt,
      }),
    });
  }

  private syncNotFoundSeo(): void {
    this.seo.apply({
      title: this.ui.translate('blogNotFoundTitle'),
      description: this.ui.translate('seoNotFoundDescription'),
      path: `/blog/${this.route.snapshot.paramMap.get('id') ?? ''}`,
      noindex: true,
    });
  }
}
