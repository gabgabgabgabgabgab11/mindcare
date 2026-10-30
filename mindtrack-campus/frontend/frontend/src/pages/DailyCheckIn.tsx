import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOOD_OPTIONS } from '../constants/mood';
import { CompanionHeader } from '../components/CompanionHeader';
import { listJournalEntries, listWellnessCheckIns, submitWellnessCheckIn } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { getActivityStreak, queueStreakCelebration } from '../utils/activityStreak';
import type { JournalEntry, MoodScore, WellnessCheckInResponse } from '../types';

export const DailyCheckIn = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<MoodScore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMoodSelect = async (mood: MoodScore) => {
    setSelectedMood(mood);
    setIsSubmitting(true);
    setError(null);

    try {
      let journalEntries: JournalEntry[] = studentCache.dashboard?.journalEntries ?? [];
      let checkIns: WellnessCheckInResponse[] = studentCache.dashboard?.checkIns ?? [];
      if (!studentCache.dashboard) {
        try {
          [journalEntries, checkIns] = await Promise.all([listJournalEntries(), listWellnessCheckIns()]);
        } catch {
          // Preserve check-in access if loading history for the streak fails.
        }
      }

      const previousStreak = getActivityStreak(journalEntries, checkIns);
      const result = await submitWellnessCheckIn({ mood_score: mood });
      const nextCheckIns = [...checkIns, result];
      const nextStreak = getActivityStreak(journalEntries, nextCheckIns);
      if (studentCache.dashboard) studentCache.dashboard.checkIns = nextCheckIns;
      if (nextStreak > previousStreak) queueStreakCelebration();
      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      navigate('/dashboard');
    } catch {
      setError('Your check-in could not be saved. Please try again.');
      setIsSubmitting(false);
      setSelectedMood(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-in fade-in duration-500">
      
      <CompanionHeader
        title="Welcome Back!"
        description="How are you feeling today? Tap a mood to log your daily check-in."
        className="w-full max-w-xl mb-8"
      />

      <div className="flex flex-wrap gap-4 w-full max-w-3xl justify-center">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = selectedMood === option.score;
          return (
            <button
              key={option.score}
              onClick={() => handleMoodSelect(option.score)}
              disabled={isSubmitting}
              className={`flex-1 min-w-40 flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-75 disabled:scale-100 ${
                isSelected ? 'ring-2 ring-brand-600 scale-102 shadow-md' : ''
              } ${option.tone}`}
            >
              <span className="text-4xl mb-3">{option.emoji}</span>
              <span className="font-bold text-lg">{option.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Loading / Feedback Indicator */}
      <div className="h-10 mt-6 flex items-center justify-center">
        {isSubmitting && !isSuccess && (
          <p className="text-sm font-bold text-brand-700 animate-pulse">
            Saving your mood...
          </p>
        )}
        {isSuccess && (
          <p className="text-sm font-bold text-emerald-600 animate-in fade-in">
            ✓ Mood recorded! Redirecting...
          </p>
        )}
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      </div>

    </div>
  );
};
