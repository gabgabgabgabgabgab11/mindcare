import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Frown, Meh, Smile } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { WellnessPriorityCard } from '../components/WellnessPriorityCard';
import { getCurrentUser, listJournalEntries, listWellnessCheckIns, getWellnessPriority, submitWellnessCheckIn, updateProfile } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { getCompanionDisplay, getTimeBasedGreeting, PETS, type CompanionPetState } from '../constants/pets';
import { getCompanionPetState, setCompanionPetState } from '../utils/petState';
import { useTheme } from '../contexts/useTheme';
import type { JournalEntry, MoodScore, WellnessCheckInResponse } from '../types';
import {
  consumePendingStreakCelebration,
  getActivityStreak,
  queueStreakCelebration,
  STREAK_CELEBRATION_EVENT,
} from '../utils/activityStreak';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const currentHour = new Date().getHours();
  const { isNight } = getTimeBasedGreeting(currentHour);
  const isRestingTime = isNight || isDarkMode;

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);

  // Dynamic companion state (sleeping, idle, happy) synced globally
  const [petState, setPetState] = useState<CompanionPetState>(() => getCompanionPetState(isDarkMode, currentHour));
  const [isPoked, setIsPoked] = useState(false);

  // Seed initial state from cache so there's no empty flash on re-visits
  const cached = studentCache.dashboard;
  const [userName, setUserName] = useState(cached ? (cached.user.email?.split('@')[0].replace(/[._-]+/g, ' ') || cached.user.program || 'there') : 'there');
  const [companionPet, setCompanionPet] = useState<string | null>(cached ? (cached.user.companion_pet ?? null) : null);
  const [petNickname, setPetNicknameState] = useState<string>(cached?.user.companion_nickname ?? '');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [journalStreak, setJournalStreak] = useState(cached ? getActivityStreak(cached.journalEntries, cached.checkIns) : 0);
  const [isStreakCelebrating, setIsStreakCelebrating] = useState(false);
  const streakCelebrationTimer = useRef<number | null>(null);
  const [checkinCount, setCheckinCount] = useState(cached ? cached.checkIns.length : 0);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(!cached);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const triggerStreakCelebration = useCallback(() => {
    setIsStreakCelebrating(true);
    if (streakCelebrationTimer.current !== null) {
      window.clearTimeout(streakCelebrationTimer.current);
    }
    streakCelebrationTimer.current = window.setTimeout(() => {
      setIsStreakCelebrating(false);
      streakCelebrationTimer.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    const handleStreakIncrease = () => {
      consumePendingStreakCelebration();
      triggerStreakCelebration();
    };

    window.addEventListener(STREAK_CELEBRATION_EVENT, handleStreakIncrease);
    if (consumePendingStreakCelebration()) triggerStreakCelebration();
    return () => {
      window.removeEventListener(STREAK_CELEBRATION_EVENT, handleStreakIncrease);
      if (streakCelebrationTimer.current !== null) {
        window.clearTimeout(streakCelebrationTimer.current);
      }
    };
  }, [triggerStreakCelebration]);

  // Listen for global pet state changes so all pages stay synchronized
  useEffect(() => {
    const handlePetStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<CompanionPetState | null>;
      setPetState(customEvent.detail ?? getCompanionPetState(isDarkMode, currentHour));
    };
    window.addEventListener('mindcare:pet-state-changed', handlePetStateChange);
    return () => window.removeEventListener('mindcare:pet-state-changed', handlePetStateChange);
  }, [isDarkMode, currentHour]);

  // Sync companion state when switching theme
  useEffect(() => {
    setPetState(getCompanionPetState(isDarkMode, currentHour));
  }, [theme, isDarkMode, currentHour]);

  useEffect(() => {
    // If data was already fetched this session, sync companionPet in case it changed in profile
    if (studentCache.dashboard) {
      setCompanionPet(studentCache.dashboard.user.companion_pet ?? null);
      setPetNicknameState(studentCache.dashboard.user.companion_nickname ?? '');
      return;
    }

    let active = true;
    Promise.all([getCurrentUser(), listJournalEntries(), listWellnessCheckIns(), getWellnessPriority()])
      .then(([user, entries, checkins, priority]) => {
        if (!active) return;
        const now = new Date();
        studentCache.dashboard = {
          user,
          journalEntries: entries,
          checkIns: checkins,
          wellnessPriority: priority,
          lastRefreshed: now,
        };
        const emailName = user.email?.split('@')[0].replace(/[._-]+/g, ' ');
        setUserName(emailName || user.program || 'there');
        setCompanionPet(user.companion_pet ?? null);
        setPetNicknameState(user.companion_nickname ?? '');
        setJournalStreak(getActivityStreak(entries, checkins));
        setCheckinCount(checkins.length);
      })
      .catch(() => { if (active) setDashboardError('Some dashboard data could not be loaded.'); })
      .finally(() => { if (active) setIsLoadingDashboard(false); });

    return () => { active = false; };
  }, []);

  const currentPetState: CompanionPetState = petState;
  const companionInfo = getCompanionDisplay(companionPet, currentHour, petNickname, isDarkMode, currentPetState);

  // Pet interactive poke handler: cycles sleeping -> idle -> happy -> sleeping
  const handlePetPoke = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 600);

    const nextState: CompanionPetState =
      currentPetState === 'sleeping' ? 'idle' : currentPetState === 'idle' ? 'happy' : (isRestingTime ? 'sleeping' : 'idle');
    setCompanionPetState(nextState);
    setPetState(nextState);
  };

  // Determine active pet PNG based on current state (idle, happy, or sleeping)
  const activePetImage = companionInfo
    ? companionInfo.pet.images[currentPetState]
    : '';

  const petDisplayName = petNickname || companionInfo?.pet.name || 'Companion';

  // Greeting logic: Good evening when pet is awake at night/evening, Goodnight when pet is resting
  const isPetAwake = currentPetState !== 'sleeping';
  let dynamicGreeting = '';
  if (currentHour >= 5 && currentHour < 12) {
    dynamicGreeting = 'Good morning';
  } else if (currentHour >= 12 && currentHour < 18) {
    dynamicGreeting = 'Good afternoon';
  } else {
    dynamicGreeting = isPetAwake ? 'Good evening' : 'Goodnight';
  }

  // Determine chat bubble message containing dynamic greeting and state-specific dialogue
  let chatBubbleMessage = '';
  if (!companionInfo) {
    chatBubbleMessage = `${dynamicGreeting}, ${userName}! Welcome to your wellness space. Take things at your own pace today.`;
  } else if (currentPetState === 'sleeping') {
    chatBubbleMessage = `${dynamicGreeting}, ${userName}! ${petDisplayName} is resting quietly 💤`;
  } else if (currentPetState === 'idle') {
    chatBubbleMessage = `*Yawns & stretches* ${dynamicGreeting}, ${userName}! ${petDisplayName} is awake now and hanging out with you. 🐾`;
  } else {
    // happy
    chatBubbleMessage = `*Beams with joy* ${dynamicGreeting}, ${userName}! ${petDisplayName} is super happy to see you! ✨`;
  }

  const openNicknameModal = () => {
    setNicknameInput(petNickname);
    setIsNicknameModalOpen(true);
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({ companion_nickname: nicknameInput.trim() || null });
      const nickname = updated.companion_nickname ?? '';
      setPetNicknameState(nickname);
      if (studentCache.dashboard) studentCache.dashboard.user = updated;
      setIsNicknameModalOpen(false);
    } catch {
      setMoodError('Nickname could not be saved. Please try again.');
    }
  };

  const handleClearNickname = async () => {
    try {
      const updated = await updateProfile({ companion_nickname: null });
      setPetNicknameState('');
      setNicknameInput('');
      if (studentCache.dashboard) studentCache.dashboard.user = updated;
      setIsNicknameModalOpen(false);
    } catch {
      setMoodError('Nickname could not be reset. Please try again.');
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsSavingMood(true);
    setMoodSaved(false);
    setMoodError(null);
    // Logging mood cheers up the companion!
    setCompanionPetState('happy');
    setPetState('happy');

    const moodScores: Record<string, MoodScore> = { good: 4, okay: 3, struggling: 2 };
    try {
      const cachedDashboard = studentCache.dashboard;
      let journalEntries: JournalEntry[];
      let checkIns: WellnessCheckInResponse[];
      if (cachedDashboard) {
        journalEntries = cachedDashboard.journalEntries;
        checkIns = cachedDashboard.checkIns;
      } else {
        try {
          [journalEntries, checkIns] = await Promise.all([listJournalEntries(), listWellnessCheckIns()]);
        } catch {
          journalEntries = [];
          checkIns = [];
        }
      }
      const previousStreak = getActivityStreak(journalEntries, checkIns);
      const result = await submitWellnessCheckIn({ mood_score: moodScores[mood] });
      const nextCheckIns = [...checkIns, result];
      const nextStreak = getActivityStreak(journalEntries, nextCheckIns);
      setMoodSaved(true);
      setCheckinCount((prev) => prev + 1);
      setJournalStreak(nextStreak);
      // Keep cache in sync so the updated count persists on re-visits
      if (cachedDashboard) {
        cachedDashboard.checkIns = nextCheckIns;
      }
      if (nextStreak > previousStreak) queueStreakCelebration();
      setTimeout(() => setMoodSaved(false), 2500);
    } catch {
      setMoodError('Mood could not be saved.');
    } finally {
      setIsSavingMood(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto w-full pb-8">
      {dashboardError && <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{dashboardError}</p>}
      
      {/* 1. HERO COMPANION SECTION */}
      <div data-tour="companion" className="flex flex-col gap-5 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden mt-2">
        {/* Decorative Background Blur */}
        <div className="absolute top-[-50%] right-[-10%] w-72 h-72 bg-brand-100 dark:bg-brand-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 dark:opacity-20 pointer-events-none"></div>

        {/* TOP: Section Title & Pet Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/80 flex items-center justify-center text-lg shadow-2xs">
              🐾
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Wellness Companion
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Your supportive campus buddy
              </p>
            </div>
          </div>

          {companionInfo && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openNicknameModal}
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold bg-brand-50/80 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-900/50 transition-colors cursor-pointer"
                title="Set a nickname for your companion"
              >
                <span>✏️</span> {petNickname ? petNickname : 'Add Nickname'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer px-2 py-1.5"
              >
                Change Pet →
              </button>
            </div>
          )}
        </div>

        {/* COMPANION & MESSAGE CLOUD */}
        <div className="flex flex-col items-center justify-center gap-4 relative z-10 w-full pt-1">
          {/* Message Cloud (Speech Bubble) with Greeting inside */}
          <div className="relative w-full max-w-lg bg-brand-50/90 dark:bg-slate-800/90 border border-brand-100 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs text-center transition-all duration-300">
            <div className="flex items-center justify-center gap-2 mb-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
              <span>💬</span>
              <span>{petDisplayName}</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              "{chatBubbleMessage}"
            </p>
            {/* Speech bubble tail pointing downwards directly to the pet below */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-brand-100 dark:border-t-slate-700"></div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-7 border-l-transparent border-r-7 border-r-transparent border-t-7 border-t-brand-50 dark:border-t-slate-800"></div>
          </div>

          {/* Pet Showcase (Placed directly in parent container, clickable to poke / wake up) */}
          <div className="w-full flex items-center justify-center shrink-0 relative py-2">
            {companionInfo ? (
              <div
                role="button"
                tabIndex={0}
                onClick={handlePetPoke}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePetPoke(); }}
                className={`relative flex items-center justify-center w-full max-w-75 h-48 sm:h-56 group cursor-pointer select-none transition-all duration-300 focus:outline-none ${
                  isPoked ? 'scale-95' : 'hover:scale-[1.03]'
                }`}
                title="Click pet to poke or wake up"
                aria-label={`Companion ${companionInfo.pet.name}. Current state: ${currentPetState}. Click to poke.`}
              >
                {/* Floating poke reaction toast */}
                {isPoked && (
                  <div className="absolute -top-3 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md animate-bounce z-20">
                    {currentPetState === 'sleeping' ? 'Resting... 💤' : currentPetState === 'idle' ? 'Idle state! 🐾' : 'So happy! ✨'}
                  </div>
                )}

                <img
                  src={activePetImage}
                  alt={`${companionInfo.pet.name} companion in ${currentPetState} state`}
                  className={`max-h-full max-w-full object-contain pointer-events-none drop-shadow-md transition-transform duration-300 ${
                    isPoked ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />

                {/* State Badge (Bottom Right) */}
                <div className="absolute bottom-0 right-2 flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
                  <span className="text-sm">
                    {currentPetState === 'sleeping' ? '💤' : currentPetState === 'idle' ? '🐾' : '✨'}
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    {currentPetState === 'sleeping' ? 'Resting' : currentPetState === 'idle' ? 'Idle' : 'Happy'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full max-w-[320px] h-52 sm:h-60 rounded-3xl border-2 border-dashed border-brand-200 dark:border-brand-900/60 bg-brand-50/30 dark:bg-brand-950/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-700 hover:bg-brand-50/60 transition-all group"
              >
                <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">🐾</span>
                <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                  Choose your companion
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-400 mt-1">
                  Tap to pick your friendly pet
                </span>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Companion choice prompt card if none selected */}
      {!companionPet && !isLoadingDashboard && (
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl border-brand-100 dark:border-brand-950 bg-brand-50/50 dark:bg-brand-950/30">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl">🐾</span>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Choose your companion</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Adopt a friendly companion (Dog, Cat, Capybara, or Rabbit) to join your daily wellness routine!
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/profile')}
            variant="secondary"
            className="border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-800 text-xs px-4 py-2 rounded-xl shrink-0 cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-700"
          >
            Choose Pet →
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Takes up more space on desktop) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* 2. QUICK MOOD CHECK-IN WIDGET */}
          <Card data-tour="mood-checkin" className="p-6 md:p-8 rounded-3xl shadow-sm border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">How are you feeling?</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Log your current mood to track your baseline.</p>
              </div>
              {isSavingMood && (
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 animate-pulse bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full">Saving...</span>
              )}
              {moodSaved && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">Mood logged! ✓</span>
              )}
              {moodError && <span className="text-xs font-bold text-red-600">{moodError}</span>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Positive Mood */}
              <button 
                onClick={() => handleMoodSelect('good')}
                disabled={isSavingMood || isLoadingDashboard}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ease-out hover:scale-105 hover:-translate-y-0.5 active:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:translate-y-0 ${selectedMood === 'good' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-200 hover:bg-emerald-50/70 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30'}`}
              >
                <Smile className="w-8 h-8 mb-2 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
                <span className={`text-xs font-bold ${selectedMood === 'good' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-400'}`}>Good</span>
              </button>
              
              {/* Neutral Mood */}
              <button 
                onClick={() => handleMoodSelect('okay')}
                disabled={isSavingMood || isLoadingDashboard}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ease-out hover:scale-105 hover:-translate-y-0.5 active:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:translate-y-0 ${selectedMood === 'okay' ? 'border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-700/70 shadow-sm' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-700/50'}`}
              >
                <Meh className="w-8 h-8 mb-2 text-slate-500 dark:text-slate-400" strokeWidth={2.5} aria-hidden="true" />
                <span className={`text-xs font-bold ${selectedMood === 'okay' ? 'text-slate-700 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400'}`}>Okay</span>
              </button>

              {/* Struggling Mood */}
              <button 
                onClick={() => handleMoodSelect('struggling')}
                disabled={isSavingMood || isLoadingDashboard}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ease-out hover:scale-105 hover:-translate-y-0.5 active:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:translate-y-0 ${selectedMood === 'struggling' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 shadow-sm' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-sky-200 hover:bg-sky-50/70 dark:hover:border-sky-800 dark:hover:bg-sky-950/30'}`}
              >
                <Frown className="w-8 h-8 mb-2 text-sky-500 dark:text-sky-400" strokeWidth={2.5} aria-hidden="true" />
                <span className={`text-xs font-bold ${selectedMood === 'struggling' ? 'text-sky-700 dark:text-sky-300' : 'text-gray-500 dark:text-slate-400'}`}>Struggling</span>
              </button>
            </div>
          </Card>

          {/* 3. ASSESSMENTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PHQ-9 Card */}
            <Card data-tour="assessment-phq9" className="p-6 rounded-3xl shadow-sm border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-full group hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
              <div>
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Reflect on your mood and emotional well-being over the past two weeks</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">The Patient Health Questionnaire-9 is a nine-question screening about depression symptoms over the past two weeks. It can support reflection, but it does not diagnose depression.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => navigate('/assessments', { state: { type: 'PHQ-9' } })}
                  className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors uppercase tracking-wider"
                >
                  Start Check <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
                <button type="button" onClick={() => navigate('/resources')} className="text-xs font-bold text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300 transition-colors">
                  Learn about PHQ-9
                </button>
              </div>
            </Card>

            {/* GAD-7 Card */}
            <Card data-tour="assessment-gad7" className="p-6 rounded-3xl shadow-sm border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-full group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div>
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Explore how anxiety may be affecting you and identify triggers</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">The Generalized Anxiety Disorder-7 is a seven-question screening about anxiety symptoms over the past two weeks. It can support reflection, but it does not diagnose an anxiety disorder.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => navigate('/assessments', { state: { type: 'GAD-7' } })}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-wider"
                >
                  Start Check <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
                <button type="button" onClick={() => navigate('/resources')} className="text-xs font-bold text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 transition-colors">
                  Learn about GAD-7
                </button>
              </div>
            </Card>

          </div>

          <WellnessPriorityCard />
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* 4. WELLNESS SNAPSHOT (Gamification & Journal) */}
          <Card
            data-tour="journal-streak"
            className={`p-0 rounded-3xl shadow-sm border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-shadow ${isStreakCelebrating ? 'streak-card-celebrating' : ''}`}
          >
            
            <div className="bg-white dark:bg-slate-900 p-6 text-gray-900 dark:text-white relative overflow-hidden">

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Journal Streak</span>
                </span>
                <span aria-hidden="true" className={`text-2xl ${isStreakCelebrating ? 'streak-flame-ignite' : ''}`}>🔥</span>
              </div>

              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex-1">
                  {isLoadingDashboard ? (
                    <p className="text-sm font-bold text-gray-600 dark:text-slate-300">Loading your snapshot...</p>
                  ) : dashboardError ? (
                    <p className="text-sm font-bold text-gray-600 dark:text-slate-300">Snapshot unavailable right now.</p>
                  ) : (
                    <>
                      <h3 className={`streak-count mb-1 text-3xl font-black text-gray-900 dark:text-white ${isStreakCelebrating ? 'streak-count-pop' : ''}`}>
                        {journalStreak} {journalStreak === 1 ? 'Day' : 'Days'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-tight">
                        {checkinCount} mood {checkinCount === 1 ? 'check-in' : 'check-ins'} recorded.
                      </p>
                    </>
                  )}
                </div>

                {/* Companion Pet Showcase in Streak Container */}
                <div className="shrink-0 flex flex-col items-center group">
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-2 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
                    <img
                      src={companionInfo ? companionInfo.image : PETS.capybara.images.happy}
                      alt={`${companionInfo ? companionInfo.pet.name : 'Capybara'} cheer`}
                      className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-xs">
                      🔥
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 mt-1">
                    {companionInfo ? companionInfo.pet.name : 'Companion'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 flex flex-col gap-4">
              {/* Pet Speech Bubble / Encouragement */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100/80 dark:border-brand-900/40">
                <span className="text-base select-none">🐾</span>
                <p className="text-xs text-gray-700 dark:text-slate-300 font-medium leading-relaxed">
                  {journalStreak > 0
                    ? `Keep the fire burning! ${companionInfo ? companionInfo.pet.name : 'Your companion'} is cheering your ${journalStreak}-day wellness streak!`
                    : `Every journey starts with a single step. Let's start your wellness streak today!`}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Today's Prompt
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-300 italic mb-4">"What is one small win you had today?"</p>
                
                <Button onClick={() => navigate('/journal')} variant="secondary" className="w-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-brand-700 dark:hover:text-brand-300 transition-colors text-xs py-2.5 rounded-xl shadow-xs cursor-pointer">
                  Open Journal
                </Button>
              </div>
            </div>
            
          </Card>

          {/* Quick Support Link */}
          <button data-tour="find-support" onClick={() => navigate('/resources')} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Find Support</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">OSS Counseling</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

        </div>
      </div>

      {/* Pet Nickname Settings Modal */}
      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏷️</span> Pet Nickname
              </h3>
              <button
                type="button"
                onClick={() => setIsNicknameModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Give your {companionInfo?.pet.name || 'companion'} a personalized nickname. It will appear on your dashboard and companion messages!
            </p>
            <form onSubmit={handleSaveNickname} className="space-y-4">
              <input
                type="text"
                maxLength={20}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="e.g. Mochi, Barnaby, Buster..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
                autoFocus
              />
              <div className="flex justify-end items-center gap-2 pt-1">
                {petNickname && (
                  <button
                    type="button"
                    onClick={handleClearNickname}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer mr-auto"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNicknameModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Nickname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
