import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { GoogleAuthService } from '../auth/google-auth.service';
import { DriveAppDataClient, type RemoteBookmarkPayload } from './drive-app-data.client';
import type { ReadingBookmark, ReadingBookmarkRepository } from './reading-bookmark.repository';

const ANON_LS_KEY = 'surah-reader-bookmark';
const USER_LS_PREFIX = 'surah-reader-bookmark:';
/** Stamp the last write origin so we don't unnecessarily echo writes back. */
const NOW = (): number => Date.now();

interface BookmarkRecord extends ReadingBookmark {
  readonly updatedAt: number;
}

/**
 * Reading-place repository that is local-first and Google-Drive-when-available.
 *
 * Behaviour:
 *   - Always keeps an in-memory snapshot of the latest bookmark so `read()` is
 *     synchronous (used heavily by the reader for highlighting).
 *   - When signed out: persists to the legacy anonymous localStorage key.
 *   - When signed in: persists per-user localStorage AND mirrors to Drive
 *     AppData. On sign-in, fetches the remote bookmark and resolves the
 *     conflict by "most-recently-updated wins" against the per-user local
 *     value, so users who used the app offline don't lose their place.
 */
@Injectable({ providedIn: 'root' })
export class CompositeReadingBookmarkRepository implements ReadingBookmarkRepository {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(GoogleAuthService);
  private readonly drive = inject(DriveAppDataClient);

  private readonly browser: boolean;
  private readonly debounceMs = 600;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private remoteFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private remoteFlushScheduledFor: BookmarkRecord | null = null;
  private remoteFileId: string | null = null;

  /** In-memory snapshot of the latest known bookmark, used by `read()`. */
  private readonly snapshot = signal<BookmarkRecord | null>(null);
  /** Bumped after every successful remote refresh so the UI can re-read. */
  readonly remoteSyncTick = signal(0);

  constructor() {
    this.browser = isPlatformBrowser(this.platformId);
    if (!this.browser) {
      return;
    }

    // Seed the snapshot synchronously so the very first read (e.g. the home
    // redirect on initial page load) reflects whatever we know about the user.
    const initialUser = this.auth.user();
    if (initialUser) {
      this.snapshot.set(this.readUserLocal(initialUser.sub) ?? this.readAnonymousLocal());
    } else {
      this.snapshot.set(this.readAnonymousLocal());
    }

    // React to sign-in/sign-out throughout the session.
    let lastSub: string | null = initialUser?.sub ?? null;
    if (initialUser) {
      void this.refreshFromRemote(this.snapshot());
    }
    effect(() => {
      const user = this.auth.user();
      const sub = user?.sub ?? null;
      if (sub === lastSub) {
        return;
      }
      lastSub = sub;
      if (user) {
        this.onUserSignedIn(user.sub);
      } else {
        this.onUserSignedOut();
      }
    });
  }

  read(): ReadingBookmark | null {
    const r = this.snapshot();
    return r ? { surah: r.surah, ayah: r.ayah } : null;
  }

