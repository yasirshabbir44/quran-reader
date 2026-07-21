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
import { buildJuzSegmentStates, daysSinceIsoDate } from './khatam-juz-grid.util';
import type { KhatamJuzSegmentState } from './khatam-juz-grid.util';
import {
  dailyTargetForPlan,
  estimateDaysRemaining,
  isKhatamPacePlan,
  localDateKey,
  todayPercent,
} from './khatam-pace.util';
import type { KhatamRepository } from './khatam.repository';
import type {
  KhatamPacePlan,
  KhatamProgress,
  KhatamSession,
  KhatamStartOptions,
} from './khatam.types';
import { verseRefKey } from '../mushaf/mushaf-slice.util';

const LS_KEY = 'quran-reader-khatam';
const TOTAL_JUZ = 30;

@Injectable({ providedIn: 'root' })
export class KhatamService implements KhatamRepository {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly sessionSignal = signal<KhatamSession | null>(null);
  private ordinalByKey: ReadonlyMap<string, number> = new Map();
  private totalVerses = 0;
  private juzEndOrdinals: ReadonlyMap<number, number> = new Map();
  private verseJuzByKey: Readonly<Record<string, number>> = {};
  private juzStarts: ReadonlyMap<number, VerseRef> = new Map();
  private pendingMushafIndex: MushafIndexPayload | null = null;
  /** When true, snap dayStartOrdinal to furthest once corpus ordinals are ready. */
  private dayStartNeedsResolve = false;

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

  readonly startedAt = computed(() => this.sessionSignal()?.startedAt ?? null);

  readonly completedAt = computed(() => this.sessionSignal()?.completedAt ?? null);

  readonly pacePlan = computed((): KhatamPacePlan => this.sessionSignal()?.pacePlan ?? 'free');

  readonly completedCount = computed(() => this.sessionSignal()?.completedCount ?? 0);

  readonly juzSegments = computed((): readonly KhatamJuzSegmentState[] => {
    const s = this.sessionSignal();
    const p = this.progress();
    if (!s) {
      return buildJuzSegmentStates(0, null, false);
    }
    return buildJuzSegmentStates(p.juzCompleted, p.currentJuz, s.completedAt !== null);
  });

