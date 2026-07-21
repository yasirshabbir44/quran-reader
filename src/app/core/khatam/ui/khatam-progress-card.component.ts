import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiLocaleService } from '../../ui/ui-locale.service';
import { UiTranslatePipe } from '../../ui/ui-translate.pipe';
import { KhatamService } from '../khatam.service';
import type { KhatamPacePlan } from '../khatam.types';

export type KhatamCardVariant = 'hero' | 'compact';

export type KhatamStartEvent = {
  readonly pacePlan: KhatamPacePlan;
};

const PACE_PLANS: readonly KhatamPacePlan[] = ['free', 'juz', '30day', '60day'];

/**
 * Shared Khatam tracker UI: progress bar, daily goal, stats, 30-juz grid, and actions.
 */
@Component({
  selector: 'app-khatam-progress-card',
  imports: [RouterLink, UiTranslatePipe],
  templateUrl: './khatam-progress-card.component.html',
  styleUrl: './khatam-progress-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KhatamProgressCardComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ui = inject(UiLocaleService);

  protected readonly khatam = inject(KhatamService);
  protected readonly pacePlans = PACE_PLANS;
  private readonly pendingPace = signal<KhatamPacePlan>('free');

  readonly variant = input<KhatamCardVariant>('hero');
  readonly headingId = input<string | null>(null);
  readonly formatUiNum = input.required<(n: number) => string>();
  /** Arabic surah name at the current furthest verse (landing detail line). */
  readonly placeNameAr = input<string | null>(null);
  /** When set, Continue renders as a router link instead of emitting. */
  readonly continueRouterLink = input<readonly (string | number)[] | null>(null);
  readonly continueFragment = input<string | null>(null);
  /** When set, show “Start from bookmark” using this place. */
  readonly bookmarkSurah = input<number | null>(null);
  readonly bookmarkAyah = input<number | null>(null);
  /** When true, juz cells navigate via routerLink `/juz/:n`. */
  readonly juzLinks = input(true);

  readonly start = output<KhatamStartEvent>();
  readonly startFromBookmark = output<KhatamStartEvent>();
  readonly startNew = output<KhatamStartEvent>();
  readonly continue = output<void>();
  readonly juzSelect = output<number>();

  protected format(n: number): string {
    return this.formatUiNum()(n);
  }

  protected activePace(): KhatamPacePlan {
    if (this.khatam.isActive() || this.khatam.isComplete()) {
      return this.khatam.pacePlan();
    }
    return this.pendingPace();
  }

  protected choosePace(plan: KhatamPacePlan): void {
    if (this.khatam.isActive() || this.khatam.isComplete()) {
      this.khatam.setPacePlan(plan);
      return;
    }
    this.pendingPace.set(plan);
  }

  protected onStart(): void {
    this.start.emit({ pacePlan: this.activePace() });
  }

  protected onStartFromBookmark(): void {
    this.startFromBookmark.emit({ pacePlan: this.activePace() });
  }

  protected onStartNew(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.khatam.isActive() && !window.confirm(this.ui.translate('khatamNewConfirm'))) {
      return;
    }
    this.startNew.emit({ pacePlan: this.activePace() });
  }

  protected onContinue(): void {
    this.continue.emit();
  }

  protected showJuzGrid(): boolean {
    return this.variant() === 'hero';
  }

  protected hasBookmark(): boolean {
    const s = this.bookmarkSurah();
    const a = this.bookmarkAyah();
    return s !== null && s >= 1 && a !== null && a >= 1;
  }

  protected daysLabel(): string {
    const days = this.khatam.progress().daysSinceStart;
    if (days === null) {
      return '';
    }
    if (days === 0) {
      return this.ui.translate('khatamDaysToday');
    }
    return this.ui.translate('khatamDaysStat', { day: this.format(days + 1) });
  }

  protected paceLabelKey(plan: KhatamPacePlan): string {
    switch (plan) {
      case 'juz':
        return 'khatamPaceJuz';
      case '30day':
        return 'khatamPace30';
      case '60day':
        return 'khatamPace60';
      default:
        return 'khatamPaceFree';
    }
  }

  protected juzGridAriaLabel(): string {
    const p = this.khatam.progress();
    return this.ui.translate('khatamJuzGridAria', {
      completed: this.format(p.juzCompleted),
      total: this.format(p.totalJuz),
    });
  }

  protected onJuzActivate(juz: number, event: Event): void {
    if (this.juzLinks()) {
      return;
    }
    event.preventDefault();
    this.juzSelect.emit(juz);
  }
}
