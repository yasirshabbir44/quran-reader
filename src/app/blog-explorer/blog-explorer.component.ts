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
import { BLOG_FEATURED_STORY_IDS } from '../core/blog/blog.constants';
import { BlogService, type BlogCategoryGroup, type BlogPostListItem } from '../core/blog/blog.service';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

@Component({
  selector: 'app-blog-explorer',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './blog-explorer.component.html',
  styleUrl: './blog-explorer.component.scss',
})
export class BlogExplorerComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly blog = inject(BlogService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly groups = signal<readonly BlogCategoryGroup[]>([]);
  protected readonly allPosts = signal<readonly BlogPostListItem[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategoryId = signal<string | null>(null);

  protected readonly featuredPosts = computed(() => {
    const byId = new Map(this.allPosts().map((p) => [p.id, p]));
    return BLOG_FEATURED_STORY_IDS.map((id) => byId.get(id)).filter(
      (p): p is BlogPostListItem => p != null,
    );
  });

  protected readonly categoryFilters = computed(() => this.groups());

  protected readonly filteredGroups = computed(() => {
    const raw = this.searchQuery().trim().normalize('NFKC').toLowerCase();
    const categoryId = this.selectedCategoryId();
    let source = this.groups();

    if (categoryId) {
      source = source.filter((g) => g.category.id === categoryId);
    }

    if (!raw) {
      return source;
    }

    return source
      .map((g) => ({
        category: g.category,
        posts: g.posts.filter((p) => this.postMatchesQuery(p, raw)),
      }))
      .filter((g) => g.posts.length > 0);
  });

  protected readonly totalPosts = computed(() =>
    this.groups().reduce((n, g) => n + g.posts.length, 0),
  );

  protected readonly totalCategories = computed(() => this.groups().length);

  protected readonly shownPosts = computed(() =>
    this.filteredGroups().reduce((n, g) => n + g.posts.length, 0),
  );

  ngOnInit(): void {
    this.syncSeo();
    this.blog
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (!payload) {
          this.loading.set(false);
          this.loadError.set(true);
          return;
        }
        this.blog
          .getAllPosts()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((posts) => this.allPosts.set(posts));

        this.blog
          .getPostsByCategory()
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
    this.syncSeo();
  }

  protected selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  protected isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryId() === categoryId;
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected postTitle(post: BlogPostListItem): string {
    return this.blog.pickLocalized(post.title);
  }

  protected postExcerpt(post: BlogPostListItem): string {
    return this.blog.pickLocalized(post.excerpt);
  }

  protected categoryName(group: BlogCategoryGroup): string {
    return this.blog.pickLocalized(group.category.name);
  }

  protected categoryPostCount(group: BlogCategoryGroup): number {
    return group.posts.length;
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

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.blog.retryLoad();
    this.blog.getAllPosts().subscribe((posts) => this.allPosts.set(posts));
    this.blog.getPostsByCategory().subscribe((groups) => {
      this.groups.set(groups);
      this.loading.set(false);
      this.loadError.set(groups.length === 0);
    });
  }

  private syncSeo(): void {
    const origin = this.seo.siteOrigin();
    this.seo.apply({
      title: this.ui.translate('blogDocumentTitle'),
      description: this.ui.translate('seoBlogIndexDescription'),
      path: '/blog',
      jsonLd: collectionPageJsonLd({
        origin,
        path: '/blog',
        name: this.ui.translate('blogTitle'),
        description: this.ui.translate('seoBlogIndexDescription'),
      }),
    });
  }

  private postMatchesQuery(p: BlogPostListItem, needle: string): boolean {
    if (this.postTitle(p).toLowerCase().includes(needle)) {
      return true;
    }
    if (this.postExcerpt(p).toLowerCase().includes(needle)) {
      return true;
    }
    if (p.categoryName.toLowerCase().includes(needle)) {
      return true;
    }
    return false;
  }
}
