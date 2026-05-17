import type { UiLocaleCode } from '../ui/ui-locale.service';

export const NOTIFICATION_DB_NAME = 'quran-daily-reminders';
export const NOTIFICATION_DB_VERSION = 1;
export const NOTIFICATION_STORE = 'state';
export const NOTIFICATION_STATE_KEY = 'current';

export type DailyReminderKind = 'verse-of-day' | 'saved-place';

export interface NotificationPreferences {
  readonly enabled: boolean;
  readonly hour: number;
  readonly minute: number;
  readonly kind: DailyReminderKind;
  readonly lastNotifiedDate: string | null;
}

export interface NotificationReminderPayload {
  readonly date: string;
  readonly title: string;
  readonly body: string;
  readonly url: string;
  readonly tag: string;
}

export interface NotificationSyncState {
  readonly prefs: NotificationPreferences & {
    readonly timeZone: string;
    readonly locale: UiLocaleCode;
  };
  readonly payload: NotificationReminderPayload;
}

export const NOTIFICATION_LS_KEY = 'surah-reader-daily-notify';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: false,
  hour: 8,
  minute: 0,
  kind: 'verse-of-day',
  lastNotifiedDate: null,
};
