import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SEO_SITE } from './seo.config';

export type SeoPageType = 'website' | 'article' | 'book';

export interface SeoPageMeta {
  readonly title: string;
  readonly description: string;
  /** App path starting with `/` (no origin). */
  readonly path: string;
  readonly type?: SeoPageType;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly noindex?: boolean;
  readonly jsonLd?: Record<string, unknown> | readonly Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private canonicalEl: HTMLLinkElement | null = null;
  private jsonLdEl: HTMLScriptElement | null = null;

  apply(config: SeoPageMeta): void {
    const pageType = config.type ?? 'website';
    const image = this.absoluteUrl(config.image ?? SEO_SITE.defaultOgImage);
    const url = this.absoluteUrl(config.path);
    const imageAlt = config.imageAlt ?? config.title;

    this.title.setTitle(config.title);
    this.upsertMeta('name', 'description', config.description);
    this.upsertMeta('name', 'robots', config.noindex ? 'noindex, nofollow' : 'index, follow');
    this.upsertMeta('property', 'og:title', config.title);
    this.upsertMeta('property', 'og:description', config.description);
    this.upsertMeta('property', 'og:type', pageType);
    this.upsertMeta('property', 'og:url', url);
    this.upsertMeta('property', 'og:site_name', SEO_SITE.name);
    this.upsertMeta('property', 'og:locale', SEO_SITE.locale);
    this.upsertMeta('property', 'og:image', image);
    this.upsertMeta('property', 'og:image:alt', imageAlt);
    this.upsertMeta('name', 'twitter:card', SEO_SITE.twitterCard);
    this.upsertMeta('name', 'twitter:title', config.title);
    this.upsertMeta('name', 'twitter:description', config.description);
    this.upsertMeta('name', 'twitter:image', image);
    this.upsertMeta('name', 'twitter:image:alt', imageAlt);
    this.setCanonical(url);
    this.setJsonLd(config.jsonLd);
  }

  private upsertMeta(attrSelector: 'name' | 'property', key: string, content: string): void {
    const selector = `${attrSelector}="${key}"`;
    if (this.meta.getTag(selector)) {
      this.meta.updateTag({ [attrSelector]: key, content });
    } else {
      this.meta.addTag({ [attrSelector]: key, content });
    }
  }

  private setCanonical(url: string): void {
    if (!this.canonicalEl) {
      this.canonicalEl = this.doc.querySelector('link[rel="canonical"]');
    }
    if (!this.canonicalEl) {
      this.canonicalEl = this.doc.createElement('link');
      this.canonicalEl.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(this.canonicalEl);
    }
    this.canonicalEl.setAttribute('href', url);
  }

  private setJsonLd(jsonLd: SeoPageMeta['jsonLd']): void {
    if (this.jsonLdEl) {
      this.jsonLdEl.remove();
      this.jsonLdEl = null;
    }
    if (!jsonLd) {
      return;
    }
    const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    this.jsonLdEl = this.doc.createElement('script');
    this.jsonLdEl.type = 'application/ld+json';
    this.jsonLdEl.text = JSON.stringify(payload.length === 1 ? payload[0] : payload);
    this.doc.head.appendChild(this.jsonLdEl);
  }

  private absoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      return pathOrUrl;
    }
    const origin = this.resolveOrigin();
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${origin}${path}`;
  }

  siteOrigin(): string {
    return this.resolveOrigin();
  }

  private resolveOrigin(): string {
    if (isPlatformBrowser(this.platformId)) {
      const origin = this.doc.defaultView?.location?.origin;
      if (origin && origin !== 'null') {
        return origin.replace(/\/$/, '');
      }
    }
    return SEO_SITE.siteUrl.replace(/\/$/, '');
  }
}
