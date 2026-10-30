import type { JournalEntry, WellnessCheckInResponse } from '../types';

const STREAK_CELEBRATION_KEY = 'mindcare:streak-celebration-pending';
export const STREAK_CELEBRATION_EVENT = 'mindcare:streak-increased';

/** Convert a timestamp to a calendar-day number using the viewer's local date. */
const getLocalDayNumber = (value: string | Date): number | null => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(
    Date.UTC(localMidnight.getFullYear(), localMidnight.getMonth(), localMidnight.getDate()) / 86_400_000,
  );
};

/**
 * Count consecutive local calendar days with at least one journal or mood
 * check-in. Yesterday's streak remains active until today ends; older activity
 * starts over at the next successful activity.
 */
export const getActivityStreak = (
  journalEntries: JournalEntry[],
  checkIns: WellnessCheckInResponse[],
  now = new Date(),
): number => {
  const today = getLocalDayNumber(now);
  if (today === null) return 0;

  const activeDays = new Set<number>();
  [...journalEntries, ...checkIns].forEach((activity) => {
    const day = getLocalDayNumber(activity.created_at);
    if (day !== null) activeDays.add(day);
  });

  if (activeDays.size === 0) return 0;
  const latestDay = Math.max(...activeDays);
  const daysSinceActivity = today - latestDay;
  if (daysSinceActivity < 0 || daysSinceActivity > 1) return 0;

  let streak = 0;
  for (let day = latestDay; activeDays.has(day); day -= 1) streak += 1;
  return streak;
};

/** Queue a one-shot celebration for the dashboard, including across routes. */
export const queueStreakCelebration = () => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(STREAK_CELEBRATION_KEY, String(Date.now()));
  } catch {
    // The in-app event still works if session storage is unavailable.
  }
  window.dispatchEvent(new Event(STREAK_CELEBRATION_EVENT));
};

export const consumePendingStreakCelebration = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const timestamp = Number(window.sessionStorage.getItem(STREAK_CELEBRATION_KEY));
    window.sessionStorage.removeItem(STREAK_CELEBRATION_KEY);
    return Number.isFinite(timestamp) && Date.now() - timestamp < 5 * 60 * 1000;
  } catch {
    return false;
  }
};
