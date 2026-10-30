import type {
  JournalEntry,
  MeResponse,
  WellnessCheckInResponse,
  WellnessPriorityResponse,
} from '../types';

export interface StudentDashboardCache {
  user: MeResponse;
  journalEntries: JournalEntry[];
  checkIns: WellnessCheckInResponse[];
  wellnessPriority: WellnessPriorityResponse;
  lastRefreshed: Date;
}

/**
 * Module-level in-memory cache for student dashboard data.
 * Mirrors the adminCache pattern: data is fetched once per session and
 * reused on subsequent navigation — no redundant API calls.
 */
export const studentCache = {
  dashboard: null as StudentDashboardCache | null,

  clear() {
    this.dashboard = null;
  },
};
