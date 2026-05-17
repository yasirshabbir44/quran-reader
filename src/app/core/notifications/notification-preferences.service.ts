import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_LS_KEY,
  type DailyReminderKind,
  type NotificationPreferences,
} from './notification-storage';

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly enabled = signal(DEFAULT_NOTIFICATION_PREFS.enabled);
  readonly hour = signal(DEFAULT_NOTIFICATION_PREFS.hour);
  readonly minute = signal(DEFAULT_NOTIFICATION_PREFS.minute);
  readonly kind = signal<DailyReminderKind>(DEFAULT_NOTIFICATION_PREFS.kind);
  readonly lastNotifiedDate = signal<string | null>(DEFAULT_NOTIFICATION_PREFS.lastNotifiedDate);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const stored = this.read();
    this.enabled.set(stored.enabled);
    this.hour.set(stored.hour);
    this.minute.set(stored.minute);
    this.kind.set(stored.kind);
    this.lastNotifiedDate.set(stored.lastNotifiedDate);
  }

  snapshot(): NotificationPreferences {
    return {
      enabled: this.enabled(),
      hour: this.hour(),
      minute: this.minute(),
      kind: this.kind(),
      lastNotifiedDate: this.lastNotifiedDate(),
    };
  }

  setEnabled(value: boolean): void {
    this.enabled.set(value);
    this.persist();
  }

  setTime(hour: number, minute: number): void {
    this.hour.set(this.clampHour(hour));
    this.minute.set(this.clampMinute(minute));
    this.persist();
  }

  setKind(value: DailyReminderKind): void {
    this.kind.set(value);
    this.persist();
  }

  markNotifiedToday(dateKey: string): void {
    this.lastNotifiedDate.set(dateKey);
    this.persist();
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(NOTIFICATION_LS_KEY, JSON.stringify(this.snapshot()));
    } catch {
      /* quota / private mode */
    }
  }

  private read(): NotificationPreferences {
    try {
      const raw = localStorage.getItem(NOTIFICATION_LS_KEY);
      if (!raw) {
        return DEFAULT_NOTIFICATION_PREFS;
      }
      const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
      return {
        enabled: parsed.enabled === true,
        hour: this.clampHour(Number(parsed.hour)),
        minute: this.clampMinute(Number(parsed.minute)),
        kind: parsed.kind === 'saved-place' ? 'saved-place' : 'verse-of-day',
        lastNotifiedDate:
          typeof parsed.lastNotifiedDate === 'string' ? parsed.lastNotifiedDate : null,
      };
    } catch {
      return DEFAULT_NOTIFICATION_PREFS;
    }
  }

  private clampHour(value: number): number {
    if (!Number.isFinite(value)) {
      return DEFAULT_NOTIFICATION_PREFS.hour;
    }
    return Math.min(23, Math.max(0, Math.floor(value)));
  }

  private clampMinute(value: number): number {
    if (!Number.isFinite(value)) {
      return DEFAULT_NOTIFICATION_PREFS.minute;
    }
    return Math.min(59, Math.max(0, Math.floor(value)));
  }
}
