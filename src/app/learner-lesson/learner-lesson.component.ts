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
import {
  buildLearnerMatchPairs,
  buildLearnerQuiz,
  filterLearnerItems,
  shuffleInPlace,
  type LearnerMatchPair,
  type LearnerQuizFocus,
  type LearnerQuizQuestion,
} from '../core/learner/learner-quiz.util';
import { LearnerService } from '../core/learner/learner.service';
import type { LearnerItem, LearnerLesson } from '../core/learner/learner.types';
import { verseFragment as verseHashFragment } from '../core/routing/verse-deep-link.util';
import { collectionPageJsonLd } from '../core/seo/seo-jsonld';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService, type UiLocaleCode } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

export type LearnerStudyMode = 'flashcards' | 'quiz' | 'match' | 'list';
export type LearnerQuizPhase = 'ready' | 'playing' | 'results';
export type LearnerMatchPhase = 'ready' | 'playing' | 'complete';
export type LearnerDeckFilter = 'all' | 'learning';

@Component({
  selector: 'app-learner-lesson',
  standalone: true,
  imports: [RouterLink, FormsModule, UiTranslatePipe],
  templateUrl: './learner-lesson.component.html',
  styleUrl: './learner-lesson.component.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
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

  protected readonly deckOrder = signal<readonly number[]>([]);
  protected readonly deckFilter = signal<LearnerDeckFilter>('all');
  protected readonly deckCursor = signal(0);
  protected readonly revealed = signal(false);
  protected readonly flipPulse = signal(false);

  protected readonly quizPhase = signal<LearnerQuizPhase>('ready');
  protected readonly quizFocus = signal<LearnerQuizFocus>('all');
  protected readonly quizQuestions = signal<readonly LearnerQuizQuestion[]>([]);
  protected readonly quizIndex = signal(0);
  protected readonly quizScore = signal(0);
  protected readonly quizStreak = signal(0);
  protected readonly quizBestStreak = signal(0);
  protected readonly quizSelectedId = signal<string | null>(null);
  protected readonly quizFeedback = signal<'correct' | 'wrong' | null>(null);
  protected readonly quizPulse = signal(false);
  protected readonly quizMissedIds = signal<readonly string[]>([]);

  protected readonly matchPhase = signal<LearnerMatchPhase>('ready');
  protected readonly matchFocus = signal<LearnerQuizFocus>('all');
  protected readonly matchPairs = signal<readonly LearnerMatchPair[]>([]);
  protected readonly matchArabicOrder = signal<readonly string[]>([]);
  protected readonly matchMeaningOrder = signal<readonly string[]>([]);
  protected readonly matchMatched = signal<ReadonlySet<string>>(new Set());
  protected readonly matchSelectedArabic = signal<string | null>(null);
  protected readonly matchSelectedMeaning = signal<string | null>(null);
  protected readonly matchWrongPair = signal(false);
  protected readonly matchMoves = signal(0);

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

  protected readonly learningCount = computed(() => {
    const data = this.lesson();
    this.progress.progressSnapshot();
    if (!data) {
      return 0;
    }
    return data.items.filter((item) => !this.progress.isKnown(data.id, item.id)).length;
  });

  protected readonly deckIndices = computed(() => {
    const data = this.lesson();
    this.progress.progressSnapshot();
    if (!data) {
      return [] as number[];
    }
    const filter = this.deckFilter();
    const order = this.deckOrder();
    const base = order.length === data.items.length ? order : data.items.map((_, i) => i);
    if (filter === 'all') {
      return base;
    }
    const learning = base.filter((i) => {
      const item = data.items[i];
      return item ? !this.progress.isKnown(data.id, item.id) : false;
    });
    return learning.length > 0 ? learning : base;
  });

  protected readonly currentItem = computed(() => {
    const data = this.lesson();
    const indices = this.deckIndices();
    if (!data || indices.length === 0) {
      return null;
    }
    const cursor = Math.min(this.deckCursor(), indices.length - 1);
    const itemIndex = indices[cursor] ?? 0;
    return data.items[itemIndex] ?? null;
  });

  protected readonly currentDeckPos = computed(() => {
    const indices = this.deckIndices();
    if (indices.length === 0) {
      return { current: 0, total: 0 };
    }
    return {
      current: Math.min(this.deckCursor(), indices.length - 1) + 1,
      total: indices.length,
    };
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

  protected readonly currentQuizQuestion = computed(() => {
    const questions = this.quizQuestions();
    if (questions.length === 0) {
      return null;
    }
    const idx = Math.min(this.quizIndex(), questions.length - 1);
    return questions[idx] ?? null;
  });

  protected readonly quizPercent = computed(() => {
    const total = this.quizQuestions().length;
    if (total === 0) {
      return 0;
    }
    return Math.round((this.quizScore() / total) * 100);
  });

  protected readonly quizProgressPercent = computed(() => {
    const total = this.quizQuestions().length;
    if (total === 0) {
      return 0;
    }
    const answered = this.quizFeedback() ? this.quizIndex() + 1 : this.quizIndex();
    return Math.round((answered / total) * 100);
  });

  protected readonly canStartQuiz = computed(() => {
    const data = this.lesson();
    return !!data && data.items.length >= 2;
  });

  protected readonly quizMissedItems = computed(() => {
    const data = this.lesson();
    const missed = this.quizMissedIds();
    if (!data || missed.length === 0) {
      return [] as LearnerItem[];
    }
    const byId = new Map(data.items.map((item) => [item.id, item]));
    return missed.map((id) => byId.get(id)).filter((item): item is LearnerItem => !!item);
  });

  protected readonly matchProgressPercent = computed(() => {
    const total = this.matchPairs().length;
    if (total === 0) {
      return 0;
    }
    return Math.round((this.matchMatched().size / total) * 100);
  });

  protected readonly canStartMatch = computed(() => {
    const data = this.lesson();
    return !!data && data.items.length >= 2;
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
          this.revealed.set(false);
          this.resetQuizState();
          this.resetMatchState();
          this.deckFilter.set('all');
          this.mode.set('flashcards');
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
        this.deckOrder.set(data.items.map((_, i) => i));
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
    if (mode === this.mode()) {
      return;
    }
    this.mode.set(mode);
    this.revealed.set(false);
    if (mode === 'quiz') {
      this.quizPhase.set('ready');
      this.quizSelectedId.set(null);
      this.quizFeedback.set(null);
    }
    if (mode === 'match') {
      this.matchPhase.set('ready');
      this.matchSelectedArabic.set(null);
      this.matchSelectedMeaning.set(null);
      this.matchWrongPair.set(false);
    }
  }

  protected setDeckFilter(filter: LearnerDeckFilter): void {
    this.deckFilter.set(filter);
    this.deckCursor.set(0);
    this.revealed.set(false);
  }

  protected shuffleDeck(): void {
    const data = this.lesson();
    if (!data) {
      return;
    }
    this.deckOrder.set(shuffleInPlace(data.items.map((_, i) => i)));
    this.deckCursor.set(0);
    this.revealed.set(false);
  }

  protected setQuizFocus(focus: LearnerQuizFocus): void {
    this.quizFocus.set(focus);
  }

  protected setMatchFocus(focus: LearnerQuizFocus): void {
    this.matchFocus.set(focus);
  }

  protected startQuiz(): void {
    const data = this.lesson();
    if (!data || data.items.length < 2) {
      return;
    }
    const pool = filterLearnerItems(data.items, this.quizFocus(), (itemId) =>
      this.progress.isKnown(data.id, itemId),
    );
    const questions = buildLearnerQuiz(pool, (text) => this.learner.pickLocalized(text));
    if (questions.length === 0) {
      return;
    }
    this.quizQuestions.set(questions);
    this.quizIndex.set(0);
    this.quizScore.set(0);
    this.quizStreak.set(0);
    this.quizBestStreak.set(0);
    this.quizSelectedId.set(null);
    this.quizFeedback.set(null);
    this.quizMissedIds.set([]);
    this.quizPhase.set('playing');
  }

  protected answerQuiz(choiceId: string): void {
    if (this.quizFeedback() !== null) {
      return;
    }
    const question = this.currentQuizQuestion();
    const data = this.lesson();
    if (!question || !data) {
      return;
    }
    const correct = choiceId === question.correctChoiceId;
    this.quizSelectedId.set(choiceId);
    this.quizFeedback.set(correct ? 'correct' : 'wrong');
    this.quizPulse.set(true);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.quizPulse.set(false), 320);
    }

    if (correct) {
      this.quizScore.update((n) => n + 1);
      const streak = this.quizStreak() + 1;
      this.quizStreak.set(streak);
      this.quizBestStreak.update((best) => Math.max(best, streak));
      this.progress.markKnown(data.id, question.itemId);
    } else {
      this.quizStreak.set(0);
      this.progress.markLearning(data.id, question.itemId);
      if (!this.quizMissedIds().includes(question.itemId)) {
        this.quizMissedIds.update((ids) => [...ids, question.itemId]);
      }
    }
  }

  protected nextQuizQuestion(): void {
    const questions = this.quizQuestions();
    const next = this.quizIndex() + 1;
    if (next >= questions.length) {
      this.quizPhase.set('results');
      this.quizSelectedId.set(null);
      this.quizFeedback.set(null);
      return;
    }
    this.quizIndex.set(next);
    this.quizSelectedId.set(null);
    this.quizFeedback.set(null);
  }

  protected retryQuiz(): void {
    this.startQuiz();
  }

  protected reviewMissedInFlashcards(): void {
    const missed = this.quizMissedIds();
    const data = this.lesson();
    if (!data || missed.length === 0) {
      this.setMode('flashcards');
      return;
    }
    const indices = missed
      .map((id) => data.items.findIndex((item) => item.id === id))
      .filter((i) => i >= 0);
    if (indices.length === 0) {
      this.setMode('flashcards');
      return;
    }
    this.deckFilter.set('all');
    this.deckOrder.set([...indices, ...data.items.map((_, i) => i).filter((i) => !indices.includes(i))]);
    this.deckCursor.set(0);
    this.revealed.set(false);
    this.mode.set('flashcards');
  }

  protected choiceState(choiceId: string): 'idle' | 'correct' | 'wrong' | 'missed' {
    const feedback = this.quizFeedback();
    const selected = this.quizSelectedId();
    const question = this.currentQuizQuestion();
    if (!feedback || !question) {
      return 'idle';
    }
    if (choiceId === question.correctChoiceId) {
      return 'correct';
    }
    if (choiceId === selected && feedback === 'wrong') {
      return 'wrong';
    }
    return 'missed';
  }

  protected startMatch(): void {
    const data = this.lesson();
    if (!data || data.items.length < 2) {
      return;
    }
    const pool = filterLearnerItems(data.items, this.matchFocus(), (itemId) =>
      this.progress.isKnown(data.id, itemId),
    );
    const pairs = buildLearnerMatchPairs(pool, (text) => this.learner.pickLocalized(text));
    if (pairs.length < 2) {
      return;
    }
    const ids = pairs.map((p) => p.id);
    this.matchPairs.set(pairs);
    this.matchArabicOrder.set(shuffleInPlace([...ids]));
    this.matchMeaningOrder.set(shuffleInPlace([...ids]));
    this.matchMatched.set(new Set());
    this.matchSelectedArabic.set(null);
    this.matchSelectedMeaning.set(null);
    this.matchWrongPair.set(false);
    this.matchMoves.set(0);
    this.matchPhase.set('playing');
  }

  protected selectMatchArabic(id: string): void {
    if (this.matchPhase() !== 'playing' || this.matchMatched().has(id) || this.matchWrongPair()) {
      return;
    }
    this.matchSelectedArabic.set(id);
    this.tryResolveMatch();
  }

  protected selectMatchMeaning(id: string): void {
    if (this.matchPhase() !== 'playing' || this.matchMatched().has(id) || this.matchWrongPair()) {
      return;
    }
    this.matchSelectedMeaning.set(id);
    this.tryResolveMatch();
  }

  protected retryMatch(): void {
    this.startMatch();
  }

  protected matchPairById(id: string): LearnerMatchPair | null {
    return this.matchPairs().find((p) => p.id === id) ?? null;
  }

  protected toggleCardReveal(): void {
    if (this.revealed()) {
      this.revealed.set(false);
      return;
    }
    this.reveal();
  }

  protected reveal(): void {
    this.revealed.set(true);
    this.flipPulse.set(true);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.flipPulse.set(false), 280);
    }
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
    const indices = this.deckIndices();
    if (indices.length === 0) {
      return;
    }
    const next = Math.max(0, this.deckCursor() - 1);
    this.deckCursor.set(next);
    this.revealed.set(false);
  }

  protected goNext(): void {
    const indices = this.deckIndices();
    if (indices.length === 0) {
      return;
    }
    const next = Math.min(indices.length - 1, this.deckCursor() + 1);
    if (next === this.deckCursor() && next === indices.length - 1) {
      this.revealed.set(true);
      return;
    }
    this.deckCursor.set(next);
    this.revealed.set(false);
  }

  protected jumpToCard(index: number): void {
    this.deckFilter.set('all');
    this.deckOrder.update((order) => {
      const data = this.lesson();
      if (!data) {
        return order;
      }
      return order.length === data.items.length ? order : data.items.map((_, i) => i);
    });
    const order = this.deckOrder();
    const cursor = order.indexOf(index);
    this.deckCursor.set(cursor >= 0 ? cursor : index);
    this.revealed.set(false);
    this.mode.set('flashcards');
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
    this.deckCursor.set(0);
    this.revealed.set(false);
    this.resetQuizState();
    this.resetMatchState();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.loading() || this.loadError() || this.notFound() || !this.lesson()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
      return;
    }

    const mode = this.mode();
    if (mode === 'flashcards') {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!this.revealed()) {
          this.reveal();
        }
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const rtl = this.ui.locale() !== 'en';
        const forward = event.key === 'ArrowRight' ? !rtl : rtl;
        if (forward) {
          this.goNext();
        } else {
          this.goPrev();
        }
        return;
      }
      if (this.revealed() && (event.key === '1' || event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        this.markKnown();
        return;
      }
      if (this.revealed() && (event.key === '2' || event.key === 'l' || event.key === 'L')) {
        event.preventDefault();
        this.markLearning();
      }
      return;
    }

    if (mode === 'quiz' && this.quizPhase() === 'playing') {
      const question = this.currentQuizQuestion();
      if (!question) {
        return;
      }
      if (this.quizFeedback() && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        this.nextQuizQuestion();
        return;
      }
      if (!this.quizFeedback() && /^[1-4]$/.test(event.key)) {
        const idx = Number(event.key) - 1;
        const choice = question.choices[idx];
        if (choice) {
          event.preventDefault();
          this.answerQuiz(choice.id);
        }
      }
    }
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

  private tryResolveMatch(): void {
    const arabicId = this.matchSelectedArabic();
    const meaningId = this.matchSelectedMeaning();
    if (!arabicId || !meaningId) {
      return;
    }

    this.matchMoves.update((n) => n + 1);
    const data = this.lesson();

    if (arabicId === meaningId) {
      const next = new Set(this.matchMatched());
      next.add(arabicId);
      this.matchMatched.set(next);
      this.matchSelectedArabic.set(null);
      this.matchSelectedMeaning.set(null);
      if (data) {
        this.progress.markKnown(data.id, arabicId);
      }
      if (next.size >= this.matchPairs().length) {
        this.matchPhase.set('complete');
      }
      return;
    }

    this.matchWrongPair.set(true);
    if (data) {
      this.progress.markLearning(data.id, arabicId);
      this.progress.markLearning(data.id, meaningId);
    }
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.matchSelectedArabic.set(null);
        this.matchSelectedMeaning.set(null);
        this.matchWrongPair.set(false);
      }, 520);
    } else {
      this.matchSelectedArabic.set(null);
      this.matchSelectedMeaning.set(null);
      this.matchWrongPair.set(false);
    }
  }

  private resetQuizState(): void {
    this.quizPhase.set('ready');
    this.quizQuestions.set([]);
    this.quizIndex.set(0);
    this.quizScore.set(0);
    this.quizStreak.set(0);
    this.quizBestStreak.set(0);
    this.quizSelectedId.set(null);
    this.quizFeedback.set(null);
    this.quizPulse.set(false);
    this.quizMissedIds.set([]);
  }

  private resetMatchState(): void {
    this.matchPhase.set('ready');
    this.matchPairs.set([]);
    this.matchArabicOrder.set([]);
    this.matchMeaningOrder.set([]);
    this.matchMatched.set(new Set());
    this.matchSelectedArabic.set(null);
    this.matchSelectedMeaning.set(null);
    this.matchWrongPair.set(false);
    this.matchMoves.set(0);
  }

  private jumpToFirstUnknown(data: LearnerLesson): void {
    const idx = data.items.findIndex((item) => !this.progress.isKnown(data.id, item.id));
    const order = data.items.map((_, i) => i);
    this.deckOrder.set(order);
    this.deckCursor.set(idx >= 0 ? idx : 0);
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
