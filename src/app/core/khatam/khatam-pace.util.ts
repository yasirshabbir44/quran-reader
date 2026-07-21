import type { KhatamPacePlan } from './khatam.types';

const TOTAL_JUZ = 30;

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isKhatamPacePlan(value: unknown): value is KhatamPacePlan {
  return value === 'free' || value === 'juz' || value === '30day' || value === '60day';
}

/** Verses to aim for per day under a pace plan. */
export function dailyTargetForPlan(
  plan: KhatamPacePlan,
  totalVerses: number,
): number | null {
  if (totalVerses <= 0 || plan === 'free') {
    return null;
  }
  const days =
    plan === 'juz' ? TOTAL_JUZ : plan === '30day' ? 30 : plan === '60day' ? 60 : 0;
  if (days <= 0) {
    return null;
  }
  return Math.max(1, Math.ceil(totalVerses / days));
}

/**
 * Days left estimate: prefer pace-plan target; otherwise use today's rate
 * when at least one verse was read today.
 */
export function estimateDaysRemaining(input: {
  readonly versesRemaining: number;
  readonly dailyTarget: number | null;
  readonly versesReadToday: number;
  readonly daysSinceStart: number | null;
  readonly versesRead: number;
}): number | null {
  const { versesRemaining, dailyTarget, versesReadToday, daysSinceStart, versesRead } =
    input;
  if (versesRemaining <= 0) {
    return 0;
  }
  if (dailyTarget !== null && dailyTarget > 0) {
    return Math.max(1, Math.ceil(versesRemaining / dailyTarget));
  }
  if (versesReadToday > 0) {
    return Math.max(1, Math.ceil(versesRemaining / versesReadToday));
  }
  if (
    daysSinceStart !== null &&
    daysSinceStart > 0 &&
    versesRead > 0
  ) {
    const perDay = versesRead / (daysSinceStart + 1);
    if (perDay > 0) {
      return Math.max(1, Math.ceil(versesRemaining / perDay));
    }
  }
  return null;
}

export function todayPercent(versesReadToday: number, dailyTarget: number | null): number {
  if (dailyTarget === null || dailyTarget <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((versesReadToday / dailyTarget) * 100));
}
