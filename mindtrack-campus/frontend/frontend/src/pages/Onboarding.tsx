import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MOOD_OPTIONS } from '../constants/mood';
import type { MoodScore } from '../types';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isFading, setIsFading] = useState(false);

  // Smooth transition handler
  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setStep(prev => prev + 1);
      setIsFading(false);
    }, 300);
  };

  const handleFinish = (route: string) => {
    navigate(route);
  };

  const handleMoodSelect = (score: MoodScore) => {
    // TODO(23D): persist the onboarding mood via POST /wellness/checkins.
    void score;
    handleNext();
  };

  // Content for the first 3 information screens
  const screens = [
    {
      icon: '🌿',
      title: 'Welcome to MindCare',
      text: 'This is your safe, private space for wellness check-ins, reflection, and support. MindCare is designed for PUP Santa Maria students who want to stay in tune with their emotional well-being.',
      button: 'Next'
    },
    {
      icon: '📋',
      title: 'How it works',
      text: 'You can take short wellness screenings (PHQ-9, GAD-7), write in your journal, celebrate your small wins, and connect with campus counseling — all in one place.',
      button: 'Next'
    },
    {
      icon: '🔒',
      title: 'Your privacy matters',
      text: 'Everything you share here is confidential and encrypted. MindCare is not a diagnostic tool. It will never label you or share your personal responses without your consent.',
      button: 'Get started'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center p-6 relative">
      
      {/* Container with beautiful fade transitions */}
      <div className={`w-full max-w-md transition-all duration-300 ease-in-out ${isFading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        
        {/* Intro Screens (Steps 1, 2, 3) */}
        {step <= 3 && (
          <Card className="p-8 md:p-12 rounded-3xl shadow-lg border-white/60 bg-white/80 backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="text-6xl mb-6">{screens[step - 1].icon}</div>
            <h1 className="text-2xl font-black text-purple-900 mb-4">{screens[step - 1].title}</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-10">{screens[step - 1].text}</p>
            
            {/* Pagination Dots */}
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'bg-purple-600 w-4' : 'bg-purple-200'}`} />
              ))}
            </div>

            <Button onClick={handleNext} variant="primary" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-12 py-3 shadow-md border-none text-sm">
              {screens[step - 1].button}
            </Button>
          </Card>
        )}

        {/* Step 4: Mood Check-in */}
        {step === 4 && (
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black text-purple-900 mb-2 text-center flex flex-col items-center gap-3">
              <span className="text-blue-500 text-4xl">💙</span>
              How are you feeling today?
            </h1>
            <p className="text-gray-500 text-sm mb-8 text-center">Take a moment to check in with yourself before we begin.</p>
            
            <div className="w-full flex flex-col gap-3">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.score}
                  onClick={() => handleMoodSelect(option.score)}
                  className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-left text-sm font-bold text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm flex items-center gap-3"
                >
                  <span className="text-xl">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: What to check today? */}
        {step === 5 && (
          <div className="flex flex-col items-center">
            <Card className="w-full p-6 md:p-8 rounded-3xl shadow-lg border-white/60 bg-white/80 backdrop-blur-xl">
              <h2 className="text-xl font-black text-purple-900 mb-2">What would you like to check today?</h2>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                These questionnaires are standardized screening tools designed to help you reflect on your current experiences. They are not used to diagnose you.
              </p>
              
              <div className="flex flex-col gap-3 mb-8">
                <button onClick={() => handleFinish('/assessments')} className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-all">
                  <span className="text-2xl mb-1">🌙</span>
                  <span className="font-bold text-gray-900 text-sm">PHQ-9</span>
                  <span className="text-[10px] text-gray-500">Mood & depressive symptoms</span>
                </button>
                <button onClick={() => handleFinish('/assessments')} className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-all">
                  <span className="text-2xl mb-1">🌀</span>
                  <span className="font-bold text-gray-900 text-sm">GAD-7</span>
                  <span className="text-[10px] text-gray-500">Anxiety symptoms</span>
                </button>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => handleFinish('/dashboard')} variant="secondary" className="flex-1 bg-white border-gray-200 text-gray-600 rounded-xl text-xs py-3">
                  Go to Dashboard
                </Button>
                <Button onClick={() => handleFinish('/assessments')} variant="primary" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-none rounded-xl text-xs py-3">
                  Continue
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};
