import dogIdle from '../assets/pets/dog idle.png';
import dogHappy from '../assets/pets/dog happy.png';
import dogSleeping from '../assets/pets/dog sleeping.png';

import catIdle from '../assets/pets/cat idle.png';
import catHappy from '../assets/pets/cat happy.png';
import catSleeping from '../assets/pets/cat sleeping.png';

import capybaraIdle from '../assets/pets/cappybara idle.png';
import capybaraHappy from '../assets/pets/cappybara happy.png';
import capybaraSleeping from '../assets/pets/cappybara sleeping.png';

import rabbitIdle from '../assets/pets/rabbit idle.png';
import rabbitHappy from '../assets/pets/rabbit happy.png';
import rabbitSleeping from '../assets/pets/rabbit sleeping.png';

import frogIdle from '../assets/pets/frog idle.png';
import frogHappy from '../assets/pets/frog happy.png';
import frogSleeping from '../assets/pets/frog sleeping.png';

import otterIdle from '../assets/pets/Otter idle.png';
import otterHappy from '../assets/pets/otter happy.png';
import otterSleeping from '../assets/pets/otter sleeping.png';

import redPandaIdle from '../assets/pets/red panda idle.png';
import redPandaHappy from '../assets/pets/red panda happy.png';
import redPandaSleeping from '../assets/pets/red panda sleeping.png';

import axolotlIdle from '../assets/pets/axylotyl idle.png';
import axolotlHappy from '../assets/pets/axoloytl happy.png';
import axolotlSleeping from '../assets/pets/axolotyl sleeping.png';

import bombardinoIdle from '../assets/pets/Bombardino Crocodilo idle.png';
import bombardinoHappy from '../assets/pets/Bombardino Crocodilo happy.png';
import bombardinoSleeping from '../assets/pets/Bombardino Crocodilo sleeping.png';

import cappuccinoIdle from '../assets/pets/Cappuccino Assassino idle.png';
import cappuccinoHappy from '../assets/pets/Cappuccino Assassino happy.png';
import cappuccinoSleeping from '../assets/pets/Cappuccino Assassino sleeping.png';

import cappucinaIdle from '../assets/pets/cappucina ballerina idle.png';
import cappucinaHappy from '../assets/pets/capuccina ballerina happy.png';
import cappucinaSleeping from '../assets/pets/cappucina ballerina sleeping.png';

import tralaleloIdle from '../assets/pets/tralalelo tralala idle.png';
import tralaleloHappy from '../assets/pets/tralalelo tralala happy.png';
import tralaleloSleeping from '../assets/pets/tralalelo tralala sleeping.png';

import tungtungtungIdle from '../assets/pets/tungtungtung sahur idle.png';
import tungtungtungHappy from '../assets/pets/tungtungtugn sahur happy.png';
import tungtungtungSleeping from '../assets/pets/tungtungtung sahur sleeping.png';

export type PetId =
  | 'dog'
  | 'cat'
  | 'capybara'
  | 'rabbit'
  | 'frog'
  | 'otter'
  | 'red_panda'
  | 'axolotl'
  | 'bombardino'
  | 'cappuccino_assassino'
  | 'cappucina_ballerina'
  | 'tralalelo'
  | 'tungtungtung';

export type CompanionPetState = 'idle' | 'happy' | 'sleeping';

export interface PetInfo {
  id: PetId;
  name: string;
  tagline: string;
  images: {
    idle: string;
    happy: string;
    sleeping: string;
  };
}

