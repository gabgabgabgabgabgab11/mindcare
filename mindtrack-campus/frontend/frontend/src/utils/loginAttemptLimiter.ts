const STORAGE_KEY = 'mindcare:login-failures';
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

const getAttempts = (): number[] => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    const cutoff = Date.now() - LOGIN_LOCKOUT_MS;
    return stored.filter((value): value is number => typeof value === 'number' && value > cutoff);
  } catch {
    return [];
  }
};

const saveAttempts = (attempts: number[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // The identity provider remains the authoritative protection if storage is unavailable.
  }
};

export const getLoginCooldownMs = (): number => {
  const attempts = getAttempts();
  saveAttempts(attempts);
  if (attempts.length < MAX_LOGIN_ATTEMPTS) return 0;
  return Math.max(0, attempts[0] + LOGIN_LOCKOUT_MS - Date.now());
};

export const recordFailedLogin = () => saveAttempts([...getAttempts(), Date.now()]);

export const clearFailedLogins = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op: a successful provider sign-in still establishes the session.
  }
};