  scheduleSave(surah: number, ayah: number, onPersisted?: () => void): void {
    if (!this.browser) {
      return;
    }
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.applyLocalWrite(surah, ayah);
      this.scheduleRemoteFlush();
      onPersisted?.();
    }, this.debounceMs);
  }

  flushPending(surah: number, ayah: number): void {
    if (!this.browser) {
      return;
    }
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.applyLocalWrite(surah, ayah);
    // Best-effort remote flush; we don't await since flushPending is sometimes
    // called from visibilitychange where the tab may be backgrounded.
    this.scheduleRemoteFlush(0);
  }

  saveNow(surah: number, ayah: number): void {
    this.flushPending(surah, ayah);
  }

  private applyLocalWrite(surah: number, ayah: number): void {
    const record: BookmarkRecord = { surah, ayah, updatedAt: NOW() };
    this.snapshot.set(record);
    const sub = this.currentUserSub();
    if (sub) {
      this.writeUserLocal(sub, record);
    } else {
      this.writeAnonymousLocal(record);
    }
  }

  private scheduleRemoteFlush(delayMs = 1200): void {
    if (!this.auth.isSignedIn()) {
      return;
    }
    const current = this.snapshot();
    if (!current) {
      return;
    }
    this.remoteFlushScheduledFor = current;
    if (this.remoteFlushTimer !== null) {
      clearTimeout(this.remoteFlushTimer);
    }
    this.remoteFlushTimer = setTimeout(() => {
      this.remoteFlushTimer = null;
      const target = this.remoteFlushScheduledFor;
      this.remoteFlushScheduledFor = null;
      if (!target) {
        return;
      }
      void this.flushToRemote(target);
    }, delayMs);
  }

  private async flushToRemote(record: BookmarkRecord): Promise<void> {
    const payload: RemoteBookmarkPayload = {
      surah: record.surah,
      ayah: record.ayah,
      updatedAt: record.updatedAt,
    };
    const id = await this.drive.write(payload, this.remoteFileId);
    if (id) {
      this.remoteFileId = id;
    }
  }

  private onUserSignedIn(sub: string): void {
    const local = this.readUserLocal(sub);
    if (local) {
      this.snapshot.set(local);
    }
    // Bootstrapping the access token may bounce through GIS; this can return
    // null on first-load if the prior consent has been revoked. That's fine —
    // we just stay on the local snapshot until the user signs in again.
    void this.refreshFromRemote(local);
  }

  private async refreshFromRemote(local: BookmarkRecord | null): Promise<void> {
    const remote = await this.drive.read();
    if (!remote) {
      return;
    }
    this.remoteFileId = remote.fileId;
    if (!remote.payload) {
      // No remote yet: push up whatever we have locally so other devices see it.
      if (local) {
        this.scheduleRemoteFlush(0);
      }
      return;
    }
    const remoteRecord: BookmarkRecord = {
      surah: remote.payload.surah,
      ayah: remote.payload.ayah,
      updatedAt: remote.payload.updatedAt,
    };
    const winner = pickFreshest(local, remoteRecord);
    this.snapshot.set(winner);
    const sub = this.currentUserSub();
    if (sub) {
      this.writeUserLocal(sub, winner);
    }
    this.remoteSyncTick.update((n) => n + 1);
    if (winner === local && local && local.updatedAt > remoteRecord.updatedAt) {
      this.scheduleRemoteFlush(0);
    }
  }

  private onUserSignedOut(): void {
    if (this.remoteFlushTimer !== null) {
      clearTimeout(this.remoteFlushTimer);
      this.remoteFlushTimer = null;
    }
    this.remoteFlushScheduledFor = null;
    this.remoteFileId = null;
    this.snapshot.set(this.readAnonymousLocal());
    this.remoteSyncTick.update((n) => n + 1);
  }

  private currentUserSub(): string | null {
    return this.auth.user()?.sub ?? null;
  }

  private readAnonymousLocal(): BookmarkRecord | null {
    return readBookmarkFromLs(ANON_LS_KEY);
  }

  private writeAnonymousLocal(record: BookmarkRecord): void {
    writeBookmarkToLs(ANON_LS_KEY, record);
  }

  private readUserLocal(sub: string): BookmarkRecord | null {
    return readBookmarkFromLs(USER_LS_PREFIX + sub);
  }

  private writeUserLocal(sub: string, record: BookmarkRecord): void {
    writeBookmarkToLs(USER_LS_PREFIX + sub, record);
  }
}

function readBookmarkFromLs(key: string): BookmarkRecord | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { surah?: unknown; ayah?: unknown; updatedAt?: unknown };
    const surah = Number(parsed.surah);
    const ayah = Number(parsed.ayah);
    if (!Number.isFinite(surah) || !Number.isFinite(ayah)) {
      return null;
    }
    const s = Math.floor(surah);
    const a = Math.floor(ayah);
    if (s < 1 || s > 114 || a < 1) {
      return null;
    }
    const updatedAt = Number(parsed.updatedAt);
    return { surah: s, ayah: a, updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0 };
  } catch {
    return null;
  }
}

function writeBookmarkToLs(key: string, record: BookmarkRecord): void {
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch {
    /* private mode / quota */
  }
}

function pickFreshest(a: BookmarkRecord | null, b: BookmarkRecord): BookmarkRecord {
  if (!a) {
    return b;
  }
  return a.updatedAt >= b.updatedAt ? a : b;
}
