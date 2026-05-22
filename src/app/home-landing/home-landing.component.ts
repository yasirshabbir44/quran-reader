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
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import type { ReadingBookmark } from '../core/bookmark/reading-bookmark.repository';
import { BlogService } from '../core/blog/blog.service';
import { DailyVerseService, type DailyVerseRef } from '../core/daily-verse/daily-verse.service';
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
} from '../core/thematic-index/thematic-index.service';
import { normalizeVerseTranslations } from '../core/verse-presentation/verse-presentation.strategy';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

export type SurahRevelationFilter = 'all' | 'meccan' | 'medinan';

/** Frequently opened surahs — quick access from the home dashboard. */
const POPULAR_SURAHS: readonly number[] = [1, 18, 36, 55, 67, 112];

@Component({
  selector: 'app-home-landing',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './home-landing.component.html',
  styleUrl: './home-landing.component.scss',
})
export class HomeLandingComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly corpusSource = inject(QURAN_CORPUS_SOURCE);
  private readonly quranData = inject(QuranDataService);
  private readonly dailyVerse = inject(DailyVerseService);
  private readonly bookmarkRepo = inject(READING_BOOKMARK_REPOSITORY);
  private readonly thematicIndex = inject(ThematicIndexService);
  private readonly blogService = inject(BlogService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahs = signal<readonly QuranSurahPayload[]>([]);
  protected readonly daily = signal<DailyVerseRef | null>(null);
  protected readonly savedPlace = signal<ReadingBookmark | null>(null);
  protected readonly indexQuery = signal('');
  protected readonly revelationFilter = signal<SurahRevelationFilter>('all');
  protected readonly quickJumpInput = signal('');
  protected readonly quickJumpError = signal(false);
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
    const raw = this.indexQuery().trim().normalize('NFKC').toLowerCase();
    if (!raw) {
      return byType;
    }
    return byType.filter((s) => this.surahMatchesQuery(s, raw));
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
    this.title.setTitle(this.ui.translate('documentTitleHome'));
    if (isPlatformBrowser(this.platformId)) {
      this.savedPlace.set(this.bookmarkRepo.read());
    }

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
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (payload) {
          this.themeCount.set(payload.themes.length);
        }
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
    this.title.setTitle(this.ui.translate('documentTitleHome'));
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
    return this.ui.locale() === 'ur' ? tr.ur : tr.en;
  }

  protected setRevelationFilter(filter: SurahRevelationFilter): void {
    this.revelationFilter.set(filter);
  }

  protected surahByNumber(num: number): QuranSurahPayload | null {
    return this.surahs().find((s) => s.number === num) ?? null;
  }

  protected onQuickJump(): void {
    const raw = this.quickJumpInput().trim();
    if (!raw) {
      this.quickJumpError.set(true);
      return;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > 114) {
      this.quickJumpError.set(true);
      return;
    }
    this.quickJumpError.set(false);
    void this.router.navigate(['/', n]);
  }

  protected retryCorpusLoad(): void {
    this.corpusLoading.set(true);
    this.corpusError.set(false);
    this.quranData.retryLoad();
  }

  private applyCorpus(payload: QuranFullPayload): void {
    this.surahs.set(payload.surahs);
    this.daily.set(this.dailyVerse.verseForDate(payload));
    this.corpusLoading.set(false);
    this.corpusError.set(false);
  }

  private surahMatchesQuery(s: QuranSurahPayload, needle: string): boolean {
    if (String(s.number).includes(needle)) {
      return true;
    }
    if (s.nameAr.includes(needle)) {
      return true;
    }
    if (s.nameTranslit.toLowerCase().includes(needle)) {
      return true;
    }
    return false;
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
