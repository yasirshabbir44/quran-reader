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
import { RouterLink } from '@angular/router';
import { READING_BOOKMARK_REPOSITORY } from '../core/bookmark/reading-bookmark.repository';
import type { ReadingBookmark } from '../core/bookmark/reading-bookmark.repository';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly corpusSource = inject(QURAN_CORPUS_SOURCE);
  private readonly quranData = inject(QuranDataService);
  private readonly dailyVerse = inject(DailyVerseService);
  private readonly bookmarkRepo = inject(READING_BOOKMARK_REPOSITORY);
  private readonly thematicIndex = inject(ThematicIndexService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahs = signal<readonly QuranSurahPayload[]>([]);
  protected readonly daily = signal<DailyVerseRef | null>(null);
  protected readonly savedPlace = signal<ReadingBookmark | null>(null);
  protected readonly indexQuery = signal('');
  protected readonly themeCount = signal(0);
  protected readonly dailyTopic = signal<DailyThemeInspiration | null>(null);

  protected readonly filteredSurahs = computed(() => {
    const list = this.surahs();
    const raw = this.indexQuery().trim().normalize('NFKC').toLowerCase();
    if (!raw) {
      return list;
    }
    return list.filter((s) => this.surahMatchesQuery(s, raw));
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
}
