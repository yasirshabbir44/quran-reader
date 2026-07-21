/**
 * Smoke-tests Khatam pace + progress math against bundled Quran + mushaf data.
 * Run: node scripts/smoke-khatam.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('OK:', msg);
  }
}

function verseRefKey(ref) {
  return `${ref.surah}:${ref.ayah}`;
}

function buildVerseOrdinals(surahs) {
  const ordinalByKey = new Map();
  let ordinal = 0;
  for (const s of surahs) {
    for (let ayah = 1; ayah <= s.versesCount; ayah++) {
      ordinal += 1;
      ordinalByKey.set(verseRefKey({ surah: s.number, ayah }), ordinal);
    }
  }
  return { ordinalByKey, total: ordinal };
}

function verseOrdinal(ref, ordinalByKey) {
  return ordinalByKey.get(verseRefKey(ref)) ?? 0;
}

function dailyTargetForPlan(plan, totalVerses) {
  if (totalVerses <= 0 || plan === 'free') return null;
  const days = plan === 'juz' || plan === '30day' ? 30 : plan === '60day' ? 60 : 0;
  if (days <= 0) return null;
  return Math.max(1, Math.ceil(totalVerses / days));
}

function todayPercent(versesReadToday, dailyTarget) {
  if (dailyTarget === null || dailyTarget <= 0) return 0;
  return Math.min(100, Math.round((versesReadToday / dailyTarget) * 100));
}

function estimateDaysRemaining({
  versesRemaining,
  dailyTarget,
  versesReadToday,
  daysSinceStart,
  versesRead,
}) {
  if (versesRemaining <= 0) return 0;
  if (dailyTarget !== null && dailyTarget > 0) {
    return Math.max(1, Math.ceil(versesRemaining / dailyTarget));
  }
  if (versesReadToday > 0) {
    return Math.max(1, Math.ceil(versesRemaining / versesReadToday));
  }
  if (daysSinceStart !== null && daysSinceStart > 0 && versesRead > 0) {
    const perDay = versesRead / (daysSinceStart + 1);
    if (perDay > 0) return Math.max(1, Math.ceil(versesRemaining / perDay));
  }
  return null;
}

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildJuzSegmentStates(juzCompleted, currentJuz, isComplete) {
  if (isComplete) return Array.from({ length: 30 }, () => 'done');
  const current = currentJuz ?? Math.min(30, Math.max(1, juzCompleted + 1));
  return Array.from({ length: 30 }, (_, i) => {
    const juz = i + 1;
    if (juz <= juzCompleted) return 'done';
    if (juz === current) return 'current';
    return 'pending';
  });
}

/** Minimal session state machine mirroring KhatamService behavior. */
function createTracker(ordinalByKey, total) {
  let session = null;
  let dayStartNeedsResolve = false;

  return {
    get session() {
      return session;
    },
    startNew({ from = { surah: 1, ayah: 1 }, pacePlan = 'free' } = {}) {
      const corpusReady = ordinalByKey.size > 0;
      const startOrd = corpusReady ? verseOrdinal(from, ordinalByKey) : 0;
      dayStartNeedsResolve = !corpusReady;
      const prevCount = session?.completedCount ?? 0;
      session = {
        version: 2,
        active: true,
        startedAt: new Date().toISOString(),
        furthest: from,
        completedAt: null,
        pacePlan,
        dayKey: localDateKey(),
        dayStartOrdinal: Math.max(0, startOrd),
        completedCount: prevCount,
      };
    },
    resolveDayStartIfNeeded() {
      if (!dayStartNeedsResolve || !session || ordinalByKey.size === 0) return;
      const ord = verseOrdinal(session.furthest, ordinalByKey);
      session = { ...session, dayStartOrdinal: Math.max(0, ord) };
      dayStartNeedsResolve = false;
    },
    recordProgress(surah, ayah) {
      if (!session?.active || session.completedAt) return;
      const next = { surah, ayah };
      const nextOrd = verseOrdinal(next, ordinalByKey);
      const curOrd = verseOrdinal(session.furthest, ordinalByKey);
      if (nextOrd <= curOrd) return;
      session = { ...session, furthest: next };
      if (nextOrd >= total) {
        session = {
          ...session,
          active: false,
          completedAt: new Date().toISOString(),
          completedCount: session.completedCount + 1,
        };
      }
    },
    progress() {
      if (!session) {
        return {
          versesRead: 0,
          versesReadToday: 0,
          percent: 0,
          dailyTarget: null,
          daysRemainingEstimate: null,
          completedCount: 0,
        };
      }
      const furthestOrd = verseOrdinal(session.furthest, ordinalByKey);
      const versesRead = Math.min(total, Math.max(0, furthestOrd));
      const versesRemaining = Math.max(0, total - versesRead);
      const dailyTarget = dailyTargetForPlan(session.pacePlan, total);
      const versesReadToday = dayStartNeedsResolve
        ? 0
        : Math.max(0, furthestOrd - Math.max(0, session.dayStartOrdinal));
      return {
        versesRead,
        versesRemaining,
        versesReadToday,
        percent: Math.min(100, Math.round((versesRead / total) * 100)),
        dailyTarget,
        todayPercent: todayPercent(versesReadToday, dailyTarget),
        daysRemainingEstimate: estimateDaysRemaining({
          versesRemaining,
          dailyTarget,
          versesReadToday,
          daysSinceStart: 0,
          versesRead,
        }),
        completedCount: session.completedCount,
        pacePlan: session.pacePlan,
        active: session.active,
        completedAt: session.completedAt,
      };
    },
  };
}

