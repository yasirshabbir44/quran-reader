import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { READING_BOOKMARK_REPOSITORY } from '../bookmark/reading-bookmark.repository';
import type { ReadingBookmark } from '../bookmark/reading-bookmark.repository';
import { DailyVerseService } from '../daily-verse/daily-verse.service';
import { buildSurahPath, verseFragment } from '../routing/verse-deep-link.util';
import type { QuranFullPayload } from '../quran/quran-data.service';
import { UiLocaleService } from '../ui/ui-locale.service';
import { writeNotificationSyncState } from './notification-idb';
import { NotificationPreferencesService } from './notification-preferences.service';
import type { NotificationReminderPayload, NotificationSyncState } from './notification-storage';

type PeriodicSyncManager = {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
};

type ServiceWorkerRegistrationWithPeriodicSync = ServiceWorkerRegistration & {
  readonly periodicSync?: PeriodicSyncManager;
};

@Injectable({ providedIn: 'root' })
export class DailyReminderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly prefs = inject(NotificationPreferencesService);
  private readonly dailyVerse = inject(DailyVerseService);
  private readonly ui = inject(UiLocaleService);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly readingBookmark = inject(READING_BOOKMARK_REPOSITORY);

  private corpus: QuranFullPayload | null = null;

  async syncFromCorpus(corpus: QuranFullPayload, bookmark: ReadingBookmark | null): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.corpus = corpus;
    await this.pushState(bookmark);
    await this.requestBackgroundChecks();
  }

  async onBookmarkChanged(): Promise<void> {
    if (!this.corpus) {
      return;
    }
    await this.pushState();
  }

  async enableReminders(): Promise<'granted' | 'denied' | 'unsupported'> {
    if (!isPlatformBrowser(this.platformId) || !('Notification' in globalThis)) {
      return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      this.prefs.setEnabled(false);
      return 'denied';
    }
    this.prefs.setEnabled(true);
    await this.registerBackgroundSync();
    if (this.corpus) {
      await this.pushState();
    }
    await this.requestBackgroundChecks();
    return 'granted';
  }

  disableReminders(): void {
    this.prefs.setEnabled(false);
    void this.pushState();
  }

  async setReminderTime(hour: number, minute: number): Promise<void> {
    this.prefs.setTime(hour, minute);
    await this.pushState();
    await this.requestBackgroundChecks();
  }

  async setReminderKind(kind: 'verse-of-day' | 'saved-place'): Promise<void> {
    this.prefs.setKind(kind);
    await this.pushState();
    await this.requestBackgroundChecks();
  }

  async checkNow(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.corpus || Notification.permission !== 'granted') {
      await this.requestBackgroundChecks();
      return;
    }
    const bookmark = this.readingBookmark.read();
    const payload = this.buildPayload(this.corpus, bookmark);
    if (!payload) {
      return;
    }
    await this.pushState(bookmark);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(payload.title, {
          body: payload.body,
          tag: payload.tag,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: { url: payload.url },
        });
        return;
      }
    } catch {
      /* fall through */
    }
    new Notification(payload.title, { body: payload.body, icon: '/favicon.svg', data: { url: payload.url } });
  }

  notificationPermission(): NotificationPermission | 'unsupported' {
    if (!isPlatformBrowser(this.platformId) || !('Notification' in globalThis)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  private async pushState(explicitBookmark?: ReadingBookmark | null): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.corpus) {
      return;
    }
    const bookmark = explicitBookmark !== undefined ? explicitBookmark : this.readingBookmark.read();
    const payload = this.buildPayload(this.corpus, bookmark);
    if (!payload) {
      return;
    }
    const state: NotificationSyncState = {
      prefs: {
        ...this.prefs.snapshot(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: this.ui.locale(),
      },
      payload,
    };
    try {
      await writeNotificationSyncState(state);
    } catch {
      /* IDB unavailable */
    }
  }

  private buildPayload(
    corpus: QuranFullPayload,
    bookmark: ReadingBookmark | null,
  ): NotificationReminderPayload | null {
    const date = this.localDateKey();
    const kind = this.prefs.kind();

    if (kind === 'saved-place') {
      if (!bookmark) {
        return this.buildVersePayload(corpus, date);
      }
      const surah = corpus.surahs.find((s) => s.number === bookmark.surah);
      const verse = surah?.verses.find((v) => v.ayah === bookmark.ayah);
      if (!surah || !verse) {
        return this.buildVersePayload(corpus, date);
      }
      return {
        date,
        title: this.ui.translate('notifySavedPlaceTitle'),
        body: this.ui.translate('notifySavedPlaceBody', {
          surah: surah.nameAr,
          ayah: String(bookmark.ayah),
        }),
        url: `${buildSurahPath(bookmark.surah)}#${verseFragment(bookmark.ayah)}`,
        tag: `quran-saved-place-${date}`,
      };
    }

    return this.buildVersePayload(corpus, date);
  }

  private buildVersePayload(corpus: QuranFullPayload, date: string): NotificationReminderPayload {
    const ref = this.dailyVerse.verseForDate(corpus);
    const excerpt = ref.arabic.length > 72 ? `${ref.arabic.slice(0, 69)}…` : ref.arabic;
    return {
      date,
      title: this.ui.translate('notifyVerseOfDayTitle'),
      body: this.ui.translate('notifyVerseOfDayBody', {
        surah: ref.surahNameAr,
        ayah: String(ref.ayah),
        excerpt,
      }),
      url: `${buildSurahPath(ref.surah)}#${verseFragment(ref.ayah)}`,
      tag: `quran-verse-of-day-${date}`,
    };
  }

  private async registerBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    try {
      const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithPeriodicSync;
      if (registration.periodicSync) {
        await registration.periodicSync.register('daily-quran-reminder', {
          minInterval: 24 * 60 * 60 * 1000,
        });
      } else if ('sync' in registration) {
        await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register(
          'daily-quran-reminder',
        );
      }
    } catch {
      /* browser may block without installed PWA */
    }
  }

  private async requestBackgroundChecks(): Promise<void> {
    if (!this.prefs.enabled() || !('serviceWorker' in navigator)) {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'CHECK_REMINDER' });
    } catch {
      /* SW not registered in dev */
    }
    void this.swUpdate?.checkForUpdate();
  }

  private localDateKey(): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
}
