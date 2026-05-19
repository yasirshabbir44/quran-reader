import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import type { BlogCategory, BlogIndexPayload, BlogLocalizedText, BlogPost } from './blog.types';
import { UiLocaleService, type UiLocaleCode } from '../ui/ui-locale.service';

export interface BlogPostListItem extends BlogPost {
  readonly categoryName: string;
}

export interface BlogCategoryGroup {
  readonly category: BlogCategory;
  readonly posts: readonly BlogPostListItem[];
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly ui = inject(UiLocaleService);

  private readonly loadGeneration = new BehaviorSubject(0);

  private readonly index$ = this.loadGeneration.pipe(
    switchMap(() =>
      this.http.get<BlogIndexPayload>('/blog-index.json').pipe(catchError(() => of(null))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(): Observable<BlogIndexPayload | null> {
    return this.index$;
  }

  retryLoad(): void {
    this.loadGeneration.next(this.loadGeneration.value + 1);
  }

  getPostsByCategory(): Observable<readonly BlogCategoryGroup[]> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return [];
        }
        const categoryById = new Map(payload.categories.map((c) => [c.id, c]));
        const groups = new Map<string, BlogPostListItem[]>();

        for (const post of payload.posts) {
          const category = categoryById.get(post.categoryId);
          if (!category) {
            continue;
          }
          const item: BlogPostListItem = {
            ...post,
            categoryName: this.pickLocalized(category.name),
          };
          const list = groups.get(post.categoryId) ?? [];
          list.push(item);
          groups.set(post.categoryId, list);
        }

        return payload.categories
          .filter((c) => (groups.get(c.id)?.length ?? 0) > 0)
          .map((category) => ({
            category,
            posts: [...(groups.get(category.id) ?? [])].sort((a, b) =>
              b.publishedAt.localeCompare(a.publishedAt),
            ),
          }));
      }),
    );
  }

  getPost(id: string): Observable<BlogPostListItem | null> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return null;
        }
        const post = payload.posts.find((p) => p.id === id);
        if (!post) {
          return null;
        }
        const category = payload.categories.find((c) => c.id === post.categoryId);
        return {
          ...post,
          categoryName: category ? this.pickLocalized(category.name) : '',
        };
      }),
    );
  }

  pickLocalized(text: BlogLocalizedText, locale?: UiLocaleCode): string {
    const code = locale ?? this.ui.locale();
    if (code === 'ur') {
      return text.ur || text.en;
    }
    if (code === 'ar') {
      return text.ar || text.en;
    }
    return text.en;
  }
}