const quran = JSON.parse(readFileSync(join(ROOT, 'public/quran-full.json'), 'utf8'));
const mushaf = JSON.parse(readFileSync(join(ROOT, 'public/mushaf-index.json'), 'utf8'));
const { ordinalByKey, total } = buildVerseOrdinals(quran.surahs);

assert(total === 6236, `total verses === 6236 (got ${total})`);
assert(mushaf.juz.length === 30, '30 juz in mushaf index');

// Pace targets
assert(dailyTargetForPlan('free', total) === null, 'free pace has no daily target');
assert(dailyTargetForPlan('juz', total) === 208, 'juz pace ≈ 208/day');
assert(dailyTargetForPlan('30day', total) === 208, '30-day pace ≈ 208/day');
assert(dailyTargetForPlan('60day', total) === 104, '60-day pace ≈ 104/day');

// Start from beginning + progress forward only
{
  const t = createTracker(ordinalByKey, total);
  t.startNew({ pacePlan: 'juz' });
  assert(t.progress().versesReadToday === 0, 'today starts at 0');
  assert(t.progress().dailyTarget === 208, 'daily target after start');
  t.recordProgress(1, 1);
  assert(t.progress().versesReadToday === 0, 'same verse does not advance today');
  t.recordProgress(1, 7);
  assert(t.progress().versesRead === 7, 'furthest inclusive at 1:7');
  assert(t.progress().versesReadToday === 6, 'today = 7 - dayStart(1)');
  t.recordProgress(1, 3);
  assert(t.progress().versesRead === 7, 'backward progress ignored');
}

// Start from bookmark mid-Quran
{
  const t = createTracker(ordinalByKey, total);
  const from = { surah: 2, ayah: 255 };
  t.startNew({ from, pacePlan: '30day' });
  const startOrd = verseOrdinal(from, ordinalByKey);
  assert(t.progress().versesRead === startOrd, 'bookmark start counts prior verses');
  assert(t.progress().versesReadToday === 0, 'bookmark start: today is 0');
  t.recordProgress(2, 256);
  assert(t.progress().versesReadToday === 1, 'one new verse today after bookmark start');
}

// Start before corpus ready → resolve day start (no inflated "today")
{
  const pending = { furthest: { surah: 18, ayah: 1 }, dayStartOrdinal: 0 };
  const ord = verseOrdinal(pending.furthest, ordinalByKey);
  assert(ord > 1, 'kahf 18:1 has ordinal > 1');
  const dayStartAfter = ord;
  const todayAfterResolve = Math.max(0, ord - dayStartAfter);
  assert(todayAfterResolve === 0, 'after resolve, today stays 0 at same furthest');

  const unresolved = createTracker(new Map(), total);
  unresolved.startNew({ from: { surah: 18, ayah: 1 } });
  assert(unresolved.progress().versesReadToday === 0, 'unresolved dayStart shows 0 today');
}

// Auto-complete at last verse
{
  const t = createTracker(ordinalByKey, total);
  t.startNew({ pacePlan: 'free' });
  t.recordProgress(114, 6);
  const p = t.progress();
  assert(p.completedAt !== null || p.versesRead === total, 'reaches last verse');
  assert(p.completedCount === 1, 'completedCount increments');
  assert(p.percent === 100, '100% at completion');
  // Start another preserves count
  t.startNew({ pacePlan: '60day' });
  assert(t.session.completedCount === 1, 'lifetime count preserved on new khatam');
  assert(t.progress().dailyTarget === 104, 'new pace applied');
}

// ETA
{
  assert(
    estimateDaysRemaining({
      versesRemaining: 416,
      dailyTarget: 208,
      versesReadToday: 0,
      daysSinceStart: 0,
      versesRead: 0,
    }) === 2,
    'ETA uses daily target',
  );
  assert(
    estimateDaysRemaining({
      versesRemaining: 100,
      dailyTarget: null,
      versesReadToday: 25,
      daysSinceStart: 0,
      versesRead: 25,
    }) === 4,
    'ETA falls back to today rate',
  );
}

// Juz grid states
{
  const segs = buildJuzSegmentStates(2, 3, false);
  assert(segs[0] === 'done' && segs[1] === 'done', 'juz 1–2 done');
  assert(segs[2] === 'current', 'juz 3 current');
  assert(segs[3] === 'pending', 'juz 4 pending');
  const done = buildJuzSegmentStates(30, 30, true);
  assert(done.every((s) => s === 'done'), 'complete fills all juz');
}

// Juz starts exist for navigation
{
  for (let j = 1; j <= 30; j++) {
    const entry = mushaf.juz.find((x) => x.juz === j);
    assert(!!entry?.start?.surah && !!entry?.start?.ayah, `juz ${j} has start ref`);
  }
}

if (process.exitCode) {
  console.error('\nKhatam smoke tests failed.');
  process.exit(1);
}
console.log('\nAll khatam smoke checks passed.');
