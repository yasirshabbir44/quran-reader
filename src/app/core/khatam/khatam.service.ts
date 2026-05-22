import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { VerseRef } from '../mushaf/mushaf-index.types';
import type { MushafIndexPayload } from '../mushaf/mushaf-index.types';
import type { QuranSurahPayload } from '../quran/quran-data.service';
import {
  buildJuzEndOrdinals,
  buildVerseOrdinals,
  compareVerseRefs,
  juzCompletedCount,
  verseOrdinal,
} from './khatam-progress.util';
import type { KhatamRepository } from './khatam.repository';
import type { KhatamProgress, KhatamSession } from './khatam.types';

const LS_KEY = 'quran-reader-khatam';
const TOTAL_JUZ = 30;

@Injectable({ providedIn: 'root' })
export class KhatamService implements KhatamRepository {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly sessionSignal = signal<KhatamSession | null>(null);
  private ordinalByKey: ReadonlyMap<string, number> = new Map();
  private totalVerses = 0;
  private juzEndOrdinals: ReadonlyMap<number, number> = new Map();

  readonly session = this.sessionSignal.asReadonly();

  readonly isActive = computed(() => {
    const s = this.sessionSignal();
    return s !== null && s.active && s.completedAt === null;
  });

  readonly isComplete = computed(() => {
    const s = this.sessionSignal();
    return s !== null && s.completedAt !== null;
  });

  readonly furthest = computed(() => this.sessionSignal()?.furthest ?? { surah: 1, ayah: 1 });

  readonly progress = computed((): KhatamProgress => {
    const s = this.sessionSignal();
    const total = this.totalVerses;
    if (!s || total <= 0) {
      return {
        percent: 0,
        versesRead: 0,
        totalVerses: total,
        juzCompleted: 0,
        totalJuz: TOTAL_JUZ,
      };
    }
    const furthestOrd = verseOrdinal(s.furthest, this.ordinalByKey);
    const versesRead = Math.min(total, Math.max(0, furthestOrd));
    const percent =
      total > 0 ? Math.min(100, Math.round((versesRead / total) * 100)) : 0;
    const juzDone = juzCompletedCount(furthestOrd, this.juzEndOrdinals);
    return {
      percent,
      versesRead,
      totalVerses: total,
      juzCompleted: juzDone,
      totalJuz: TOTAL_JUZ,
    };
  });

  hydrateFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<KhatamSession>;
      const session = this.normalizeSession(parsed);
      if (session) {
        this.sessionSignal.set(session);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }

  bindCorpus(surahs: readonly QuranSurahPayload[]): void {
    const { ordinalByKey, total } = buildVerseOrdinals(surahs);
    this.ordinalByKey = ordinalByKey;
    this.totalVerses = total;
    this.reconcileCompletion();
  }

  bindMushafIndex(index: MushafIndexPayload): void {
    if (this.ordinalByKey.size === 0) {
      return;
    }
    this.juzEndOrdinals = buildJuzEndOrdinals(index, this.ordinalByKey);
    this.reconcileCompletion();
  }

  startNew(): void {
    const now = new Date().toISOString();
    const session: KhatamSession = {
      version: 1,
      active: true,
      startedAt: now,
      furthest: { surah: 1, ayah: 1 },
      completedAt: null,
    };
    this.sessionSignal.set(session);
    this.persist(session);
  }

  recordProgress(surah: number, ayah: number): void {
    const s = this.sessionSignal();
    if (!s?.active || s.completedAt !== null || this.ordinalByKey.size === 0) {
      return;
    }
    const sNum = Math.floor(surah);
    const aNum = Math.floor(ayah);
    if (sNum < 1 || sNum > 114 || aNum < 1) {
      return;
    }
    const next: VerseRef = { surah: sNum, ayah: aNum };
    if (compareVerseRefs(next, s.furthest, this.ordinalByKey) <= 0) {
      return;
    }
    const updated: KhatamSession = { ...s, furthest: next };
    this.sessionSignal.set(updated);
    this.persist(updated);
    this.maybeAutoComplete(updated);
  }

  markComplete(): void {
    const s = this.sessionSignal();
    if (!s?.active || s.completedAt !== null) {
      return;
    }
    const completed: KhatamSession = {
      ...s,
      active: false,
      completedAt: new Date().toISOString(),
      furthest: { surah: 114, ayah: 6 },
    };
    this.sessionSignal.set(completed);
    this.persist(completed);
  }

  private maybeAutoComplete(session: KhatamSession): void {
    if (this.totalVerses <= 0) {
      return;
    }
    const ord = verseOrdinal(session.furthest, this.ordinalByKey);
    if (ord >= this.totalVerses) {
      const completed: KhatamSession = {
        ...session,
        active: false,
        completedAt: new Date().toISOString(),
      };
      this.sessionSignal.set(completed);
      this.persist(completed);
    }
  }

  private reconcileCompletion(): void {
    const s = this.sessionSignal();
    if (!s?.active || s.completedAt !== null || this.totalVerses <= 0) {
      return;
    }
    this.maybeAutoComplete(s);
  }

  private persist(session: KhatamSession): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(session));
    } catch {
      /* quota / private mode */
    }
  }

  private normalizeSession(raw: Partial<KhatamSession>): KhatamSession | null {
    if (raw.version !== 1) {
      return null;
    }
    const surah = Number(raw.furthest?.surah);
    const ayah = Number(raw.furthest?.ayah);
    if (!Number.isFinite(surah) || !Number.isFinite(ayah)) {
      return null;
    }
    const s = Math.floor(surah);
    const a = Math.floor(ayah);
    if (s < 1 || s > 114 || a < 1) {
      return null;
    }
    return {
      version: 1,
      active: raw.active === true,
      startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : new Date().toISOString(),
      furthest: { surah: s, ayah: a },
      completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
    };
  }
}
