import { api } from '../config/axios';
import type {
  AssessmentQuestions,
  AssessmentResult,
  ConsentStatus,
  Gad7SubmitRequest,
  JournalAnalysis,
  JournalCreateRequest,
  JournalEntry,
  JournalFolder,
  JournalFolderRequest,
  JournalUpdateRequest,
  MantraPostType,
  MantraWallPost,
  PrivacySettings,
  PrivacySettingsUpdateRequest,
  Phq9SubmitRequest,
  WellnessCheckInCreateRequest,
  WellnessCheckInResponse,
  WellnessPriorityResponse,
  MeResponse,
  Notification,
  Resource,
  ProfileUpdateRequest,
} from '../types';

export const getCurrentUser = async () => {
  const { data } = await api.get<MeResponse>('/api/v1/auth/me');
  return data;
};

export const updateProfile = async (payload: ProfileUpdateRequest) => {
  const { data } = await api.put<MeResponse>('/api/v1/profile', payload);
  return data;
};

export const submitWellnessCheckIn = async (payload: WellnessCheckInCreateRequest) => {
  const { data } = await api.post<WellnessCheckInResponse>('/api/v1/wellness/checkins', payload);
  return data;
};

export const listWellnessCheckIns = async () => {
  const { data } = await api.get<WellnessCheckInResponse[]>('/api/v1/wellness/checkins');
  return data;
};

export const getWellnessPriority = async () => {
  const { data } = await api.get<WellnessPriorityResponse>('/api/v1/wellness/priority');
  return data;
};

export const signConsent = async () => {
  await api.post('/api/v1/consent');
};

export const getConsentStatus = async () => {
  const { data } = await api.get<ConsentStatus>('/api/v1/consent/status');
  return data;
};

export const listResources = async (category?: string, query?: string) => {
  const { data } = await api.get<Resource[]>('/api/v1/resources', { params: { category, q: query } });
  return data;
};

export const listNotifications = async (unreadOnly = false) => {
  const { data } = await api.get<Notification[]>('/api/v1/notifications', { params: { unread_only: unreadOnly } });
  return data;
};

export const markNotificationRead = async (notificationId: string) => {
  const { data } = await api.patch<Notification>(`/api/v1/notifications/${notificationId}/read`);
  window.dispatchEvent(new Event('mindcare:notifications-changed'));
  return data;
};

export const getAssessmentQuestions = async (assessment: 'phq9' | 'gad7') => {
  const { data } = await api.get<AssessmentQuestions>(`/api/v1/assessments/${assessment}`);
  return data;
};

export const submitPhq9 = async (payload: Phq9SubmitRequest) => {
  const { data } = await api.post<AssessmentResult>('/api/v1/assessments/phq9', payload);
  return data;
};

export const submitGad7 = async (payload: Gad7SubmitRequest) => {
  const { data } = await api.post<AssessmentResult>('/api/v1/assessments/gad7', payload);
  return data;
};

export const listJournalEntries = async () => {
  const { data } = await api.get<JournalEntry[]>('/api/v1/journals');
  return data;
};

export const createJournalEntry = async (payload: JournalCreateRequest) => {
  const { data } = await api.post<JournalEntry>('/api/v1/journals', payload);
  return data;
};

export const getJournalEntry = async (journalId: string) => {
  const { data } = await api.get<JournalEntry>(`/api/v1/journals/${journalId}`);
  return data;
};

export const updateJournalEntry = async (journalId: string, payload: JournalUpdateRequest) => {
  const { data } = await api.put<JournalEntry>(`/api/v1/journals/${journalId}`, payload);
  return data;
};

export const setJournalEntryArchived = async (journalId: string, isArchived: boolean) => {
  const { data } = await api.patch<JournalEntry>(`/api/v1/journals/${journalId}/archive`, { is_archived: isArchived });
  return data;
};

export const listJournalFolders = async () => {
  const { data } = await api.get<JournalFolder[]>('/api/v1/journal-folders');
  return data;
};

export const createJournalFolder = async (payload: JournalFolderRequest) => {
  const { data } = await api.post<JournalFolder>('/api/v1/journal-folders', payload);
  return data;
};

export const updateJournalFolder = async (folderId: string, payload: JournalFolderRequest) => {
  const { data } = await api.patch<JournalFolder>(`/api/v1/journal-folders/${folderId}`, payload);
  return data;
};

export const deleteJournalFolder = async (folderId: string) => {
  await api.delete(`/api/v1/journal-folders/${folderId}`);
};

export const getJournalAnalysis = async (journalId: string) => {
  const { data } = await api.get<JournalAnalysis>(`/api/v1/journals/${journalId}/analysis`);
  return data;
};

export const getPrivacySettings = async () => {
  const { data } = await api.get<PrivacySettings>('/api/v1/privacy/settings');
  return data;
};

export const updatePrivacySettings = async (payload: PrivacySettingsUpdateRequest) => {
  const { data } = await api.put<PrivacySettings>('/api/v1/privacy/settings', payload);
  return data;
};

export const listMantraWallPosts = async () => {
  const { data } = await api.get<MantraWallPost[]>('/api/v1/mantra-wall/posts');
  return data;
};

export const createMantraWallPost = async (payload: {
  post_type: MantraPostType;
  content: string;
  nickname?: string | null;
}) => {
  const { data } = await api.post<MantraWallPost>('/api/v1/mantra-wall/posts', payload);
  return data;
};

export const reportMantraWallPost = async (postId: string) => {
  await api.post(`/api/v1/mantra-wall/posts/${postId}/report`, {});
};

export const setMantraWallHeart = async (postId: string, hearted: boolean) => {
  const { data } = await api.put<Pick<MantraWallPost, 'heart_count' | 'has_sent_heart'>>(
    `/api/v1/mantra-wall/posts/${postId}/heart`, { hearted },
  );
  return data;
};