  readonly progress = computed((): KhatamProgress => {
    const s = this.sessionSignal();
    const total = this.totalVerses;
    const empty: KhatamProgress = {
      percent: 0,
      versesRead: 0,
      totalVerses: total,
      versesRemaining: total,
      juzCompleted: 0,
      totalJuz: TOTAL_JUZ,
      currentJuz: null,
      daysSinceStart: daysSinceIsoDate(s?.startedAt),
      pacePlan: s?.pacePlan ?? 'free',
      dailyTarget: dailyTargetForPlan(s?.pacePlan ?? 'free', total),
      versesReadToday: 0,
      todayPercent: 0,
      daysRemainingEstimate: null,
      completedCount: s?.completedCount ?? 0,
    };
    if (!s || total <= 0) {
      return empty;
    }
    const furthestOrd = verseOrdinal(s.furthest, this.ordinalByKey);
    const versesRead = Math.min(total, Math.max(0, furthestOrd));
    const versesRemaining = Math.max(0, total - versesRead);
    const percent = total > 0 ? Math.min(100, Math.round((versesRead / total) * 100)) : 0;
    const juzDone = juzCompletedCount(furthestOrd, this.juzEndOrdinals);
    const currentJuz = this.currentJuzForRef(s.furthest);
    const dailyTarget = dailyTargetForPlan(s.pacePlan, total);
    const versesReadToday = this.dayStartNeedsResolve
      ? 0
      : Math.max(0, furthestOrd - Math.max(0, s.dayStartOrdinal));
    const daysSinceStart = daysSinceIsoDate(s.startedAt);
    return {
      percent,
      versesRead,
      totalVerses: total,
      versesRemaining,
      juzCompleted: juzDone,
      totalJuz: TOTAL_JUZ,
      currentJuz,
      daysSinceStart,
      pacePlan: s.pacePlan,
      dailyTarget,
      versesReadToday,
      todayPercent: todayPercent(versesReadToday, dailyTarget),
      daysRemainingEstimate: estimateDaysRemaining({
        versesRemaining,
        dailyTarget,
        versesReadToday,
        daysSinceStart,
        versesRead,
      }),
      completedCount: s.completedCount,
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
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const session = this.normalizeSession(parsed);
      if (session) {
        const rolled = this.rollDayWindow(session);
        this.sessionSignal.set(rolled);
        if (rolled !== session) {
          this.persist(rolled);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }

  /** Call from UI init so the daily window rolls after midnight. */
  syncDay(): void {
    const s = this.sessionSignal();
    if (!s?.active || s.completedAt !== null) {
      return;
    }
    const rolled = this.rollDayWindow(s);
    if (rolled !== s) {
      this.sessionSignal.set(rolled);
      this.persist(rolled);
    }
  }

  bindCorpus(surahs: readonly QuranSurahPayload[]): void {
    const { ordinalByKey, total } = buildVerseOrdinals(surahs);
    this.ordinalByKey = ordinalByKey;
    this.totalVerses = total;
    this.applyJuzEndOrdinals();
    this.resolveDayStartIfNeeded();
    this.reconcileCompletion();
  }

  bindMushafIndex(index: MushafIndexPayload): void {
    this.pendingMushafIndex = index;
    this.verseJuzByKey = index.verseJuz;
    const starts = new Map<number, VerseRef>();
    for (const j of index.juz) {
      starts.set(j.juz, j.start);
    }
    this.juzStarts = starts;
    this.applyJuzEndOrdinals();
    this.reconcileCompletion();
  }

  /** First verse of a juz (1–30), when mushaf index is bound. */
  juzStart(juz: number): VerseRef | null {
    const n = Math.floor(juz);
    if (n < 1 || n > TOTAL_JUZ) {
      return null;
    }
    return this.juzStarts.get(n) ?? null;
  }

  private applyJuzEndOrdinals(): void {
    const index = this.pendingMushafIndex;
    if (!index || this.ordinalByKey.size === 0) {
      return;
    }
    this.juzEndOrdinals = buildJuzEndOrdinals(index, this.ordinalByKey);
  }

  private currentJuzForRef(ref: { surah: number; ayah: number }): number | null {
    const juz = this.verseJuzByKey[verseRefKey(ref)];
    return typeof juz === 'number' && juz >= 1 && juz <= TOTAL_JUZ ? juz : null;
  }

  startNew(options: KhatamStartOptions = {}): void {
    const now = new Date();
    const from = options.from ?? { surah: 1, ayah: 1 };
    const sNum = Math.floor(from.surah);
    const aNum = Math.floor(from.ayah);
    const furthest: VerseRef = {
      surah: sNum >= 1 && sNum <= 114 ? sNum : 1,
      ayah: aNum >= 1 ? aNum : 1,
    };
    const corpusReady = this.ordinalByKey.size > 0;
    const startOrd = corpusReady ? verseOrdinal(furthest, this.ordinalByKey) : 0;
    this.dayStartNeedsResolve = !corpusReady;
    const prevCount = this.sessionSignal()?.completedCount ?? 0;
    const session: KhatamSession = {
      version: 2,
      active: true,
      startedAt: now.toISOString(),
      furthest,
      completedAt: null,
      pacePlan: options.pacePlan ?? 'free',
      dayKey: localDateKey(now),
      dayStartOrdinal: Math.max(0, startOrd),
      completedCount: prevCount,
    };
    this.sessionSignal.set(session);
    this.persist(session);
  }

  setPacePlan(plan: KhatamPacePlan): void {
    const s = this.sessionSignal();
    if (!s) {
      return;
    }
    if (s.pacePlan === plan) {
      return;
    }
    const updated: KhatamSession = { ...s, pacePlan: plan };
    this.sessionSignal.set(updated);
    this.persist(updated);
  }

  recordProgress(surah: number, ayah: number): void {
    let s = this.sessionSignal();
    if (!s?.active || s.completedAt !== null || this.ordinalByKey.size === 0) {
      return;
    }
    s = this.rollDayWindow(s);
    const sNum = Math.floor(surah);
    const aNum = Math.floor(ayah);
    if (sNum < 1 || sNum > 114 || aNum < 1) {
      return;
    }
    const next: VerseRef = { surah: sNum, ayah: aNum };
    if (compareVerseRefs(next, s.furthest, this.ordinalByKey) <= 0) {
      if (s !== this.sessionSignal()) {
        this.sessionSignal.set(s);
        this.persist(s);
      }
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
      completedCount: s.completedCount + 1,
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
        completedCount: session.completedCount + 1,
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

  /**
   * After corpus bind: if we started/migrated without ordinals, set dayStart to
   * current furthest so historical progress is not counted as “today”.
   */
  private resolveDayStartIfNeeded(): void {
    if (!this.dayStartNeedsResolve || this.ordinalByKey.size === 0) {
      return;
    }
    const s = this.sessionSignal();
    if (!s) {
      this.dayStartNeedsResolve = false;
      return;
    }
    const ord = verseOrdinal(s.furthest, this.ordinalByKey);
    const updated: KhatamSession = {
      ...s,
      dayStartOrdinal: Math.max(0, ord),
    };
    this.dayStartNeedsResolve = false;
    this.sessionSignal.set(updated);
    this.persist(updated);
  }

  private rollDayWindow(session: KhatamSession): KhatamSession {
    if (!session.active || session.completedAt !== null) {
      return session;
    }
    const today = localDateKey();
    if (session.dayKey === today) {
      return session;
    }
    const ord =
      this.ordinalByKey.size > 0
        ? verseOrdinal(session.furthest, this.ordinalByKey)
        : session.dayStartOrdinal;
    return {
      ...session,
      dayKey: today,
      dayStartOrdinal: Math.max(0, ord),
    };
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

  private normalizeSession(raw: Record<string, unknown>): KhatamSession | null {
    const version = Number(raw['version']);
    if (version !== 1 && version !== 2) {
      return null;
    }
    const furthestRaw = raw['furthest'] as { surah?: unknown; ayah?: unknown } | undefined;
    const surah = Number(furthestRaw?.surah);
    const ayah = Number(furthestRaw?.ayah);
    if (!Number.isFinite(surah) || !Number.isFinite(ayah)) {
      return null;
    }
    const s = Math.floor(surah);
    const a = Math.floor(ayah);
    if (s < 1 || s > 114 || a < 1) {
      return null;
    }
    const furthest: VerseRef = { surah: s, ayah: a };
    const pacePlan: KhatamPacePlan = isKhatamPacePlan(raw['pacePlan'])
      ? raw['pacePlan']
      : 'free';
    const completedAt =
      typeof raw['completedAt'] === 'string' ? (raw['completedAt'] as string) : null;
    const completedCountRaw = raw['completedCount'];
    const completedCount =
      typeof completedCountRaw === 'number' && completedCountRaw >= 0
        ? Math.floor(completedCountRaw)
        : completedAt
          ? 1
          : 0;
    const dayKeyRaw = raw['dayKey'];
    const dayKey =
      typeof dayKeyRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dayKeyRaw)
        ? dayKeyRaw
        : localDateKey();
    const dayStartRaw = raw['dayStartOrdinal'];
    const hasDayStart = typeof dayStartRaw === 'number' && dayStartRaw >= 0;
    // v1 sessions (and any store missing dayStart) must resolve after corpus bind.
    this.dayStartNeedsResolve = version === 1 || !hasDayStart;
    const dayStartOrdinal = hasDayStart ? Math.floor(dayStartRaw) : 0;
    return {
      version: 2,
      active: raw['active'] === true,
      startedAt:
        typeof raw['startedAt'] === 'string'
          ? (raw['startedAt'] as string)
          : new Date().toISOString(),
      furthest,
      completedAt,
      pacePlan,
      dayKey,
      dayStartOrdinal,
      completedCount,
    };
  }
}
