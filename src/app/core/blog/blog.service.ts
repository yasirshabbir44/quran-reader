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
import type { BlogCategory, BlogIndexPayload, BlogLocalizedText, BlogPost, BlogTag } from './blog.types';
import { UiLocaleService, type UiLocaleCode } from '../ui/ui-locale.service';

export interface BlogPostListItem extends BlogPost {
  readonly categoryName: string;
  readonly tagNames: readonly string[];
}

export interface BlogCategoryGroup {
  readonly category: BlogCategory;
  readonly posts: readonly BlogPostListItem[];
}

export interface BlogTagWithCount {
  readonly tag: BlogTag;
  readonly count: number;
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

  getTags(): Observable<readonly BlogTagWithCount[]> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return [];
        }
        const counts = new Map<string, number>();
        for (const post of payload.posts) {
          for (const tagId of post.tags) {
            counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
          }
        }
        return payload.tags
          .filter((tag) => (counts.get(tag.id) ?? 0) > 0)
          .map((tag) => ({
            tag,
            count: counts.get(tag.id) ?? 0,
          }));
      }),
    );
  }

  getPostsByCategory(): Observable<readonly BlogCategoryGroup[]> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return [];
        }
        const groups = this.groupPosts(payload);
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
    return this.index$.pipe(map((payload) => this.resolvePost(payload, id)));
  }

  getAllPosts(): Observable<readonly BlogPostListItem[]> {
    return this.index$.pipe(
      map((payload) => {
        if (!payload) {
          return [];
        }
        return payload.posts.map((post) => this.toListItem(post, payload));
      }),
    );
  }

  getRelatedPosts(
    postId: string,
    categoryId: string,
    limit = 3,
  ): Observable<readonly BlogPostListItem[]> {
    return this.getAllPosts().pipe(
      map((posts) =>
        posts
          .filter((p) => p.id !== postId && p.categoryId === categoryId)
          .slice(0, limit),
      ),
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

  tagLabel(tag: BlogTag): string {
    return this.pickLocalized(tag.name);
  }

  private groupPosts(payload: BlogIndexPayload): Map<string, BlogPostListItem[]> {
    const groups = new Map<string, BlogPostListItem[]>();
    for (const post of payload.posts) {
      const item = this.toListItem(post, payload);
      const list = groups.get(post.categoryId) ?? [];
      list.push(item);
      groups.set(post.categoryId, list);
    }
    return groups;
  }

  private toListItem(post: BlogPost, payload: BlogIndexPayload): BlogPostListItem {
    const category = payload.categories.find((c) => c.id === post.categoryId);
    const tagById = new Map(payload.tags.map((t) => [t.id, t]));
    return {
      ...post,
      tags: post.tags ?? [],
      categoryName: category ? this.pickLocalized(category.name) : '',
      tagNames: (post.tags ?? []).map((id) => {
        const tag = tagById.get(id);
        return tag ? this.pickLocalized(tag.name) : id;
      }),
    };
  }

  private resolvePost(payload: BlogIndexPayload | null, id: string): BlogPostListItem | null {
    if (!payload) {
      return null;
    }
    const post = payload.posts.find((p) => p.id === id);
    if (!post) {
      return null;
    }
    return this.toListItem(post, payload);
  }
}
