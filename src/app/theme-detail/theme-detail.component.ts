import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import {
  ThematicIndexService,
  type ThematicThemeListItem,
  type ThematicVerseDetail,
  type ThemeVersesResult,
} from '../core/thematic-index/thematic-index.service';
import type { ThematicTheme } from '../core/thematic-index/thematic-index.types';
import { verseFragment } from '../core/routing/verse-deep-link.util';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import {
  VERSE_PRESENTATION_STRATEGY,
  normalizeVerseTranslations,
  normalizeVerseTransliteration,
  pickVerseTranslationForLocale,
  type VersePresentationContext,
} from '../core/verse-presentation/verse-presentation.strategy';
import {
  localizedCategoryName,
  localizedThemeDescription,
  localizedThemeName,
} from '../core/thematic-index/theme-locale-labels';

const THEME_ICONS: Record<string, string> = {
  hourglass: '⏳',
  heart: '💚',
  handshake: '🤝',
  dove: '🕊️',
  seed: '🌱',
  prayer: '🕌',
  droplet: '💧',
  sparkles: '✨',
  scroll: '📜',
  scales: '⚖️',
  gift: '🎁',
  gavel: '⚖️',
  parents: '👨‍👩‍👧',
  rings: '💍',
  house: '🏠',
  sun: '☀️',
  star: '⭐',
  book: '📖',
  shield: '🛡️',
  hands: '🤲',
  flame: '🔥',
  moon: '🌙',
  'open-book': '📗',
  'hands-pray': '🙏',
  leaf: '🍃',
  ribbon: '🎗️',
  cup: '☕',
  child: '👶',
  wheat: '🌾',
  healing: '💚',
  garden: '🌴',
};

export type ThemeDetailSortMode = 'surah' | 'curated';

const RELATED_LIMIT = 5;

