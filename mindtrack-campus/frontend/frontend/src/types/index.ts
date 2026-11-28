// Hand-mirrored from backend/app/schemas/*.py.
// When a Pydantic schema changes, update the matching interface here.

export type Role = 'student' | 'admin';

export type CompanionPet = 'dog' | 'cat' | 'capybara' | 'rabbit';

// auth.py -> MeResponse
export interface MeResponse {
  id: string;
  email: string | null;
  role: Role;
  display_name: string | null;
  year_level: string | null;
  program: string | null;
  section: string | null;
  companion_pet: CompanionPet | null;
  companion_nickname: string | null;
  avatar_image: string | null;
  cover_image: string | null;
}

export interface ProfileUpdateRequest {
  display_name?: string;
  program?: string;
  year_level?: number;
  section?: string;
  companion_pet?: string | null;
  companion_nickname?: string | null;
  avatar_image?: string;
  cover_image?: string;
}

// wellness_checkin.py
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface WellnessCheckInCreateRequest {
  mood_score: MoodScore;
  note?: string | null;
}

export interface WellnessCheckInResponse {
  id: string;
  mood_score: number;
  mood_label: string;
  note: string | null;
  created_at: string;
  disclaimer: string;
}

// wellness.py -> WellnessPriorityResponse
export interface WellnessPriorityResponse {
  priority: string;
  contributing_factors: string[];
  rule_version: string;
  clinical_validation_status: string;
}

// privacy.py
export interface PrivacySettings {
  allow_activity_tracking: boolean;
  anonymize_activity: boolean;
  journal_insights_enabled: boolean;
  updated_at: string;
  anonymize_activity_description: string;
}

export interface PrivacySettingsUpdateRequest {
  allow_activity_tracking: boolean;
  anonymize_activity: boolean;
  journal_insights_enabled: boolean;
}

// consent.py
export interface ConsentStatus {
  has_active_consent: boolean;
  consented_version: string | null;
  current_version: string;
  signed_at: string | null;
}

export interface ConsentSignResponse {
  consent_version: string;
  signed_at: string;
  message: string;
}

export interface ConsentWithdrawResponse {
  withdrawn_at: string;
  message: string;
}

// notification.py
export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// assessment.py
export interface AssessmentQuestions {
  assessment_code: string;
  instructions: string;
  scale: Record<string, string>;
  items: string[];
}

export interface Phq9SubmitRequest {
  responses: number[];
}

export interface Gad7SubmitRequest {
  responses: number[];
}

// Shared by PHQ-9 and GAD-7 result/history responses.
export interface AssessmentResult {
  id: string;
  severity_band: string;
  qualitative_feedback: string;
  escalated: boolean;
  created_at: string;
  disclaimer: string;
}

export interface AssessmentHistoryItem {
  id: string;
  severity_band: string;
  qualitative_feedback: string;
  escalated: boolean;
  created_at: string;
}

// journal.py
export interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface JournalCreateRequest {
  content: string;
}

export interface JournalAnalysis {
  sentiment_label: string;
  is_uncertain: boolean;
  analyzed_at: string;
  disclaimer: string;
}

// mantra_wall.py
export type MantraPostType = 'affirmation' | 'gratitude' | 'win';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'review' | 'archived';

export interface MantraWallPost {
  id: string;
  post_type: MantraPostType;
  content: string;
  nickname: string | null;
  moderation_status: ModerationStatus;
  filter_reason?: string | null;
  created_at: string;
  heart_count: number;
  has_sent_heart: boolean;
  anonymity_notice?: string;
  seek_assistance_notice?: string;
}

export interface MantraWallPostCreateRequest {
  post_type: MantraPostType;
  content: string;
  nickname?: string | null;
}

export interface MantraWallReportCreateRequest {
  reason?: string | null;
}

export interface AdminMantraWallReportItem {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string | null;
  created_at: string;
  post_content: string;
  post_moderation_status: ModerationStatus;
}

export interface AdminGroupedReportItem {
  post_id: string;
  post_content: string;
  post_type: MantraPostType;
  post_moderation_status: ModerationStatus;
  post_created_at: string;
  filter_reason: string | null;
  report_count: number;
  reasons: string[];
  reporter_ids: string[];
  latest_report_at: string;
}

export interface MantraWallModerateRequest {
  moderation_status: ModerationStatus;
}

export interface BulkModerateRequest {
  post_ids: string[];
  moderation_status: ModerationStatus;
}

// resource.py
export interface Resource {
  id: string;
  category: string;
  title: string;
  description: string;
  url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceCreateRequest {
  category: string;
  title: string;
  description: string;
  url?: string | null;
  is_active?: boolean;
}

export interface ResourceUpdateRequest {
  category?: string;
  title?: string;
  description?: string;
  url?: string | null;
  is_active?: boolean;
}

// audit_log.py
export interface AuditLog {
  id: string;
  event_type: string;
  actor_id: string | null;
  description: string;
  event_metadata: string | null;
  created_at: string;
}

// admin_analytics.py
export interface OverviewKPIs {
  pending_moderation_count: number;
  approved_posts_count: number;
  archived_count: number;
  active_resources_count: number;
  audit_events_7d_count: number;
  unresolved_reports_count: number;
  mantra_post_type_distribution: Record<string, number>;
}

export interface AuditTimelineEntry {
  date: string;
  count: number;
  by_type: Record<string, number>;
}

export interface AuditTimelineResponse {
  timeline: AuditTimelineEntry[];
}

export interface ModerationTimelineEntry {
  date: string;
  pending: number;
  approved: number;
  rejected: number;
  review: number;
  archived: number;
}

export interface ModerationTimelineResponse {
  timeline: ModerationTimelineEntry[];
}

// ── Wellness Analytics (admin) ─────────────────────────────────────────────

export interface WellnessOverview {
  total_students: number;
  assessment_count: number;
  assessment_participation_rate: number | null;
  checkin_count: number;
  checkin_participation_rate: number | null;
  journal_count: number;
  journal_participation_rate: number | null;
  follow_up_flags: number;
  cohort_hidden: boolean;
  min_cohort_size: number;
}

export interface SeverityDistribution {
  minimal: number;
  mild: number;
  moderate: number;
  moderately_severe: number;
  severe: number;
}

export interface WellnessScreening {
  sample_size: number;
  average_phq9: number | null;
  average_gad7: number | null;
  phq9_distribution: SeverityDistribution;
  gad7_distribution: SeverityDistribution;
  cohort_hidden: boolean;
}

export interface GroupMetric {
  group_name: string;
  student_count: number;
  assessment_count: number;
  average_phq9: number | null;
  average_gad7: number | null;
  cohort_hidden: boolean;
}

export interface GroupAnalytics {
  groups: GroupMetric[];
}

export interface TrendPoint {
  date: string;
  average_phq9: number | null;
  average_gad7: number | null;
  assessment_count: number;
}

export interface WellnessTrend {
  trend: TrendPoint[];
}

export interface WellnessFilterOptions {
  programs: string[];
  year_levels: string[];
  sections: string[];
  academic_years: string[];
}

export interface WellnessAnalyticsFilters {
  program: string;
  year_level: string;
  section: string;
  academic_year: string;
  semester: string;
  date_range: string; // 'all' | '7d' | '30d' | '90d' | 'semester' | 'custom'
  start_date: string;
  end_date: string;
}
