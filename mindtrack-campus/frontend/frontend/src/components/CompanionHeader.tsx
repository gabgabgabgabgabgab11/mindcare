import React, { useEffect, useState } from 'react';
import { studentCache } from '../services/studentCache';
import { getCurrentUser } from '../services/studentApi';
import { getCompanionDisplay, PETS, type CompanionPetState } from '../constants/pets';
import { getCompanionPetState, setCompanionPetState } from '../utils/petState';
import { useTheme } from '../contexts/useTheme';

interface CompanionHeaderProps {
  title: string;
  description: string;
  badge?: string;
  action?: React.ReactNode;
  backButton?: () => void;
  className?: string;
  speechBubbleClassName?: string;
  petSize?: 'md' | 'lg' | 'xl' | 'phone';
}

export const CompanionHeader: React.FC<CompanionHeaderProps> = ({
  title,
  description,
  badge,
  action,
  backButton,
  className = '',
  speechBubbleClassName,
  petSize = 'md',
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const cachedData = studentCache.dashboard;
  const [petId, setPetId] = useState<string | null>(cachedData?.user?.companion_pet ?? null);
  const [nickname, setNickname] = useState<string>(cachedData?.user?.companion_nickname ?? '');
  const [petState, setPetState] = useState<CompanionPetState>(() => getCompanionPetState(isDarkMode));
  const [isPoked, setIsPoked] = useState(false);

  useEffect(() => {
    const handleNicknameChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      // detail is the trimmed nickname string dispatched by the Dashboard PUT save
      setNickname(customEvent.detail ?? '');
    };
    const handleStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<CompanionPetState | null>;
      setPetState(customEvent.detail ?? getCompanionPetState(isDarkMode));
    };

    window.addEventListener('mindcare:pet-nickname-changed', handleNicknameChange);
    window.addEventListener('mindcare:pet-state-changed', handleStateChange);
    return () => {
      window.removeEventListener('mindcare:pet-nickname-changed', handleNicknameChange);
      window.removeEventListener('mindcare:pet-state-changed', handleStateChange);
    };
  }, [isDarkMode]);

  useEffect(() => {
    setPetState(getCompanionPetState(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (!cachedData) {
      getCurrentUser()
        .then((user) => {
          if (user.companion_pet) setPetId(user.companion_pet);
          // Use DB-backed nickname; fall back to empty string (shows pet's default name)
          setNickname(user.companion_nickname ?? '');
        })
        .catch(() => {
          // Keep cached or default on error
        });
    }
  }, [cachedData]);

  // Use the user's selected pet, or Capybara as the warm default companion
  const effectivePetId = petId || 'capybara';
  const companionInfo = getCompanionDisplay(effectivePetId, new Date().getHours(), nickname, isDarkMode, petState) || {
    pet: PETS.capybara,
    image: PETS.capybara.images[petState],
    isSleeping: petState === 'sleeping',
    state: petState,
    statusText: '',
  };

  const handlePokeInHeader = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 500);

    const nextState: CompanionPetState =
      petState === 'sleeping' ? 'idle' : petState === 'idle' ? 'happy' : (isDarkMode ? 'sleeping' : 'idle');
    setCompanionPetState(nextState);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Page Title Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {backButton && (
            <button
              onClick={backButton}
              type="button"
              className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900/50">
              {badge}
            </span>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Pet & Chat Cloud (Speech Bubble) Row */}
      <div className={`flex ${petSize === 'phone' ? 'flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 my-3' : 'items-center gap-3.5 sm:gap-5 mt-1'}`}>
        {/* Companion Avatar (Free-standing, no box container) */}
        <div className={`relative shrink-0 flex flex-col items-center group ${petSize === 'phone' ? 'order-2 sm:order-1' : ''}`}>
          <button
            type="button"
            onClick={handlePokeInHeader}
            title={`Click to poke ${nickname || companionInfo.pet.name} (${petState})`}
            className={`${
              petSize === 'phone'
                ? 'w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80'
                : petSize === 'xl' 
                  ? 'w-36 h-36 sm:w-40 sm:h-40' 
                  : petSize === 'lg' 
                    ? 'w-28 h-28 sm:w-32 sm:h-32' 
                    : 'w-20 h-20 sm:w-24 sm:h-24'
            } p-0 flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer select-none focus:outline-none bg-transparent border-none ${
              isPoked ? 'scale-90' : ''
            }`}
          >
            <img
              src={companionInfo.image}
              alt={`${companionInfo.pet.name} companion (${petState})`}
              className={`max-h-full max-w-full object-contain pointer-events-none drop-shadow-xl transition-transform duration-300 ${
                isPoked ? 'scale-110' : ''
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`${petSize === 'phone' ? 'text-sm font-extrabold' : 'text-[11px] font-bold'} text-gray-600 dark:text-slate-300 tracking-tight`}>
              {nickname || companionInfo.pet.name}
            </span>
            <span className={petSize === 'phone' ? 'text-xs' : 'text-[10px]'}>
              {petState === 'sleeping' ? '💤' : petState === 'idle' ? '🐾' : '✨'}
            </span>
          </div>
        </div>

        {/* Chat Cloud (Speech Bubble) */}
        <div className={`relative ${petSize === 'phone' ? 'w-full sm:flex-1 order-1 sm:order-2' : 'flex-1'} ${speechBubbleClassName ?? 'bg-white dark:bg-slate-800/90 border border-brand-100 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm'}`}>
          {/* Speech bubble tail pointing directly to the pet */}
          {petSize === 'phone' ? (
            <>
              {/* Desktop tail pointing left to the pet */}
              <div className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white dark:border-r-slate-900 border-b-8 border-b-transparent"></div>
              <div className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-slate-100 dark:border-r-slate-800 border-b-8 border-b-transparent -z-10"></div>
              
              {/* Mobile tail pointing down to the pet below */}
              <div className="sm:hidden absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-white dark:border-t-slate-900 border-r-8 border-r-transparent"></div>
              <div className="sm:hidden absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-slate-100 dark:border-t-slate-800 border-r-8 border-r-transparent -z-10"></div>
            </>
          ) : (
            <>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-r-8 border-r-white dark:border-r-slate-900 border-b-6 border-b-transparent"></div>
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-r-8 border-r-slate-100 dark:border-r-slate-800 border-b-6 border-b-transparent -z-10"></div>
            </>
          )}

          <p className={`${petSize === 'phone' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} text-gray-700 dark:text-slate-200 leading-relaxed font-medium`}>
            "{description}"
          </p>
        </div>
      </div>
    </div>
  );
};