export const PETS: Record<PetId, PetInfo> = {
  dog: {
    id: 'dog',
    name: 'Dog',
    tagline: 'Loyal & encouraging friend',
    images: {
      idle: dogIdle,
      happy: dogHappy,
      sleeping: dogSleeping,
    },
  },
  cat: {
    id: 'cat',
    name: 'Cat',
    tagline: 'Calm & soothing companion',
    images: {
      idle: catIdle,
      happy: catHappy,
      sleeping: catSleeping,
    },
  },
  capybara: {
    id: 'capybara',
    name: 'Capybara',
    tagline: 'Gentle & relaxed buddy',
    images: {
      idle: capybaraIdle,
      happy: capybaraHappy,
      sleeping: capybaraSleeping,
    },
  },
  rabbit: {
    id: 'rabbit',
    name: 'Rabbit',
    tagline: 'Cheerful & thoughtful pal',
    images: {
      idle: rabbitIdle,
      happy: rabbitHappy,
      sleeping: rabbitSleeping,
    },
  },
  frog: {
    id: 'frog',
    name: 'Frog',
    tagline: 'Peaceful & mindful buddy',
    images: {
      idle: frogIdle,
      happy: frogHappy,
      sleeping: frogSleeping,
    },
  },
  otter: {
    id: 'otter',
    name: 'Otter',
    tagline: 'Playful & loving friend',
    images: {
      idle: otterIdle,
      happy: otterHappy,
      sleeping: otterSleeping,
    },
  },
  red_panda: {
    id: 'red_panda',
    name: 'Red Panda',
    tagline: 'Cozy & curious protector',
    images: {
      idle: redPandaIdle,
      happy: redPandaHappy,
      sleeping: redPandaSleeping,
    },
  },
  axolotl: {
    id: 'axolotl',
    name: 'Axolotl',
    tagline: 'Patient & restorative friend',
    images: {
      idle: axolotlIdle,
      happy: axolotlHappy,
      sleeping: axolotlSleeping,
    },
  },
  bombardino: {
    id: 'bombardino',
    name: 'Bombardino Crocodilo',
    tagline: 'Strong & energetic cheerleader',
    images: {
      idle: bombardinoIdle,
      happy: bombardinoHappy,
      sleeping: bombardinoSleeping,
    },
  },
  cappuccino_assassino: {
    id: 'cappuccino_assassino',
    name: 'Cappuccino Assassino',
    tagline: 'Bold spirit & sharp focus',
    images: {
      idle: cappuccinoIdle,
      happy: cappuccinoHappy,
      sleeping: cappuccinoSleeping,
    },
  },
  cappucina_ballerina: {
    id: 'cappucina_ballerina',
    name: 'Cappucina Ballerina',
    tagline: 'Graceful & inspiring companion',
    images: {
      idle: cappucinaIdle,
      happy: cappucinaHappy,
      sleeping: cappucinaSleeping,
    },
  },
  tralalelo: {
    id: 'tralalelo',
    name: 'Tralalelo Tralala',
    tagline: 'Upbeat & joyous motivator',
    images: {
      idle: tralaleloIdle,
      happy: tralaleloHappy,
      sleeping: tralaleloSleeping,
    },
  },
  tungtungtung: {
    id: 'tungtungtung',
    name: 'Tung Tung Tung Sahur',
    tagline: 'Vibrant & awakening spirit',
    images: {
      idle: tungtungtungIdle,
      happy: tungtungtungHappy,
      sleeping: tungtungtungSleeping,
    },
  },
};

export const PET_LIST = Object.values(PETS);

export const normalizePetId = (petId: string | null | undefined): PetId | null => {
  if (!petId) return null;
  const s = petId.toLowerCase().trim().replace(/[-_\s]+/g, '_');
  if (s in PETS) return s as PetId;
  if (s === 'cappybara') return 'capybara';
  if (s.includes('bombardino') || s.includes('crocodilo')) return 'bombardino';
  if (s.includes('assassino')) return 'cappuccino_assassino';
  if (s.includes('ballerina')) return 'cappucina_ballerina';
  if (s.includes('tralalelo')) return 'tralalelo';
  if (s.includes('tung') || s.includes('sahur')) return 'tungtungtung';
  if (s.includes('axolotl') || s.includes('axoloytl') || s.includes('axylotyl')) return 'axolotl';
  if (s.includes('red') || s.includes('panda')) return 'red_panda';
  if (s.includes('otter')) return 'otter';
  if (s.includes('frog')) return 'frog';
  if (s.includes('dog')) return 'dog';
  if (s.includes('cat')) return 'cat';
  if (s.includes('rabbit')) return 'rabbit';
  return null;
};

/**
 * Determines greeting and night status based on hour of day:
 * - 05:00 - 11:59: Good morning
 * - 12:00 - 17:59: Good afternoon
 * - 18:00 - 20:59: Good evening
 * - 21:00 - 04:59: Goodnight (nighttime)
 */
export const getTimeBasedGreeting = (
  hour: number = new Date().getHours()
): { greeting: string; isNight: boolean } => {
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', isNight: false };
  } else if (hour >= 12 && hour < 18) {
    return { greeting: 'Good afternoon', isNight: false };
  } else if (hour >= 18 && hour < 21) {
    return { greeting: 'Good evening', isNight: false };
  } else {
    return { greeting: 'Goodnight', isNight: true };
  }
};

/**
 * Returns the appropriate pet image depending on time of day and dark mode.
 * - After 9 PM (>= 21:00), before 5 AM (< 05:00), or when dark mode is enabled: sleepy pose
 * - Otherwise: happy pose
 */
export const getCompanionDisplay = (
  petId: string | null | undefined,
  hour: number = new Date().getHours(),
  nickname?: string | null,
  isDarkMode: boolean = false,
  state?: CompanionPetState
): {
  pet: PetInfo;
  image: string;
  isSleeping: boolean;
  statusText: string;
  state: CompanionPetState;
} | null => {
  if (!petId) return null;
  const key = normalizePetId(petId);
  if (!key) return null;
  const pet = PETS[key];
  if (!pet) return null;

  const { isNight } = getTimeBasedGreeting(hour);
  const defaultSleeping = isNight || isDarkMode;
  const resolvedState: CompanionPetState = state ?? (defaultSleeping ? 'sleeping' : 'idle');
  const isSleeping = resolvedState === 'sleeping';
  const displayName = nickname?.trim() || pet.name;
  return {
    pet,
    image: pet.images[resolvedState],
    isSleeping,
    state: resolvedState,
    statusText: isSleeping
      ? `${displayName} is resting 💤`
      : resolvedState === 'happy'
      ? `${displayName} is cheering you on! ✨`
      : `${displayName} is hanging out with you 🐾`,
  };
};

