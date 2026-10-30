import { api } from '../config/axios';
import type {
  AdminGroupedReportItem,
  AdminMantraWallReportItem,
  AuditLog,
  AuditTimelineResponse,
  MantraWallPost,
  ModerationStatus,
  ModerationTimelineResponse,
  OverviewKPIs,
  Resource,
  ResourceCreateRequest,
  ResourceUpdateRequest,
} from '../types';

export const listModerationReports = async () => {
  const { data } = await api.get<AdminMantraWallReportItem[]>('/api/v1/admin/mantra-wall/reports');
  return data;
};

export const listGroupedReports = async (
  resolved = false,
  sortBy: 'reports_count' | 'newest' = 'reports_count',
) => {
  const { data } = await api.get<AdminGroupedReportItem[]>('/api/v1/admin/mantra-wall/reports/grouped', {
    params: { resolved, sort_by: sortBy },
  });
  return data;
};

export const listAdminPosts = async (status?: string) => {
  const { data } = await api.get<MantraWallPost[]>('/api/v1/admin/mantra-wall/posts', {
    params: status ? { status } : undefined,
  });
  return data;
};

export const moderateMantraPost = async (postId: string, moderationStatus: ModerationStatus) => {
  const { data } = await api.patch<MantraWallPost>(`/api/v1/admin/mantra-wall/posts/${postId}/moderate`, {
    moderation_status: moderationStatus,
  });
  return data;
};

export const bulkModerateMantraPosts = async (postIds: string[], moderationStatus: ModerationStatus) => {
  const { data } = await api.post<MantraWallPost[]>('/api/v1/admin/mantra-wall/bulk-moderate', {
    post_ids: postIds,
    moderation_status: moderationStatus,
  });
  return data;
};

export const listAdminResources = async () => {
  const { data } = await api.get<Resource[]>('/api/v1/admin/resources');
  return data;
};

export const createAdminResource = async (payload: ResourceCreateRequest) => {
  const { data } = await api.post<Resource>('/api/v1/admin/resources', payload);
  return data;
};

export const updateAdminResource = async (resourceId: string, payload: ResourceUpdateRequest) => {
  const { data } = await api.put<Resource>(`/api/v1/admin/resources/${resourceId}`, payload);
  return data;
};

export const deleteAdminResource = async (resourceId: string) => {
  await api.delete(`/api/v1/admin/resources/${resourceId}`);
};

export const listAuditLogs = async (params?: {
  eventType?: string;
  actorId?: string;
  limit?: number;
}) => {
  const { data } = await api.get<AuditLog[]>('/api/v1/admin/audit-logs', {
    params: {
      event_type: params?.eventType || undefined,
      actor_id: params?.actorId || undefined,
      limit: params?.limit || undefined,
    },
  });
  return data;
};

export const getOverviewKPIs = async () => {
  const { data } = await api.get<OverviewKPIs>('/api/v1/admin/analytics/overview');
  return data;
};

export const getAuditTimeline = async (days: number = 30) => {
  const { data } = await api.get<AuditTimelineResponse>('/api/v1/admin/analytics/audit-timeline', {
    params: { days },
  });
  return data;
};

export const getModerationTimeline = async (days: number = 30) => {
  const { data } = await api.get<ModerationTimelineResponse>('/api/v1/admin/analytics/moderation-timeline', {
    params: { days },
  });
  return data;
};

// ── Wellness Analytics API ─────────────────────────────────────────────────

import type {
  GroupAnalytics,
  WellnessAnalyticsFilters,
  WellnessFilterOptions,
  WellnessOverview,
  WellnessScreening,
  WellnessTrend,
} from '../types';

function _wellnessParams(filters: Partial<WellnessAnalyticsFilters>) {
  const params: Record<string, string> = {};
  if (filters.program) params.program = filters.program;
  if (filters.year_level) params.year_level = filters.year_level;
  if (filters.section) params.section = filters.section;
  if (filters.academic_year) params.academic_year = filters.academic_year;
  if (filters.semester && filters.semester !== 'all') params.semester = filters.semester;
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  return params;
}

export const getWellnessOverview = async (filters: Partial<WellnessAnalyticsFilters> = {}) => {
  const { data } = await api.get<WellnessOverview>('/api/v1/admin/wellness/overview', {
    params: _wellnessParams(filters),
  });
  return data;
};

export const getWellnessScreening = async (filters: Partial<WellnessAnalyticsFilters> = {}) => {
  const { data } = await api.get<WellnessScreening>('/api/v1/admin/wellness/screening', {
    params: _wellnessParams(filters),
  });
  return data;
};

export const getWellnessByGroup = async (
  groupBy: 'program' | 'year_level' | 'section',
  filters: Partial<WellnessAnalyticsFilters> = {},
) => {
  const { data } = await api.get<GroupAnalytics>('/api/v1/admin/wellness/by-group', {
    params: { group_by: groupBy, ..._wellnessParams(filters) },
  });
  return data;
};

export const getWellnessTrend = async (filters: Partial<WellnessAnalyticsFilters> = {}) => {
  const { data } = await api.get<WellnessTrend>('/api/v1/admin/wellness/trend', {
    params: _wellnessParams(filters),
  });
  return data;
};

export const getWellnessFilterOptions = async (program?: string, year_level?: string) => {
  const { data } = await api.get<WellnessFilterOptions>('/api/v1/admin/wellness/filter-options', {
    params: { program: program || undefined, year_level: year_level || undefined },
  });
  return data;
};