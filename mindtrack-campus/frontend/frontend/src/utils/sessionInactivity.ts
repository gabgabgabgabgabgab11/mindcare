import type { Session } from '@supabase/supabase-js';

export const SESSION_INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_EXPIRED_MESSAGE_KEY = 'mindcare:session-expired';
const PREFIX = 'mindcare:last-activity:';
const fallback = new Map<string, number>();

// session_id stays stable across token refreshes and separates devices/logins.
export function sessionActivityKey(session: Pick<Session, 'access_token' | 'user'>): string {
  try {
    const encoded = session.access_token.split('.')[1];
    const claims = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof claims.session_id === 'string') return PREFIX + claims.session_id;
  } catch { /* A malformed token is rejected by Supabase/backend, not trusted here. */ }
  return PREFIX + session.user.id;
}

export function inactivityExpired(lastActivity: number, now = Date.now()): boolean {
  return !Number.isFinite(lastActivity) || lastActivity <= 0 ||
    lastActivity > now || now - lastActivity >= SESSION_INACTIVITY_MS;
}

function read(key: string, now: number): number {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved !== null) {
      const timestamp = Number(saved);
      // Invalid state fails closed rather than extending an old session.
      return timestamp;
    }
  } catch { /* Private/blocked storage: enforce within this browser runtime. */ }
  const existing = fallback.get(key);
  if (existing !== undefined) return existing;
  // Existing sessions get a seven-day grace period when this policy first rolls out.
  write(key, now);
  return now;
}

function write(key: string, now: number): void {
  fallback.set(key, now);
  try { window.localStorage.setItem(key, String(now)); } catch { /* See read fallback. */ }
}

export function isSessionInactive(session: Session, now = Date.now()): boolean {
  return inactivityExpired(read(sessionActivityKey(session), now), now);
}

// Check before touching: returning after seven days must not revive the session.
export function recordSessionActivity(session: Session, now = Date.now()): boolean {
  const key = sessionActivityKey(session);
  const previous = read(key, now);
  if (inactivityExpired(previous, now)) return false;
  if (now - previous >= 1000) write(key, now);
  return true;
}

export function markInactivitySignOut(): void {
  try { window.sessionStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, '1'); } catch { /* Optional UI notice. */ }
}

export function consumeInactivityNotice(): string | undefined {
  try {
    if (!window.sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY)) return;
    window.sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
    return 'You were signed out after seven days of inactivity. Please sign in again.';
  } catch { return; }
}
