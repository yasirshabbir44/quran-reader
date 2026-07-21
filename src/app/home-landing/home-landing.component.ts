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
import { RouterLink } from '@angular/router';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import type { ReadingBookmark } from '../core/bookmark/reading-bookmark.repository';
import { homeJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { BlogService } from '../core/blog/blog.service';
import { DailyVerseService, type DailyVerseRef } from '../core/daily-verse/daily-verse.service';
import { KhatamService } from '../core/khatam/khatam.service';
import {
  KhatamProgressCardComponent,
  type KhatamStartEvent,
} from '../core/khatam/ui/khatam-progress-card.component';
import { GlobalSearchComponent } from '../core/ui/global-search/global-search.component';
import { MushafIndexService } from '../core/mushaf/mushaf-index.service';
import { QURAN_CORPUS_SOURCE } from '../core/quran/quran-corpus.source';
import {
  QuranDataService,
  type QuranFullPayload,
  type QuranSurahPayload,
} from '../core/quran/quran-data.service';
import { verseFragment } from '../core/routing/verse-deep-link.util';
import {
  ThematicIndexService,
  type DailyThemeInspiration,
  type ThematicThemeListItem,
} from '../core/thematic-index/thematic-index.service';
import type { MushafIndexPayload } from '../core/mushaf/mushaf-index.types';
import { normalizeVerseTranslations, pickVerseTranslationForLocale } from '../core/verse-presentation/verse-presentation.strategy';
import {
  localizedCategoryName,
  localizedThemeName,
} from '../core/thematic-index/theme-locale-labels';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import type { SurahNavItem } from '../surah-reader/models/surah-nav-item.model';
import { filterSurahNavItems } from '../surah-reader/utils/surah-nav-filter.util';
import {
  filterSurahJuzGroups,
  groupSurahsByJuz,
} from './utils/surah-juz-groups.util';

export type SurahRevelationFilter = 'all' | 'meccan' | 'medinan';
export type SurahIndexLayout = 'list' | 'juz';

/** Frequently opened surahs — quick access from the home dashboard. */
const POPULAR_SURAHS: readonly number[] = [1, 18, 36, 55, 67, 112];

@Component({
  selector: 'app-home-landing',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe, KhatamProgressCardComponent, GlobalSearchComponent],
  templateUrl: './home-landing.component.html',
  styleUrl: './home-landing.component.scss',
})
export class HomeLandingComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly corpusSource = inject(QURAN_CORPUS_SOURCE);
  private readonly quranData = inject(QuranDataService);
  private readonly dailyVerse = inject(DailyVerseService);
  private readonly bookmarkRepo = inject(READING_BOOKMARK_REPOSITORY);
  private readonly thematicIndex = inject(ThematicIndexService);
  private readonly blogService = inject(BlogService);
  private readonly khatam = inject(KhatamService);
  private readonly mushafIndex = inject(MushafIndexService);

  protected readonly ui = inject(UiLocaleService);
  protected readonly khatamActive = this.khatam.isActive;
  protected readonly khatamFurthest = this.khatam.furthest;

  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahs = signal<readonly QuranSurahPayload[]>([]);
  protected readonly daily = signal<DailyVerseRef | null>(null);
  protected readonly savedPlace = signal<ReadingBookmark | null>(null);
  protected readonly indexQuery = signal('');
  protected readonly indexLayout = signal<SurahIndexLayout>('list');
  protected readonly revelationFilter = signal<SurahRevelationFilter>('all');
  protected readonly mushafPayload = signal<MushafIndexPayload | null>(null);
  protected readonly themeItems = signal<readonly ThematicThemeListItem[]>([]);
  protected readonly themeCount = signal(0);
  protected readonly blogCount = signal(0);
  protected readonly dailyTopic = signal<DailyThemeInspiration | null>(null);

  protected readonly popularSurahs = POPULAR_SURAHS;

  protected readonly totalVerses = computed(() =>
    this.surahs().reduce((sum, s) => sum + s.versesCount, 0),
  );

  protected readonly meccanCount = computed(
    () => this.surahs().filter((s) => s.revelationType === 'meccan').length,
  );

  protected readonly medinanCount = computed(
    () => this.surahs().filter((s) => s.revelationType === 'medinan').length,
  );

  protected readonly filteredSurahs = computed(() => {
    const list = this.surahs();
    const filter = this.revelationFilter();
    const byType =
      filter === 'all' ? list : list.filter((s) => s.revelationType === filter);
    const navItems = byType.map((s) => this.toSurahNavItem(s));
    const filtered = filterSurahNavItems(navItems, this.indexQuery());
    if (filtered.length === navItems.length) {
      return byType;
    }
    const allowed = new Set(filtered.map((s) => s.number));
    return byType.filter((s) => allowed.has(s.number));
  });

  protected readonly indexJuzGroups = computed(() => {
    const index = this.mushafPayload();
    if (!index) {
      return [];
    }
    const groups = groupSurahsByJuz(this.surahs(), index);
    return filterSurahJuzGroups(groups, this.filteredSurahs());
  });

  protected readonly featuredSurah = computed(() => {
    const d = this.daily();
    const list = this.surahs();
    if (!d || list.length === 0) {
      return null;
    }
    return list[d.surah - 1] ?? null;
  });

  protected readonly continueReadingSurah = computed(() => {
    const bm = this.savedPlace();
    const list = this.surahs();
    if (!bm || list.length === 0) {
      return null;
    }
    return list[bm.surah - 1] ?? null;
  });

  protected readonly continueProgressPct = computed(() => {
    const bm = this.savedPlace();
    const surah = this.continueReadingSurah();
    if (!bm || !surah || surah.versesCount <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bm.ayah / surah.versesCount) * 100));
  });

  protected readonly khatamContinueSurah = computed(() => {
    const ref = this.khatamFurthest();
    const list = this.surahs();
    if (list.length === 0) {
      return null;
    }
    return list[ref.surah - 1] ?? null;
  });

  protected readonly todayLabel = computed(() => {
    this.ui.locale();
    const date = new Date();
    const tag =
      this.ui.locale() === 'ar'
        ? 'ar-SA-u-ca-islamic'
        : this.ui.locale() === 'ur'
          ? 'ur-PK'
          : 'en-US';
    try {
      return new Intl.DateTimeFormat(tag, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  });

  protected readonly surahNavItems = computed(() =>
    this.surahs().map((s) => this.toSurahNavItem(s)),
  );

  protected readonly randomSurahNumber = computed(() => {
    const list = this.surahs();
    if (list.length === 0) {
      return 1;
    }
    const key = this.dailyVerseDateKey(new Date()) + ':random-surah';
    const index = this.hashString(key) % list.length;
    return list[index]!.number;
  });

  ngOnInit(): void {
    this.syncSeo();
    if (isPlatformBrowser(this.platformId)) {
      this.savedPlace.set(this.bookmarkRepo.read());
      this.khatam.hydrateFromStorage();
      this.khatam.syncDay();
    }

    this.mushafIndex
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((index) => {
        if (index) {
          this.mushafPayload.set(index);
          this.khatam.bindMushafIndex(index);
        }
      });

    this.corpusSource
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (!payload) {
          this.corpusLoading.set(false);
          this.corpusError.set(true);
          return;
        }
        this.applyCorpus(payload);
      });

    this.thematicIndex
      .getThemes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((themes) => {
        this.themeItems.set(themes);
        this.themeCount.set(themes.length);
      });

    this.thematicIndex
      .getDailyInspiration()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((inspiration) => {
        this.dailyTopic.set(inspiration);
      });

    this.blogService
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (payload) {
          this.blogCount.set(payload.posts.length);
        }
      });
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    this.syncSeo();
  }

  protected revelationLabel(type: QuranSurahPayload['revelationType']): string {
    return this.ui.translate(type === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan');
  }

  protected verseLink(surah: number, ayah: number): readonly (string | number)[] {
    return ['/', surah];
  }

  protected verseFragment(ayah: number): string {
    return verseFragment(ayah);
  }

  protected dailyTopicTranslation(inspiration: DailyThemeInspiration): string {
    const tr = normalizeVerseTranslations(inspiration.verse.verse);
    return pickVerseTranslationForLocale(tr, this.ui.locale()).text;
  }

  protected dailyTopicTranslationMeta(inspiration: DailyThemeInspiration): {
    lang: 'en' | 'ur';
    dir: 'ltr' | 'rtl';
  } {
    const tr = normalizeVerseTranslations(inspiration.verse.verse);
    const picked = pickVerseTranslationForLocale(tr, this.ui.locale());
    return { lang: picked.lang, dir: picked.dir };
  }

  protected dailyVerseTranslation(dv: {
    translationEn: string;
    translationUr: string;
  }): string {
    return pickVerseTranslationForLocale(
      { en: dv.translationEn, ur: dv.translationUr },
      this.ui.locale(),
    ).text;
  }

  protected dailyVerseTranslationMeta(dv: {
    translationEn: string;
    translationUr: string;
  }): { lang: 'en' | 'ur'; dir: 'ltr' | 'rtl' } {
    const picked = pickVerseTranslationForLocale(
      { en: dv.translationEn, ur: dv.translationUr },
      this.ui.locale(),
    );
    return { lang: picked.lang, dir: picked.dir };
  }

  protected localizedThemeTitle(theme: { id: string; name: string }): string {
    return localizedThemeName(theme.id, theme.name, this.ui.locale());
  }

  protected localizedTopicCategory(inspiration: DailyThemeInspiration): string {
    return localizedCategoryName(
      inspiration.theme.categoryId,
      inspiration.categoryName,
      this.ui.locale(),
    );
  }

  protected setRevelationFilter(filter: SurahRevelationFilter): void {
    this.revelationFilter.set(filter);
  }

  protected setIndexLayout(layout: SurahIndexLayout): void {
    this.indexLayout.set(layout);
  }

  protected surahByNumber(num: number): QuranSurahPayload | null {
    return this.surahs().find((s) => s.number === num) ?? null;
  }

  protected retryCorpusLoad(): void {
    this.corpusLoading.set(true);
    this.corpusError.set(false);
    this.quranData.retryLoad();
  }

  protected startKhatam(event?: KhatamStartEvent): void {
    this.khatam.startNew({ pacePlan: event?.pacePlan ?? 'free' });
  }

  protected startKhatamFromBookmark(event?: KhatamStartEvent): void {
    const place = this.savedPlace() ?? this.bookmarkRepo.read();
    this.khatam.startNew({
      pacePlan: event?.pacePlan ?? 'free',
      from: place ?? { surah: 1, ayah: 1 },
    });
  }

  protected resetKhatam(event?: KhatamStartEvent): void {
    this.khatam.startNew({ pacePlan: event?.pacePlan ?? 'free' });
  }

  private syncSeo(): void {
    const origin = this.seo.siteOrigin();
    const description = this.ui.translate('seoHomeDescription');
    const surahs = this.surahs();
    const totalVerses = surahs.length
      ? surahs.reduce((sum, s) => sum + s.versesCount, 0)
      : 6236;
    this.seo.apply({
      title: this.ui.translate('documentTitleHome'),
      description,
      path: '/',
      jsonLd: homeJsonLd({
        origin,
        surahs,
        totalVerses,
        description,
      }),
    });
  }

  private applyCorpus(payload: QuranFullPayload): void {
    this.surahs.set(payload.surahs);
    this.khatam.bindCorpus(payload.surahs);
    this.daily.set(this.dailyVerse.verseForDate(payload));
    this.corpusLoading.set(false);
    this.corpusError.set(false);
    this.syncSeo();
  }

  private toSurahNavItem(s: QuranSurahPayload): SurahNavItem {
    return {
      number: s.number,
      nameAr: s.nameAr,
      nameTranslit: s.nameTranslit,
      versesCount: s.versesCount,
      revelationType: s.revelationType,
    };
  }

  private dailyVerseDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
