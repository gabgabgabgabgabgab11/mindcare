import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { MOOD_OPTIONS } from '../constants/mood';
import { listJournalEntries, listWellnessCheckIns, signConsent, submitWellnessCheckIn } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { getActivityStreak, queueStreakCelebration } from '../utils/activityStreak';
import { useAuth } from '../contexts/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';
import type { JournalEntry, MoodScore, WellnessCheckInResponse } from '../types';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { hasActiveConsent } = useAuth();

  // If user already has consent, start at Step 4 (Mood Check-in).
  // New students without consent start at Step 1 (Welcome & Consent).
  const [step, setStep] = useState<number>(() => (hasActiveConsent === true ? 4 : 1));
  const [isFading, setIsFading] = useState(false);
  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [selectedMoodScore, setSelectedMoodScore] = useState<MoodScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkedConsentRef = useRef(false);

  // If hasActiveConsent was still resolving on initial render, transition to step 4 once confirmed
  useEffect(() => {
    if (!checkedConsentRef.current && hasActiveConsent === true) {
      checkedConsentRef.current = true;
      setStep(4);
    }
  }, [hasActiveConsent]);

  // Smooth transition handler
  const handleNext = async () => {
    setError(null);
    if (step === 3) {
      checkedConsentRef.current = true;
      setIsSavingConsent(true);
      try {
        await signConsent();
      } catch {
        setError('We could not save your setup and consent. Please try again.');
        setIsSavingConsent(false);
        return;
      } finally {
        setIsSavingConsent(false);
      }
    }
    setIsFading(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setStep((prev) => prev + 1);
    setIsFading(false);
  };

  const handleFinish = (route: string) => {
    navigate(route);
  };

  const handleMoodSelect = async (score: MoodScore) => {
    setError(null);
    setSelectedMoodScore(score);
    setIsSavingMood(true);
    try {
      let journalEntries: JournalEntry[] = studentCache.dashboard?.journalEntries ?? [];
      let checkIns: WellnessCheckInResponse[] = studentCache.dashboard?.checkIns ?? [];
      if (!studentCache.dashboard) {
        try {
          [journalEntries, checkIns] = await Promise.all([listJournalEntries(), listWellnessCheckIns()]);
        } catch {
          // Do not block onboarding if streak history cannot be loaded.
        }
      }

      const previousStreak = getActivityStreak(journalEntries, checkIns);
      const result = await submitWellnessCheckIn({ mood_score: score });
      const nextCheckIns = [...checkIns, result];
      const nextStreak = getActivityStreak(journalEntries, nextCheckIns);
      if (studentCache.dashboard) studentCache.dashboard.checkIns = nextCheckIns;
      if (nextStreak > previousStreak) queueStreakCelebration();
      setIsFading(true);
      await new Promise((resolve) => setTimeout(resolve, 250));
      setStep(5);
      setIsFading(false);
    } catch {
      setError('Your check-in could not be saved. Please try again.');
    } finally {
      setIsSavingMood(false);
      setSelectedMoodScore(null);
    }
  };

  // Content for the first 3 information screens (for new students)
  const screens = [
    {
      icon: '🌿',
      title: 'Welcome to MindCare',
      text: 'This is your safe, private space for wellness check-ins, reflection, and support. MindCare is designed for PUP Santa Maria students who want to stay in tune with their emotional well-being.',
      button: 'Next',
    },
    {
      icon: '📋',
      title: 'How it works',
      text: 'You can take short wellness screenings (PHQ-9, GAD-7), write in your journal, celebrate your small wins, and connect with campus counseling — all in one place.',
      button: 'Next',
    },
    {
      icon: '🔒',
      title: 'Your privacy matters',
      text: 'Before using MindCare’s wellness features, please review this consent. MindCare stores and processes the information you submit for check-ins, journaling, screenings, and related support features. MindCare is not a diagnostic tool. You may withdraw consent later in Privacy Settings; some features require active consent.',
      button: 'I consent and continue',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative transition-colors duration-200">
      {/* Quick Theme Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle variant="pill" />
      </div>

      {/* Decorative ambient background glows */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-brand-200/50 dark:bg-brand-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-brand-200/50 dark:bg-brand-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 pointer-events-none"></div>

      {/* Container with smooth fade transitions */}
      <div className={`w-full max-w-md transition-all duration-300 ease-in-out relative z-10 ${isFading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

        {/* Intro Screens (Steps 1, 2, 3 - New Accounts Only) */}
        {step <= 3 && (
          <div className="p-8 md:p-12 rounded-3xl shadow-xl shadow-brand-950/5 dark:shadow-2xl dark:shadow-black/50 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden transition-colors">
            <div className="text-6xl mb-6">{screens[step - 1].icon}</div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">{screens[step - 1].title}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-10">{screens[step - 1].text}</p>

            {step === 3 && (
              <label className="mb-6 flex w-full items-start gap-3 text-left text-sm leading-6 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={event => setHasConsented(event.target.checked)}
                  disabled={isSavingConsent}
                  className="mt-1 h-4 w-4 shrink-0 rounded accent-brand-600"
                />
                <span>
                  I have read this information and consent to MindCare storing and processing the information I submit to provide its wellness features. See the{' '}
                  <Link to="/privacy-policy" className="font-bold text-brand-600 underline dark:text-brand-400">Privacy Policy</Link>.
                </span>
              </label>
            )}

            {/* Pagination Dots */}
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    step === i ? 'bg-brand-600 dark:bg-brand-500 w-5' : 'bg-slate-200 dark:bg-slate-700 w-2'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              variant="primary"
              isLoading={isSavingConsent}
              disabled={isSavingConsent || (step === 3 && !hasConsented)}
              className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl px-12 py-3.5 shadow-lg shadow-brand-600/25 border-none text-sm font-semibold transition-all cursor-pointer"
            >
              {isSavingConsent ? 'Saving Consent...' : screens[step - 1].button}
            </Button>
            {error && <p className="mt-4 text-center text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>}
          </div>
        )}

        {/* Step 4: Mood Check-in (Appears Every Login) */}
        {step === 4 && (
          <div className="flex flex-col items-center w-full">
            <div className="w-full p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-950/5 dark:shadow-2xl dark:shadow-black/50 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors">
              <div className="flex flex-col items-center text-center mb-6">
                <span className="text-4xl mb-2">💙</span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  How are you feeling today?
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Take a moment to check in with yourself before we begin.
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                {MOOD_OPTIONS.map((option) => {
                  const isThisSelected = selectedMoodScore === option.score;
                  return (
                    <button
                      key={option.score}
                      onClick={() => handleMoodSelect(option.score)}
                      disabled={isSavingMood}
                      className={`w-full border p-4 rounded-2xl text-left text-sm font-bold transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                        isThisSelected
                          ? 'border-brand-600 bg-brand-50/90 dark:bg-brand-950/50 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-slate-800 disabled:opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-semibold">{option.label}</span>
                      </div>
                      {isThisSelected && isSavingMood && (
                        <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold animate-pulse">Saving...</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && <p className="mt-4 text-center text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => handleFinish('/dashboard')}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Skip to Dashboard &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: What would you like to check today? (Screening Prompt) */}
        {step === 5 && (
          <div className="flex flex-col items-center w-full">
            <div className="w-full p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-950/5 dark:shadow-2xl dark:shadow-black/50 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                What would you like to check today?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
                These standardized screening tools help you reflect on your current experiences. They are confidential and not used to diagnose you.
              </p>

              <div className="flex flex-col gap-3 mb-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center dark:border-slate-700 dark:bg-slate-800/80">
                  <span className="mb-1.5 block text-3xl">🌙</span>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">PHQ-9</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">The Patient Health Questionnaire-9 is a nine-question screening about depression symptoms over the past two weeks. It can support reflection, but it does not diagnose depression.</span>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    <button type="button" onClick={() => navigate('/assessments', { state: { type: 'PHQ-9' } })} className="text-xs font-bold text-brand-700 hover:underline dark:text-brand-300">Start PHQ-9</button>
                    <button type="button" onClick={() => navigate('/resources')} className="text-xs font-bold text-slate-600 hover:underline dark:text-slate-300">Learn about PHQ-9</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center dark:border-slate-700 dark:bg-slate-800/80">
                  <span className="mb-1.5 block text-3xl">🌀</span>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">GAD-7</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">The Generalized Anxiety Disorder-7 is a seven-question screening about anxiety symptoms over the past two weeks. It can support reflection, but it does not diagnose an anxiety disorder.</span>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    <button type="button" onClick={() => navigate('/assessments', { state: { type: 'GAD-7' } })} className="text-xs font-bold text-brand-700 hover:underline dark:text-brand-300">Start GAD-7</button>
                    <button type="button" onClick={() => navigate('/resources')} className="text-xs font-bold text-slate-600 hover:underline dark:text-slate-300">Learn about GAD-7</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleFinish('/dashboard')}
                  variant="secondary"
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs py-3.5 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => handleFinish('/assessments')}
                  variant="primary"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white border-none rounded-xl text-xs py-3.5 font-semibold shadow-lg shadow-brand-600/25 transition-all"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
