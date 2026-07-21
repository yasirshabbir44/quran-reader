import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { LearnerProgressService } from '../core/learner/learner-progress.service';
import { LearnerService } from '../core/learner/learner.service';
import type { LearnerItem, LearnerLesson } from '../core/learner/learner.types';
import { verseFragment as verseHashFragment } from '../core/routing/verse-deep-link.util';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

export type LearnerStudyMode = 'flashcards' | 'list';

@Component({
  selector: 'app-learner-lesson',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './learner-lesson.component.html',
  styleUrl: './learner-lesson.component.scss',
})
export class LearnerLessonComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly learner = inject(LearnerService);
  protected readonly progress = inject(LearnerProgressService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly lesson = signal<LearnerLesson | null>(null);
  protected readonly relatedLessons = signal<readonly LearnerLesson[]>([]);
  protected readonly mode = signal<LearnerStudyMode>('flashcards');
  protected readonly cardIndex = signal(0);
  protected readonly revealed = signal(false);
  protected readonly flipPulse = signal(false);

  protected readonly lessonProgress = computed(() => {
    const data = this.lesson();
    this.progress.progressSnapshot();
    if (!data) {
      return { known: 0, total: 0, percent: 0 };
    }
    return this.progress.lessonProgress(data);
  });

  protected readonly allKnown = computed(() => {
    const p = this.lessonProgress();
    return p.total > 0 && p.known === p.total;
  });

  protected readonly currentItem = computed(() => {
    const data = this.lesson();
    if (!data || data.items.length === 0) {
      return null;
    }
    const idx = Math.min(this.cardIndex(), data.items.length - 1);
    return data.items[idx] ?? null;
  });

  protected readonly currentKnown = computed(() => {
    const data = this.lesson();
    const item = this.currentItem();
    this.progress.progressSnapshot();
    if (!data || !item) {
      return false;
    }
    return this.progress.isKnown(data.id, item.id);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.loadError.set(false);
          this.notFound.set(false);
          this.relatedLessons.set([]);
          this.cardIndex.set(0);
          this.revealed.set(false);
          return combineLatest([this.learner.load(), this.learner.getLesson(id)]).pipe(
            map(([index, data]) => ({ id, index, data })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, index, data }) => {
        if (!index) {
          this.loading.set(false);
          this.loadError.set(true);
          return;
        }
        const exists = index.lessons.some((l) => l.id === id);
        if (!exists) {
          this.loading.set(false);
          this.notFound.set(true);
          this.syncNotFoundSeo();
          return;
        }
        if (!data) {
          return;
        }
        this.loading.set(false);
        this.lesson.set(data);
        this.syncLessonSeo(data);
        this.loadRelated(data.id);
        this.jumpToFirstUnknown(data);
      });
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    const data = this.lesson();
    if (data) {
      this.syncLessonSeo(data);
    }
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected setMode(mode: LearnerStudyMode): void {
    this.mode.set(mode);
  }

  protected reveal(): void {
    this.revealed.set(true);
    this.flipPulse.set(true);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.flipPulse.set(false), 280);
    }
  }

  protected hideReveal(): void {
    this.revealed.set(false);
  }

  protected markKnown(): void {
    const data = this.lesson();
    const item = this.currentItem();
    if (!data || !item) {
      return;
    }
    this.progress.markKnown(data.id, item.id);
    this.goNext();
  }

  protected markLearning(): void {
    const data = this.lesson();
    const item = this.currentItem();
    if (!data || !item) {
      return;
    }
    this.progress.markLearning(data.id, item.id);
    this.goNext();
  }

  protected goPrev(): void {
    const data = this.lesson();
    if (!data) {
      return;
    }
    const next = Math.max(0, this.cardIndex() - 1);
    this.cardIndex.set(next);
    this.revealed.set(false);
  }

  protected goNext(): void {
    const data = this.lesson();
    if (!data) {
      return;
    }
    const next = Math.min(data.items.length - 1, this.cardIndex() + 1);
    if (next === this.cardIndex() && next === data.items.length - 1) {
      this.revealed.set(true);
      return;
    }
    this.cardIndex.set(next);
    this.revealed.set(false);
  }

  protected jumpToCard(index: number): void {
    this.mode.set('flashcards');
    this.cardIndex.set(index);
    this.revealed.set(false);
  }

  protected isItemKnown(item: LearnerItem): boolean {
    const data = this.lesson();
    this.progress.progressSnapshot();
    if (!data) {
      return false;
    }
    return this.progress.isKnown(data.id, item.id);
  }

  protected toggleListKnown(item: LearnerItem): void {
    const data = this.lesson();
    if (!data) {
      return;
    }
    this.progress.toggleKnown(data.id, item.id);
  }

  protected resetProgress(): void {
    const data = this.lesson();
    if (!data) {
      return;
    }
    this.progress.resetLesson(data.id);
    this.cardIndex.set(0);
    this.revealed.set(false);
  }

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.learner.retryLoad();
  }

  protected skillLabel(skill: LearnerLesson['skill']): string {
    return this.ui.translate(
      skill === 'reading' ? 'learnerSkillReading' : 'learnerSkillVocabulary',
    );
  }

  protected verseLink(ref: string | undefined): readonly (string | number)[] | null {
    if (!ref) {
      return null;
    }
    const [surahRaw, ayahRaw] = ref.split(':');
    const surah = Number(surahRaw);
    const ayah = Number(ayahRaw);
    if (!Number.isFinite(surah) || surah < 1) {
      return null;
    }
    return ['/', surah];
  }

  protected verseFragment(ref: string | undefined): string | null {
    if (!ref) {
      return null;
    }
    const ayah = Number(ref.split(':')[1]);
    if (!Number.isFinite(ayah) || ayah < 1) {
      return null;
    }
    return verseHashFragment(ayah);
  }

  private jumpToFirstUnknown(data: LearnerLesson): void {
    const idx = data.items.findIndex((item) => !this.progress.isKnown(data.id, item.id));
    this.cardIndex.set(idx >= 0 ? idx : 0);
  }

  private loadRelated(id: string): void {
    this.learner
      .getRelatedLessons(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((related) => this.relatedLessons.set(related));
  }

  private syncLessonSeo(data: LearnerLesson): void {
    const origin = this.seo.siteOrigin();
    const title = this.learner.pickLocalized(data.title);
    const description = this.learner.pickLocalized(data.description);
    this.seo.apply({
      title: this.ui.translate('learnerDetailDocumentTitle', { title }),
      description,
      path: `/learn/${data.id}`,
      jsonLd: collectionPageJsonLd({
        origin,
        path: `/learn/${data.id}`,
        name: title,
        description,
      }),
    });
  }

  private syncNotFoundSeo(): void {
    this.seo.apply({
      title: this.ui.translate('learnerNotFoundTitle'),
      description: this.ui.translate('learnerNotFoundBody'),
      path: `/learn/${this.route.snapshot.paramMap.get('id') ?? ''}`,
    });
  }
}
