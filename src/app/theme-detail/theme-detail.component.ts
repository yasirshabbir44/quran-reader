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
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import {
  ThematicIndexService,
  type ThematicVerseDetail,
  type ThemeVersesResult,
} from '../core/thematic-index/thematic-index.service';
import { verseFragment } from '../core/routing/verse-deep-link.util';
import { UiLocaleService } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import {
  VERSE_PRESENTATION_STRATEGY,
  normalizeVerseTranslations,
  type VersePresentationContext,
} from '../core/verse-presentation/verse-presentation.strategy';

@Component({
  selector: 'app-theme-detail',
  standalone: true,
  imports: [RouterLink, UiTranslatePipe],
  templateUrl: './theme-detail.component.html',
  styleUrl: './theme-detail.component.scss',
})
export class ThemeDetailComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly thematicIndex = inject(ThematicIndexService);
  private readonly bookmarkRepo = inject(READING_BOOKMARK_REPOSITORY);
  private readonly versePresentation = inject(VERSE_PRESENTATION_STRATEGY);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly result = signal<ThemeVersesResult | null>(null);
  protected readonly savedPlace = signal<{ surah: number; ayah: number } | null>(null);
  protected readonly copiedKey = signal<string | null>(null);

  protected readonly themeId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

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
          this.title.setTitle(this.ui.translate('themesNotFoundTitle'));
          return;
        }
        if (!data) {
          return;
        }
        this.loading.set(false);
        this.result.set(data);
        this.title.setTitle(
          this.ui.translate('themesDetailDocumentTitle', { name: data.theme.name }),
        );
      });
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected verseRefLabel(v: ThematicVerseDetail): string {
    return `${v.surahNameTranslit} ${this.formatUiNum(v.surah)}:${this.formatUiNum(v.ayah)}`;
  }

  protected translationPrimary(v: ThematicVerseDetail): string {
    const tr = normalizeVerseTranslations(v.verse);
    return this.ui.locale() === 'ur' ? tr.ur : tr.en;
  }

  protected translationSecondary(v: ThematicVerseDetail): string | null {
    const tr = normalizeVerseTranslations(v.verse);
    if (this.ui.locale() === 'ur') {
      return tr.en || null;
    }
    if (this.ui.locale() === 'en') {
      return tr.ur || null;
    }
    return tr.en || null;
  }

  protected verseLink(surah: number, ayah: number): readonly (string | number)[] {
    return ['/', surah];
  }

  protected verseFragment(ayah: number): string {
    return verseFragment(ayah);
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
    });
  }

  private verseKey(v: ThematicVerseDetail): string {
    return `${v.surah}:${v.ayah}`;
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
}
