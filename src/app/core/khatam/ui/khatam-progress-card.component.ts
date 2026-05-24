import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiLocaleService } from '../../ui/ui-locale.service';
import { UiTranslatePipe } from '../../ui/ui-translate.pipe';
import { KhatamService } from '../khatam.service';

export type KhatamCardVariant = 'hero' | 'compact';

/**
 * Shared Khatam tracker UI: progress bar, stats, 30-juz grid, and actions.
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

  readonly variant = input<KhatamCardVariant>('hero');
  readonly headingId = input<string | null>(null);
  readonly formatUiNum = input.required<(n: number) => string>();
  /** Arabic surah name at the current furthest verse (landing detail line). */
  readonly placeNameAr = input<string | null>(null);
  /** When set, Continue renders as a router link instead of emitting. */
  readonly continueRouterLink = input<readonly (string | number)[] | null>(null);
  readonly continueFragment = input<string | null>(null);

  readonly start = output<void>();
  readonly startNew = output<void>();
  readonly continue = output<void>();

  protected format(n: number): string {
    return this.formatUiNum()(n);
  }

  protected onStart(): void {
    this.start.emit();
  }

  protected onStartNew(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.khatam.isActive() && !window.confirm(this.ui.translate('khatamNewConfirm'))) {
      return;
    }
    this.startNew.emit();
  }

  protected onContinue(): void {
    this.continue.emit();
  }

  protected showJuzGrid(): boolean {
    return this.variant() === 'hero';
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

  protected juzGridAriaLabel(): string {
    const p = this.khatam.progress();
    return this.ui.translate('khatamJuzGridAria', {
      completed: this.format(p.juzCompleted),
      total: this.format(p.totalJuz),
    });
  }
}
