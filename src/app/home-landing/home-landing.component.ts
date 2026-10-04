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
import {
  normalizeVerseTranslations,
  pickVerseTranslationForLocale,
} from '../core/verse-presentation/verse-presentation.strategy';
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
import { ReadingStreakService } from '../core/streak/reading-streak.service';
import { DashboardAudioService } from '../core/audio/dashboard-audio.service';
import { AdhkarService } from '../core/adhkar/adhkar.service';
import {
  AdhkarProgressService,
  suggestedAdhkarCollectionId,
} from '../core/adhkar/adhkar-progress.service';
import type { AdhkarCollection, AdhkarItem } from '../core/adhkar/adhkar.types';

export type SurahRevelationFilter = 'all' | 'meccan' | 'medinan' | 'bookmarked';
export type SurahIndexLayout = 'grid' | 'list' | 'juz';

/** 8 frequently recited and beloved surahs for quick dashboard access */
const POPULAR_SURAHS: readonly number[] = [1, 2, 18, 36, 55, 56, 67, 112];

@Component({
  selector: 'app-home-landing',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    UiTranslatePipe,
    KhatamProgressCardComponent,
    GlobalSearchComponent,
  ],
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

  // New spiritual companion services
  protected readonly streak = inject(ReadingStreakService);
  protected readonly audio = inject(DashboardAudioService);
  protected readonly adhkarService = inject(AdhkarService);
  protected readonly adhkarProgress = inject(AdhkarProgressService);

  protected readonly ui = inject(UiLocaleService);
  protected readonly khatamActive = this.khatam.isActive;
  protected readonly khatamFurthest = this.khatam.furthest;
  protected readonly khatamProgress = this.khatam.progress;

  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahs = signal<readonly QuranSurahPayload[]>([]);
  protected readonly daily = signal<DailyVerseRef | null>(null);
  protected readonly savedPlace = signal<ReadingBookmark | null>(null);
  protected readonly indexQuery = signal('');
  protected readonly indexLayout = signal<SurahIndexLayout>('grid');
  protected readonly revelationFilter = signal<SurahRevelationFilter>('all');
  protected readonly mushafPayload = signal<MushafIndexPayload | null>(null);
  protected readonly themeItems = signal<readonly ThematicThemeListItem[]>([]);
  protected readonly themeCount = signal(0);
  protected readonly blogCount = signal(0);
  protected readonly dailyTopic = signal<DailyThemeInspiration | null>(null);
  protected readonly adhkarCollections = signal<readonly AdhkarCollection[]>([]);
  protected readonly copiedToast = signal(false);

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

  protected readonly activeBookmark = computed(() => {
    return this.savedPlace() ?? { surah: 1, ayah: 1 };
  });

  protected readonly activeBookmarkSurah = computed(() => {
    const list = this.surahs();
    if (list.length === 0) return null;
    const bm = this.activeBookmark();
    return list[bm.surah - 1] ?? list[0] ?? null;
  });

  protected readonly continueProgressPct = computed(() => {
    const bm = this.savedPlace();
    const surah = this.continueReadingSurah();
    if (!bm || !surah || surah.versesCount <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bm.ayah / surah.versesCount) * 100));
  });

  protected readonly continueReadingSurah = computed(() => {
    const bm = this.savedPlace();
    const list = this.surahs();
    if (!bm || list.length === 0) {
      return null;
    }
    return list[bm.surah - 1] ?? null;
  });

  protected readonly khatamContinueSurah = computed(() => {
    const ref = this.khatamFurthest();
    const list = this.surahs();
    if (list.length === 0) {
      return null;
    }
    return list[ref.surah - 1] ?? null;
  });

  protected readonly filteredSurahs = computed(() => {
    const list = this.surahs();
    const filter = this.revelationFilter();
    let byType: readonly QuranSurahPayload[];
    if (filter === 'all') {
      byType = list;
    } else if (filter === 'bookmarked') {
      const bm = this.savedPlace();
      byType = bm ? list.filter((s) => s.number === bm.surah) : list;
    } else {
      byType = list.filter((s) => s.revelationType === filter);
    }
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

  /** Time-aware Islamic greeting key */
  protected readonly greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'dashboardHeroGreetingMorning';
    }
    if (hour >= 12 && hour < 17) {
      return 'dashboardHeroGreetingAfternoon';
    }
    if (hour >= 17 && hour < 21) {
      return 'dashboardHeroGreetingEvening';
    }
    return 'dashboardHeroGreetingNight';
  });

  /** Authentic Hijri date formatted in current locale */
  protected readonly hijriDateLabel = computed(() => {
    this.ui.locale();
    const now = new Date();
    try {
      const localeTag =
        this.ui.locale() === 'ar'
          ? 'ar-SA-u-ca-islamic-umalqura'
          : this.ui.locale() === 'ur'
            ? 'ur-PK-u-ca-islamic-umalqura'
            : 'en-US-u-ca-islamic-umalqura';
      return new Intl.DateTimeFormat(localeTag, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch {
      return '';
    }
  });

  protected readonly todayLabel = computed(() => {
    this.ui.locale();
    const date = new Date();
    const tag =
      this.ui.locale() === 'ar'
        ? 'ar-SA'
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

  /** Current suggested time-based Adhkar collection */
  protected readonly currentAdhkarCollection = computed((): AdhkarCollection | null => {
    const cols = this.adhkarCollections();
    if (cols.length === 0) return null;
    const suggestedId = suggestedAdhkarCollectionId();
    return cols.find((c) => c.id === suggestedId) ?? cols[0] ?? null;
  });

  /** Prime Dhikr item for current time of day */
  protected readonly currentDhikrItem = computed((): AdhkarItem | null => {
    const col = this.currentAdhkarCollection();
    if (!col || col.items.length === 0) return null;
    // Prefer one with a repeat counter like SubhanAllah or Istighfar
    const withRepeat = col.items.find((i) => (i.repeat ?? 1) > 1);
    return withRepeat ?? col.items[0] ?? null;
  });

  /** Current tap count for the highlighted dhikr */
  protected readonly currentDhikrCount = computed(() => {
    const col = this.currentAdhkarCollection();
    const item = this.currentDhikrItem();
    if (!col || !item) return 0;
    this.adhkarProgress.progressSnapshot(); // trigger reactive subscription
    return this.adhkarProgress.count(col.id, item.id);
  });

  protected readonly currentDhikrTarget = computed(() => {
    const item = this.currentDhikrItem();
    return item?.repeat ?? 33;
  });

  protected readonly isDhikrCompleted = computed(() => {
    return this.currentDhikrCount() >= this.currentDhikrTarget();
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

    this.adhkarService
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (payload) {
          this.adhkarCollections.set(payload.collections);
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

  protected onReciterChange(reciterId: string | number): void {
    this.audio.setReciter(Number(reciterId));
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

  protected localizedDhikrText(item: AdhkarItem): string {
    return this.adhkarService.pickLocalized(item.translation);
  }

  protected onDhikrTap(): void {
    const col = this.currentAdhkarCollection();
    const item = this.currentDhikrItem();
    if (!col || !item) return;
    this.adhkarProgress.tap(col.id, item);
    this.streak.recordActivity(1);
  }

  protected resetDhikr(): void {
    const col = this.currentAdhkarCollection();
    const item = this.currentDhikrItem();
    if (!col || !item) return;
    this.adhkarProgress.resetItem(col.id, item.id);
  }

  protected playAudio(surah: number, ayah: number, label?: string): void {
    this.audio.toggle(surah, ayah, label);
  }

  protected isAudioPlaying(surah: number, ayah: number): boolean {
    return this.audio.isCurrentAyahPlaying(surah, ayah);
  }

  protected copyVerse(text: string, ref: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const full = `${text}\n\n— ${ref}`;
    navigator.clipboard?.writeText(full).then(() => {
      this.copiedToast.set(true);
      setTimeout(() => this.copiedToast.set(false), 2500);
    });
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
