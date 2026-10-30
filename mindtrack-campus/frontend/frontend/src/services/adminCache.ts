import type {
  AdminMantraWallReportItem,
  AuditLog,
  AuditTimelineEntry,
  ModerationTimelineEntry,
  OverviewKPIs,
  Resource,
} from '../types';

export interface OverviewDataCache {
  kpis: OverviewKPIs;
  auditTimeline: AuditTimelineEntry[];
  moderationTimeline: ModerationTimelineEntry[];
  recentLogs: AuditLog[];
  recentReports: AdminMantraWallReportItem[];
  lastRefreshed: Date;
}

export const adminCache = {
  overview: null as OverviewDataCache | null,
  reports: null as AdminMantraWallReportItem[] | null,
  resources: null as Resource[] | null,
  auditLogs: null as { logs: AuditLog[]; key: string } | null,

  clear() {
    this.overview = null;
    this.reports = null;
    this.resources = null;
    this.auditLogs = null;
  },
};
