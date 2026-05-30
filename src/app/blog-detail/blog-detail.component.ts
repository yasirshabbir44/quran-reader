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
import { BlogService, type BlogPostListItem } from '../core/blog/blog.service';
import type { BlogContentSection } from '../core/blog/blog.types';
import { articleJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

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

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.loadError.set(false);
          this.notFound.set(false);
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
    if (section.type === 'quote') {
      return this.blog.pickLocalized(section.text);
    }
    return this.blog.pickLocalized(section.text);
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
    });
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
