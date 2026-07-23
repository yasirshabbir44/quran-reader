import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { READING_BOOKMARK_REPOSITORY } from '../../../core/bookmark/reading-bookmark.repository';
import { KhatamService } from '../../../core/khatam/khatam.service';
import {
  KhatamProgressCardComponent,
  type KhatamStartEvent,
} from '../../../core/khatam/ui/khatam-progress-card.component';
import { DailyReminderService } from '../../../core/notifications/daily-reminder.service';
import { NotificationPreferencesService } from '../../../core/notifications/notification-preferences.service';
import type { DailyReminderKind } from '../../../core/notifications/notification-storage';
import { UiTranslatePipe } from '../../../core/ui/ui-translate.pipe';
import {
  ReaderActiveAyahService,
  ReaderAudioPlaybackService,
  ReaderBookmarkUiService,
  ReaderCorpusStateService,
  ReaderPanelCoordinatorService,
  ReaderScrollStateService,
  ReaderVerseFragmentService,
  ReaderVerseActionsService,
  ReaderViewPreferencesService,
} from '../../services';

/** Adjustment sidebar: reading mode, typography, khatam, bookmarks, reminders. */
@Component({
  selector: 'app-reader-settings-panel',
  imports: [FormsModule, UiTranslatePipe, KhatamProgressCardComponent],
  templateUrl: './reader-settings-panel.component.html',
  styleUrl: './reader-settings-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderSettingsPanelComponent {
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);
  private readonly dailyReminder = inject(DailyReminderService);

  protected readonly notifyPrefs = inject(NotificationPreferencesService);
  protected readonly corpus = inject(ReaderCorpusStateService);
  protected readonly viewPrefs = inject(ReaderViewPreferencesService);
  protected readonly panels = inject(ReaderPanelCoordinatorService);
  protected readonly activeAyah = inject(ReaderActiveAyahService);
  protected readonly audio = inject(ReaderAudioPlaybackService);
  protected readonly scroll = inject(ReaderScrollStateService);
  protected readonly bookmarkUi = inject(ReaderBookmarkUiService);
  protected readonly khatam = inject(KhatamService);
  protected readonly verseActions = inject(ReaderVerseActionsService);
  protected readonly fragments = inject(ReaderVerseFragmentService);

  readonly formatUiNumRef = input.required<(n: number) => string>({ alias: 'formatUiNum' });

  protected readonly notifyPermissionError = signal<'denied' | 'unsupported' | null>(null);

  protected formatUiNum(n: number): string {
    return this.formatUiNumRef()(n);
  }

  protected closeSettingsPanel(): void {
    this.panels.closeSettings();
    this.scroll.syncTopbarHeightFromDom();
  }

  protected onFocusModeCheckboxChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.setFocusMode(input.checked);
    }
  }

  protected setFocusMode(enabled: boolean): void {
    this.viewPrefs.setFocusMode(enabled);
    if (enabled) {
      this.audio.stop();
      this.panels.closeAllOverlays();
      this.verseActions.closeQuoteSheet();
    }
    this.scroll.syncTopbarHeightFromDom();
  }

  protected onContinuousRecitationChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.audio.setContinuousMode(input.checked);
    }
  }

  protected setColorTheme(t: Parameters<ReaderViewPreferencesService['setColorTheme']>[0]): void {
    this.viewPrefs.setColorTheme(t);
  }

  protected setReadingMode(mode: 'verse-by-verse' | 'reading'): void {
    this.viewPrefs.setReadingMode(mode);
  }

  protected onTranslationCheckboxChange(key: 'en' | 'ur', event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.viewPrefs.setTranslation(key, input.checked);
    }
  }

  protected onTransliterationCheckboxChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.viewPrefs.setShowTransliteration(input.checked);
    }
  }

  protected setFont(f: Parameters<ReaderViewPreferencesService['setFont']>[0]): void {
    this.viewPrefs.setFont(f);
  }

  protected setLine(l: Parameters<ReaderViewPreferencesService['setLine']>[0]): void {
    this.viewPrefs.setLine(l);
  }

  protected setWidth(w: Parameters<ReaderViewPreferencesService['setWidth']>[0]): void {
    this.viewPrefs.setWidth(w);
  }

  protected resetReaderViewSettings(): void {
    this.viewPrefs.resetViewSettings();
  }

  protected startKhatam(event?: KhatamStartEvent): void {
    this.khatam.startNew({ pacePlan: event?.pacePlan ?? 'free' });
  }

  protected startKhatamFromBookmark(event?: KhatamStartEvent): void {
    this.bookmarkUi.refreshFromStorage();
    const place = this.bookmarkUi.savedPlace() ?? this.readingBookmark.read();
    this.khatam.startNew({
      pacePlan: event?.pacePlan ?? 'free',
      from: place ?? { surah: 1, ayah: 1 },
    });
  }

  protected resetKhatam(event?: KhatamStartEvent): void {
    this.khatam.startNew({ pacePlan: event?.pacePlan ?? 'free' });
  }

  protected goToKhatamPlace(): void {
    const ref = this.khatam.furthest();
    if (this.corpus.viewKind() !== 'surah' || ref.surah !== this.corpus.surahNumber()) {
      this.fragments.navigateWithFragment(ref.surah, ref.ayah);
      return;
    }
    this.activeAyah.navigateToVerse(ref);
  }

  protected saveBookmarkAtCurrentLine(): void {
    this.activeAyah.updateFromScroll();
    const ref = this.activeAyah.activeVerse();
    this.bookmarkUi.saveAtAyah(ref.surah, ref.ayah);
  }

  protected goToSavedBookmark(): void {
    this.bookmarkUi.refreshFromStorage();
    const b = this.bookmarkUi.savedPlace() ?? this.readingBookmark.read();
    if (!b) {
      return;
    }
    const maxAyah = this.corpus.surah()?.versesCount ?? b.ayah;
    const ayah = Math.min(Math.max(b.ayah, 1), maxAyah);
    if (this.corpus.viewKind() !== 'surah' || b.surah !== this.corpus.surahNumber()) {
      this.fragments.navigateWithFragment(b.surah, ayah);
      return;
    }
    this.activeAyah.navigateToVerse({ surah: b.surah, ayah });
  }

  protected reminderTimeValue(): string {
    const h = String(this.notifyPrefs.hour()).padStart(2, '0');
    const m = String(this.notifyPrefs.minute()).padStart(2, '0');
    return `${h}:${m}`;
  }

  protected async onDailyReminderToggle(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.notifyPermissionError.set(null);
    if (input.checked) {
      const result = await this.dailyReminder.enableReminders();
      if (result === 'denied') {
        this.notifyPermissionError.set('denied');
        input.checked = false;
      } else if (result === 'unsupported') {
        this.notifyPermissionError.set('unsupported');
        input.checked = false;
      }
      return;
    }
    this.dailyReminder.disableReminders();
  }

  protected onReminderTimeChange(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.value) {
      const [hourRaw, minuteRaw] = input.value.split(':');
      void this.dailyReminder.setReminderTime(Number(hourRaw), Number(minuteRaw));
    }
  }

  protected setReminderKind(kind: DailyReminderKind): void {
    void this.dailyReminder.setReminderKind(kind);
  }

  protected checkReminderNow(): void {
    void this.dailyReminder.checkNow();
  }

  protected notificationsUnsupported(): boolean {
    return this.dailyReminder.notificationPermission() === 'unsupported';
  }
}
