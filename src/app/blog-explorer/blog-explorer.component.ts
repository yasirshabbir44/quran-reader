import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BLOG_FEATURED_STORY_IDS, BLOG_PAGE_SIZE, BLOG_VIEW_MODE_STORAGE_KEY } from '../core/blog/blog.constants';
import {
  BlogService,
  type BlogCategoryGroup,
  type BlogPostListItem,
  type BlogTagWithCount,
} from '../core/blog/blog.service';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

export type BlogViewMode = 'grid' | 'list';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly blog = inject(BlogService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly BLOG_PAGE_SIZE = BLOG_PAGE_SIZE;

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly groups = signal<readonly BlogCategoryGroup[]>([]);
  protected readonly allPosts = signal<readonly BlogPostListItem[]>([]);
  protected readonly tagFilters = signal<readonly BlogTagWithCount[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategoryId = signal<string | null>(null);
  protected readonly selectedTagId = signal<string | null>(null);
  protected readonly visibleLimit = signal(BLOG_PAGE_SIZE);
  protected readonly viewMode = signal<BlogViewMode>(readStoredBlogViewMode());

  protected readonly featuredPosts = computed(() => {
    const byId = new Map(this.allPosts().map((p) => [p.id, p]));
    return BLOG_FEATURED_STORY_IDS.map((id) => byId.get(id)).filter(
      (p): p is BlogPostListItem => p != null,
    );
  });

  protected readonly categoryFilters = computed(() => this.groups());

  protected readonly hasActiveFilters = computed(
    () =>
      this.selectedCategoryId() != null ||
      this.selectedTagId() != null ||
      this.searchQuery().trim().length > 0,
  );

  protected readonly filteredPosts = computed(() => {
    const raw = this.searchQuery().trim().normalize('NFKC').toLowerCase();
    const categoryId = this.selectedCategoryId();
    const tagId = this.selectedTagId();
    let posts = [...this.allPosts()];

    if (categoryId) {
      posts = posts.filter((p) => p.categoryId === categoryId);
    }

    if (tagId) {
      posts = posts.filter((p) => p.tags.includes(tagId));
    }

    if (raw) {
      posts = posts.filter((p) => this.postMatchesQuery(p, raw));
    }

    return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  });

  protected readonly visiblePosts = computed(() =>
    this.filteredPosts().slice(0, this.visibleLimit()),
  );

  protected readonly totalPosts = computed(() => this.allPosts().length);

  protected readonly totalCategories = computed(() => this.groups().length);

  protected readonly totalTags = computed(() => this.tagFilters().length);

  protected readonly shownPosts = computed(() => this.filteredPosts().length);

  protected readonly displayedPosts = computed(() => this.visiblePosts().length);

  protected readonly hasMorePosts = computed(
    () => this.visiblePosts().length < this.filteredPosts().length,
  );

  protected readonly remainingPosts = computed(
    () => this.filteredPosts().length - this.visiblePosts().length,
  );

  constructor() {
    effect(() => {
      this.searchQuery();
      this.selectedCategoryId();
      this.selectedTagId();
      this.visibleLimit.set(BLOG_PAGE_SIZE);
    });
  }

  ngOnInit(): void {
    this.syncSeo();
    this.applyQueryParams(this.route.snapshot.queryParamMap);

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.applyQueryParams(params));

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
          .getTags()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((tags) => this.tagFilters.set(tags));

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
    this.syncQueryParams();
  }

  protected selectTag(tagId: string | null): void {
    this.selectedTagId.set(tagId);
    this.syncQueryParams();
  }

  protected isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryId() === categoryId;
  }

  protected isTagSelected(tagId: string): boolean {
    return this.selectedTagId() === tagId;
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.syncQueryParams();
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoryId.set(null);
    this.selectedTagId.set(null);
    this.syncQueryParams();
  }

  protected loadMore(): void {
    this.visibleLimit.update((n) => n + BLOG_PAGE_SIZE);
  }

  protected setViewMode(mode: BlogViewMode): void {
    this.viewMode.set(mode);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(BLOG_VIEW_MODE_STORAGE_KEY, mode);
    }
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

  protected tagName(entry: BlogTagWithCount): string {
    return this.blog.tagLabel(entry.tag);
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
    this.blog.getTags().subscribe((tags) => this.tagFilters.set(tags));
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

  private applyQueryParams(params: { get: (key: string) => string | null }): void {
    const category = params.get('category');
    const tag = params.get('tag');
    const q = params.get('q') ?? '';

    this.selectedCategoryId.set(category);
    this.selectedTagId.set(tag);
    this.searchQuery.set(q);
  }

  private syncQueryParams(): void {
    const queryParams: Record<string, string | null> = {
      category: this.selectedCategoryId(),
      tag: this.selectedTagId(),
      q: this.searchQuery().trim() || null,
    };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
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
    if (p.tagNames.some((name) => name.toLowerCase().includes(needle))) {
      return true;
    }
    for (const section of p.sections) {
      if (section.type === 'quote' && section.arabic?.includes(needle)) {
        return true;
      }
      const text = this.blog.pickLocalized(section.text).toLowerCase();
      if (text.includes(needle)) {
        return true;
      }
    }
    return false;
  }
}

function readStoredBlogViewMode(): BlogViewMode {
  if (typeof sessionStorage === 'undefined') {
    return 'grid';
  }
  const stored = sessionStorage.getItem(BLOG_VIEW_MODE_STORAGE_KEY);
  return stored === 'list' ? 'list' : 'grid';
}
