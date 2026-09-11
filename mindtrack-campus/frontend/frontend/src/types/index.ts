// Hand-mirrored from backend/app/schemas/*.py.
// When a Pydantic schema changes, update the matching interface here.

export type Role = 'student' | 'admin';

// auth.py -> MeResponse
export interface MeResponse {
  id: string;
  email: string | null;
  role: Role;
  year_level: string | null;
  program: string | null;
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
  updated_at: string;
  anonymize_activity_description: string;
}

export interface PrivacySettingsUpdateRequest {
  allow_activity_tracking: boolean;
  anonymize_activity: boolean;
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
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface MantraWallPost {
  id: string;
  post_type: MantraPostType;
  content: string;
  nickname: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
  anonymity_notice: string;
  seek_assistance_notice: string;
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

export interface MantraWallModerateRequest {
  moderation_status: ModerationStatus;
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

