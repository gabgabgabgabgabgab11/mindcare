import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOOD_OPTIONS } from '../constants/mood';
import type { MoodScore } from '../types';

export const DailyCheckIn = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMoodSelect = (mood: MoodScore) => {
    setIsSubmitting(true);

    // TODO(23D): POST /api/v1/wellness/checkins with { mood_score: mood }.
    void mood;

    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-in fade-in duration-500">
      
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Welcome Back!</h1>
        <p className="text-gray-500 text-lg">How are you feeling today?</p>
      </div>

      <div className="flex flex-wrap gap-4 w-full max-w-3xl justify-center">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.score}
            onClick={() => handleMoodSelect(option.score)}
            disabled={isSubmitting}
            className={`flex-1 min-w-40 flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${option.tone}`}
          >
            <span className="text-4xl mb-3">{option.emoji}</span>
            <span className="font-bold text-lg">{option.label}</span>
          </button>
        ))}
      </div>
      
      {/* Loading Indicator */}
      <div className="h-10 mt-6 flex items-center justify-center">
        {isSubmitting && (
          <p className="text-sm font-bold text-[#7B61FF] animate-pulse">
            Saving your mood...
          </p>
        )}
      </div>

    </div>
  );
};
