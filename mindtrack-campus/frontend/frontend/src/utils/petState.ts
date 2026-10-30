import type { CompanionPetState } from '../constants/pets';
import { getTimeBasedGreeting } from '../constants/pets';

const PET_STATE_KEY = 'mindcare_companion_pet_state';

/**
 * Returns the default pet state based on current hour and theme:
 * - Night (>= 21:00 or < 05:00) or dark mode -> 'sleeping'
 * - Otherwise -> 'idle'
 */
export const getDefaultPetState = (
  isDarkMode: boolean = false,
  hour: number = new Date().getHours()
): CompanionPetState => {
  const { isNight } = getTimeBasedGreeting(hour);
  return isNight || isDarkMode ? 'sleeping' : 'idle';
};

/**
 * Gets the current active pet state from storage, or falls back to the default time/theme state.
 */
export const getCompanionPetState = (
  isDarkMode: boolean = false,
  hour: number = new Date().getHours()
): CompanionPetState => {
  try {
    const saved = localStorage.getItem(PET_STATE_KEY);
    if (saved === 'idle' || saved === 'happy' || saved === 'sleeping') {
      return saved as CompanionPetState;
    }
  } catch {
    // Fall back to default
  }
  return getDefaultPetState(isDarkMode, hour);
};

/**
 * Sets the active pet state, persists it to localStorage, and broadcasts to all components.
 */
export const setCompanionPetState = (state: CompanionPetState): void => {
  try {
    localStorage.setItem(PET_STATE_KEY, state);
    window.dispatchEvent(new CustomEvent('mindcare:pet-state-changed', { detail: state }));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Resets any manual override so the state naturally follows the theme/time.
 */
export const resetCompanionPetState = (): void => {
  try {
    localStorage.removeItem(PET_STATE_KEY);
    window.dispatchEvent(new CustomEvent('mindcare:pet-state-changed', { detail: null }));
  } catch {
    // Ignore storage errors
  }
};
