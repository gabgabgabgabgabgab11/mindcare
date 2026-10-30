const NICKNAME_KEY = 'mindcare_pet_nickname';

export const getPetNickname = (): string => {
  try {
    return localStorage.getItem(NICKNAME_KEY) || '';
  } catch {
    return '';
  }
};

export const setPetNickname = (nickname: string): void => {
  try {
    const trimmed = nickname.trim();
    if (trimmed) {
      localStorage.setItem(NICKNAME_KEY, trimmed);
    } else {
      localStorage.removeItem(NICKNAME_KEY);
    }
    // Dispatch a custom event so all mounted components update instantly
    window.dispatchEvent(new CustomEvent('mindcare:pet-nickname-changed', { detail: trimmed }));
  } catch {
    // Ignore storage errors
  }
};
