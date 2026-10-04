import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

const LS_KEY = 'quran-reader-reading-streak';
const DEFAULT_DAILY_TARGET = 20;

export interface StreakWeeklyDay {
  readonly label: string;
  readonly dateKey: string;
  readonly isToday: boolean;
  readonly active: boolean;
}

export interface ReadingStreakState {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastActiveDate: string;
  readonly versesReadToday: number;
  readonly dailyTarget: number;
  readonly activeHistory: readonly string[]; // ISO date keys of active days (retained up to 60 days)
}

function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function previousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() - 1);
  return localDateKey(dt);
}

function getMondayOfCurrentWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  // In JS: 0 = Sun, 1 = Mon...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

@Injectable({ providedIn: 'root' })
export class ReadingStreakService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly stateSignal = signal<ReadingStreakState>({
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: localDateKey(),
    versesReadToday: 5,
    dailyTarget: DEFAULT_DAILY_TARGET,
    activeHistory: [localDateKey()],
  });

  readonly state = this.stateSignal.asReadonly();

  readonly currentStreak = computed(() => this.stateSignal().currentStreak);
  readonly bestStreak = computed(() => this.stateSignal().bestStreak);
  readonly dailyTarget = computed(() => this.stateSignal().dailyTarget);
  readonly versesReadToday = computed(() => this.stateSignal().versesReadToday);

  readonly isReadToday = computed(() => {
    const today = localDateKey();
    return this.stateSignal().lastActiveDate === today && this.stateSignal().versesReadToday > 0;
  });

  readonly dailyProgressPct = computed(() => {
    const s = this.stateSignal();
    if (s.dailyTarget <= 0) return 100;
    return Math.min(100, Math.round((s.versesReadToday / s.dailyTarget) * 100));
  });

  readonly weeklyDays = computed((): readonly StreakWeeklyDay[] => {
    const todayKey = localDateKey();
    const monday = getMondayOfCurrentWeek();
    const activeSet = new Set(this.stateSignal().activeHistory);
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const key = localDateKey(dayDate);
      const isToday = key === todayKey;
      const active = activeSet.has(key) || (isToday && this.stateSignal().versesReadToday > 0);
      return {
        label: dayLabels[i]!,
        dateKey: key,
        isToday,
        active,
      };
    });
  });

  constructor() {
    this.hydrate();
  }

  recordActivity(versesCount = 1): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const today = localDateKey();
    const prevDay = previousDateKey(today);
    const current = this.stateSignal();

    let newStreak = current.currentStreak;
    let newReadToday = current.versesReadToday;
    const historySet = new Set(current.activeHistory);

    if (current.lastActiveDate === today) {
      newReadToday += versesCount;
    } else if (current.lastActiveDate === prevDay) {
      newStreak += 1;
      newReadToday = versesCount;
    } else {
      // Streak broken, start fresh with 1
      newStreak = 1;
      newReadToday = versesCount;
    }

    historySet.add(today);
    const updatedHistory = Array.from(historySet).slice(-60);
    const newBest = Math.max(current.bestStreak, newStreak);

    const nextState: ReadingStreakState = {
      currentStreak: newStreak,
      bestStreak: newBest,
      lastActiveDate: today,
      versesReadToday: newReadToday,
      dailyTarget: current.dailyTarget,
      activeHistory: updatedHistory,
    };

    this.stateSignal.set(nextState);
    this.persist(nextState);
  }

  setDailyTarget(target: number): void {
    if (target < 1) return;
    const current = this.stateSignal();
    const nextState = { ...current, dailyTarget: target };
    this.stateSignal.set(nextState);
    this.persist(nextState);
  }

  private hydrate(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const raw = localStorage.getItem(LS_KEY);
      const today = localDateKey();
      const prevDay = previousDateKey(today);

      if (!raw) {
        // Initialize default friendly streak for new/first-time visitors
        const defaultState: ReadingStreakState = {
          currentStreak: 1,
          bestStreak: 3,
          lastActiveDate: today,
          versesReadToday: 7,
          dailyTarget: DEFAULT_DAILY_TARGET,
          activeHistory: [prevDay, today],
        };
        this.stateSignal.set(defaultState);
        this.persist(defaultState);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<ReadingStreakState>;
      const lastActive = typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : today;
      let streak = typeof parsed.currentStreak === 'number' && parsed.currentStreak > 0 ? parsed.currentStreak : 1;
      const best = typeof parsed.bestStreak === 'number' && parsed.bestStreak >= streak ? parsed.bestStreak : streak;
      let versesToday = typeof parsed.versesReadToday === 'number' ? parsed.versesReadToday : 0;
      const target = typeof parsed.dailyTarget === 'number' && parsed.dailyTarget > 0 ? parsed.dailyTarget : DEFAULT_DAILY_TARGET;
      const history = Array.isArray(parsed.activeHistory) ? parsed.activeHistory : [];

      if (lastActive !== today) {
        versesToday = 0; // New day
        if (lastActive !== prevDay) {
          // Missed more than 1 day
          streak = 0;
        }
      }

      const historySet = new Set(history);
      if (lastActive === today && versesToday > 0) {
        historySet.add(today);
      }

      const state: ReadingStreakState = {
        currentStreak: streak,
        bestStreak: best,
        lastActiveDate: lastActive,
        versesReadToday: versesToday,
        dailyTarget: target,
        activeHistory: Array.from(historySet).slice(-60),
      };

      this.stateSignal.set(state);
    } catch {
      /* Quota or storage disabled */
    }
  }

  private persist(state: ReadingStreakState): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* Quota / private mode */
    }
  }
}
