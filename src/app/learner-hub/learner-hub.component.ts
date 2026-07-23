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
import { RouterLink } from '@angular/router';
import { LearnerProgressService } from '../core/learner/learner-progress.service';
import { LearnerService } from '../core/learner/learner.service';
import type { LearnerLesson, LearnerSkill } from '../core/learner/learner.types';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

const LESSON_ICONS: Record<string, string> = {
  alphabet: 'ا ب',
  vowels: 'َ ِ ُ',
  words: 'كلمة',
  verse: 'آية',
};

@Component({
  selector: 'app-learner-hub',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './learner-hub.component.html',
  styleUrl: './learner-hub.component.scss',
})
export class LearnerHubComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly learner = inject(LearnerService);
  protected readonly progress = inject(LearnerProgressService);

  protected readonly ui = inject(UiLocaleService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly lessons = signal<readonly LearnerLesson[]>([]);
  protected readonly skillFilter = signal<LearnerSkill | 'all'>('all');

  protected readonly totalItems = computed(() =>
    this.lessons().reduce((sum, l) => sum + l.itemCount, 0),
  );

  protected readonly overallProgress = computed(() => {
    this.progress.progressSnapshot();
    const list = this.lessons();
    if (list.length === 0) {
      return { known: 0, total: 0, percent: 0 };
    }
    let known = 0;
    let total = 0;
    for (const lesson of list) {
      const p = this.progress.lessonProgress(lesson);
      known += p.known;
      total += p.total;
    }
    const percent = total > 0 ? Math.round((known / total) * 100) : 0;
    return { known, total, percent };
  });

  protected readonly filteredLessons = computed(() => {
    const filter = this.skillFilter();
    const list = this.lessons();
    if (filter === 'all') {
      return list;
    }
    return list.filter((l) => l.skill === filter);
  });

  protected readonly suggestedLesson = computed(() => {
    this.progress.progressSnapshot();
    const list = this.lessons();
    const incomplete = list.find((l) => {
      const p = this.progress.lessonProgress(l);
      return p.known < p.total;
    });
    return incomplete ?? list[0] ?? null;
  });

  ngOnInit(): void {
    this.syncSeo();
    this.learner
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        this.loading.set(false);
        if (!payload) {
          this.loadError.set(true);
          return;
        }
        this.lessons.set(
          [...payload.lessons].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      });
  }

  protected onLocaleChange(code: string): void {
    this.ui.setLocale(code as UiLocaleCode);
    this.syncSeo();
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  protected setSkillFilter(filter: LearnerSkill | 'all'): void {
    this.skillFilter.set(filter);
  }

  protected lessonIcon(icon: string): string {
    return LESSON_ICONS[icon] ?? 'تعلّم';
  }

  protected lessonProgressLabel(lesson: LearnerLesson): string | null {
    this.progress.progressSnapshot();
    const p = this.progress.lessonProgress(lesson);
    if (p.known <= 0) {
      return null;
    }
    if (p.known === p.total) {
      return this.ui.translate('learnerCardComplete');
    }
    return this.ui.translate('learnerCardProgress', {
      done: this.formatUiNum(p.known),
      total: this.formatUiNum(p.total),
    });
  }

  protected lessonProgressPercent(lesson: LearnerLesson): number {
    this.progress.progressSnapshot();
    return this.progress.lessonProgress(lesson).percent;
  }

  protected skillLabel(skill: LearnerSkill): string {
    return this.ui.translate(skill === 'reading' ? 'learnerSkillReading' : 'learnerSkillVocabulary');
  }

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.learner.retryLoad();
  }

  private syncSeo(): void {
    const origin = this.seo.siteOrigin();
    this.seo.apply({
      title: this.ui.translate('learnerDocumentTitle'),
      description: this.ui.translate('seoLearnerDescription'),
      path: '/learn',
      jsonLd: collectionPageJsonLd({
        origin,
        path: '/learn',
        name: this.ui.translate('learnerTitle'),
        description: this.ui.translate('seoLearnerDescription'),
      }),
    });
  }
}