@Component({
  selector: 'app-theme-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './theme-detail.component.html',
  styleUrl: './theme-detail.component.scss',
})
export class ThemeDetailComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly thematicIndex = inject(ThematicIndexService);
  private readonly bookmarkRepo = inject(READING_BOOKMARK_REPOSITORY);
  private readonly versePresentation = inject(VERSE_PRESENTATION_STRATEGY);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly result = signal<ThemeVersesResult | null>(null);
  protected readonly relatedThemes = signal<readonly ThematicThemeListItem[]>([]);
  protected readonly savedPlace = signal<{ surah: number; ayah: number } | null>(null);
  protected readonly copiedKey = signal<string | null>(null);
  protected readonly copiedLinkKey = signal<string | null>(null);

  protected readonly themeId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly searchQuery = signal('');
  protected readonly sortMode = signal<ThemeDetailSortMode>('surah');

  protected readonly hasSearch = computed(() => this.searchQuery().trim().length > 0);

  protected readonly displayVerses = computed(() => {
    const data = this.result();
    if (!data) {
      return [];
    }
    const raw = this.searchQuery().trim().normalize('NFKC').toLowerCase();
    let verses = raw ? data.verses.filter((v) => this.verseMatchesQuery(v, raw)) : [...data.verses];

    if (this.sortMode() === 'surah') {
      verses = [...verses].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
    }
    return verses;
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.savedPlace.set(this.bookmarkRepo.read());
    }

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.loadError.set(false);
          this.notFound.set(false);
          this.searchQuery.set('');
          this.sortMode.set('surah');
          this.relatedThemes.set([]);
          return combineLatest([
            this.thematicIndex.load(),
            this.thematicIndex.getVersesByTheme(id),
          ]).pipe(map(([index, data]) => ({ id, index, data })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, index, data }) => {
        if (!index) {
          this.loading.set(false);
          this.loadError.set(true);
          return;
        }
        const themeExists = index.themes.some((t) => t.id === id);
        if (!themeExists) {
          this.loading.set(false);
          this.notFound.set(true);
          this.syncNotFoundSeo();
          return;
        }
        if (!data) {
          return;
        }
        this.loading.set(false);
        this.result.set(data);
        this.syncThemeSeo(data);
        this.loadRelatedThemes(data.theme.categoryId, data.theme.id);
      });
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected themeIcon(theme: ThematicTheme): string {
    return theme.icon ? (THEME_ICONS[theme.icon] ?? '✦') : '✦';
  }

  protected verseRefLabel(v: ThematicVerseDetail): string {
    return `${v.surahNameTranslit} ${this.formatUiNum(v.surah)}:${this.formatUiNum(v.ayah)}`;
  }

  protected verseTranslit(v: ThematicVerseDetail): string {
    return normalizeVerseTransliteration(v.verse);
  }

  protected translationPrimary(v: ThematicVerseDetail): string {
    const tr = normalizeVerseTranslations(v.verse);
    return pickVerseTranslationForLocale(tr, this.ui.locale()).text;
  }

  protected translationPrimaryMeta(v: ThematicVerseDetail): {
    lang: 'en' | 'ur';
    dir: 'ltr' | 'rtl';
  } {
    const tr = normalizeVerseTranslations(v.verse);
    const picked = pickVerseTranslationForLocale(tr, this.ui.locale());
    return { lang: picked.lang, dir: picked.dir };
  }

  protected translationSecondary(v: ThematicVerseDetail): string | null {
    const tr = normalizeVerseTranslations(v.verse);
    const locale = this.ui.locale();
    if (locale === 'ur') {
      return tr.en || null;
    }
    if (locale === 'en') {
      return tr.ur || null;
    }
    // Arabic UI: primary is English meaning; secondary shows Urdu when available.
    return tr.ur || null;
  }

  protected themeDisplayName(theme: ThematicTheme): string {
    return localizedThemeName(theme.id, theme.name, this.ui.locale());
  }

  protected themeDisplayDescription(theme: ThematicTheme): string | undefined {
    return localizedThemeDescription(theme.id, theme.description, this.ui.locale());
  }

  protected categoryDisplayName(id: string, fallback: string): string {
    return localizedCategoryName(id, fallback, this.ui.locale());
  }

  protected verseLink(surah: number, _ayah: number): readonly (string | number)[] {
    return ['/', surah];
  }

  protected verseFragment(ayah: number): string {
    return verseFragment(ayah);
  }

  protected setSortMode(mode: ThemeDetailSortMode): void {
    this.sortMode.set(mode);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    const data = this.result();
    if (data) {
      this.syncThemeSeo(data);
    }
  }

  protected openInReader(v: ThematicVerseDetail): void {
    void this.router.navigate(['/', v.surah], {
      fragment: verseFragment(v.ayah),
    });
  }

  protected openFirstVerse(): void {
    const data = this.result();
    if (!data || data.verses.length === 0) {
      return;
    }
    const first = [...data.verses].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)[0]!;
    this.openInReader(first);
  }

  protected isBookmarked(v: ThematicVerseDetail): boolean {
    const bm = this.savedPlace();
    return bm !== null && bm.surah === v.surah && bm.ayah === v.ayah;
  }

  protected saveBookmark(v: ThematicVerseDetail): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.bookmarkRepo.saveNow(v.surah, v.ayah);
    this.savedPlace.set({ surah: v.surah, ayah: v.ayah });
  }

  protected copyVerse(v: ThematicVerseDetail): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard?.writeText) {
      return;
    }
    const text = this.versePresentation.buildCopyText(v.verse, this.presentationContext(v));
    const key = this.verseKey(v);
    void navigator.clipboard.writeText(text).then(() => {
      this.copiedKey.set(key);
      setTimeout(() => {
        if (this.copiedKey() === key) {
          this.copiedKey.set(null);
        }
      }, 1600);
    });
  }

  protected copyVerseLink(v: ThematicVerseDetail): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard?.writeText) {
      return;
    }
    const url = this.versePresentation.buildVerseLink(v.verse, this.presentationContext(v));
    const key = this.verseKey(v);
    void navigator.clipboard.writeText(url).then(() => {
      this.copiedLinkKey.set(key);
      setTimeout(() => {
        if (this.copiedLinkKey() === key) {
          this.copiedLinkKey.set(null);
        }
      }, 1600);
    });
  }

  protected shareVerse(v: ThematicVerseDetail): void {
    if (!isPlatformBrowser(this.platformId) || typeof navigator.share !== 'function') {
      return;
    }
    const sharePayload = this.versePresentation.buildShareData(
      v.verse,
      this.presentationContext(v),
    );
    void navigator.share(sharePayload);
  }

  protected isCopied(v: ThematicVerseDetail): boolean {
    return this.copiedKey() === this.verseKey(v);
  }

  protected isLinkCopied(v: ThematicVerseDetail): boolean {
    return this.copiedLinkKey() === this.verseKey(v);
  }

  protected retryLoad(): void {
    const id = this.themeId();
    this.loading.set(true);
    this.loadError.set(false);
    this.thematicIndex.retryLoad();
    this.thematicIndex.getVersesByTheme(id).subscribe((data) => {
      this.loading.set(false);
      if (!data) {
        this.notFound.set(true);
        return;
      }
      this.result.set(data);
      this.notFound.set(false);
      this.loadRelatedThemes(data.theme.categoryId, data.theme.id);
    });
  }

  private loadRelatedThemes(categoryId: string, currentId: string): void {
    this.thematicIndex
      .getThemesByCategory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => {
        const siblings =
          groups
            .find((g) => g.category.id === categoryId)
            ?.themes.filter((t) => t.id !== currentId)
            .slice(0, RELATED_LIMIT) ?? [];
        this.relatedThemes.set(siblings);
      });
  }

  private verseKey(v: ThematicVerseDetail): string {
    return `${v.surah}:${v.ayah}`;
  }

  private verseMatchesQuery(v: ThematicVerseDetail, needle: string): boolean {
    if (this.verseRefLabel(v).toLowerCase().includes(needle)) {
      return true;
    }
    if (v.surahNameAr.includes(needle)) {
      return true;
    }
    if (v.surahNameTranslit.toLowerCase().includes(needle)) {
      return true;
    }
    if (v.verse.ar.includes(needle)) {
      return true;
    }
    const tr = normalizeVerseTranslations(v.verse);
    if (tr.en.toLowerCase().includes(needle) || tr.ur.includes(needle)) {
      return true;
    }
    if (normalizeVerseTransliteration(v.verse).toLowerCase().includes(needle)) {
      return true;
    }
    return false;
  }

  private presentationContext(v: ThematicVerseDetail): VersePresentationContext {
    const origin = isPlatformBrowser(this.platformId) ? window.location.origin : '';
    return {
      surahNumber: v.surah,
      surahNameAr: v.surahNameAr,
      origin,
      formatUiNum: (n) => this.formatUiNum(n),
    };
  }

  private syncThemeSeo(data: ThemeVersesResult): void {
    const path = `/themes/${data.theme.id}`;
    const origin = this.seo.siteOrigin();
    const name = localizedThemeName(data.theme.id, data.theme.name, this.ui.locale());
    const description =
      localizedThemeDescription(data.theme.id, data.theme.description, this.ui.locale()) ??
      localizedCategoryName(data.theme.categoryId, data.categoryName, this.ui.locale());
    this.seo.apply({
      title: this.ui.translate('themesDetailDocumentTitle', { name }),
      description: this.ui.translate('seoThemeDetailDescription', {
        name,
        description,
      }),
      path,
      jsonLd: collectionPageJsonLd({
        origin,
        path,
        name,
        description,
      }),
    });
  }

  private syncNotFoundSeo(): void {
    this.seo.apply({
      title: this.ui.translate('themesNotFoundTitle'),
      description: this.ui.translate('seoNotFoundDescription'),
      path: `/themes/${this.themeId()}`,
      noindex: true,
    });
  }
}
