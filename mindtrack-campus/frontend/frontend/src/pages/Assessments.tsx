import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

// 1. Full PHQ-9 Questionnaire (Depression)
const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
  "Trouble concentrating on things, such as reading the newspaper or watching television?",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
  "Thoughts that you would be better off dead, or of hurting yourself in some way?"
];

// 2. Full GAD-7 Questionnaire (Anxiety)
const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge?",
  "Not being able to stop or control worrying?",
  "Worrying too much about different things?",
  "Trouble relaxing?",
  "Being so restless that it is hard to sit still?",
  "Becoming easily annoyed or irritable?",
  "Feeling afraid, as if something awful might happen?"
];

export const Assessments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if the user clicked GAD-7, otherwise default to PHQ-9
  const isGad7 = location.state?.type === 'GAD-7';
  const currentQuestions = isGad7 ? GAD7_QUESTIONS : PHQ9_QUESTIONS;
  const assessmentName = isGad7 ? 'GAD-7' : 'PHQ-9';

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleNext = () => {
    if (selectedAnswer === null) return;

    setIsFading(true);
    setTimeout(() => {
      if (currentStep < currentQuestions.length - 1) {
        setCurrentStep(prev => prev + 1);
        setSelectedAnswer(null); // Reset selection for the next question
      } else {
        setIsCompleted(true);
      }
      setIsFading(false);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full min-h-[80vh] py-8">
      
      {/* --------------------------------------------------------- */}
      {/* VIEW 1: THE ASSESSMENT QUIZ                               */}
      {/* --------------------------------------------------------- */}
      {!isCompleted && (
        <div className={`w-full transition-all duration-300 ease-in-out ${isFading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-gray-400">{assessmentName}</span>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
                Question {currentStep + 1} of {currentQuestions.length}
              </span>
            </div>
          </div>

          <Card className="p-6 md:p-8 rounded-3xl shadow-sm border-gray-100 bg-white">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Over the past 2 weeks, how often have you been bothered by the following?</p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-8 leading-tight">
              {currentQuestions[currentStep]}
            </h2>

            <div className="flex flex-col gap-3 mb-8">
              {['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((option, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`p-4 rounded-2xl border-2 text-left text-sm font-bold transition-all ${
                    selectedAnswer === index 
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 max-w-50 leading-relaxed">
                This screening is for self-awareness only and does not provide a diagnosis.
              </p>
              <Button 
                variant="primary" 
                onClick={handleNext} 
                disabled={selectedAnswer === null}
                className={`rounded-xl px-6 py-2.5 text-sm border-none shadow-md ${selectedAnswer === null ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              >
                {currentStep === currentQuestions.length - 1 ? 'See Results' : 'Next'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* VIEW 2: THE WELLNESS REFLECTION (RESULTS SCREEN)          */}
      {/* --------------------------------------------------------- */}
      {isCompleted && (
        <div className={`w-full transition-all duration-500 ease-in-out ${isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <Card className="p-8 rounded-3xl shadow-lg border-white/60 bg-white/80 backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden">
            
            <div className="absolute top-[-20%] left-[20%] w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 shadow-sm relative z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>

            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-2 relative z-10">Doing Well</span>
            <h1 className="text-2xl font-black text-gray-900 mb-3 relative z-10">Your current wellness reflection</h1>
            
            <p className="text-gray-600 text-sm leading-relaxed mb-6 relative z-10">
              It sounds like you're managing things reasonably well right now. Keep taking care of yourself with healthy routines, rest, and connection.
            </p>

            <div className="w-full bg-purple-50/50 border border-purple-100 rounded-2xl p-5 mb-8 text-left relative z-10">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3">Supportive Recommendations</h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 text-purple-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">Take a short break today and allow yourself to rest without guilt.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 text-purple-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">Talk to someone you trust — a friend, family member, or classmate.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 text-purple-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">Consider reaching out to PUP Santa Maria campus counseling if you ever need extra support.</p>
                </li>
              </ul>
            </div>

            <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3.5 shadow-md border-none text-sm relative z-10">
              Back to Dashboard
            </Button>

            <p className="text-[10px] text-gray-400 mt-6 relative z-10 text-center max-w-62.5">
              MindCare is a wellness screening tool — not a diagnostic service.
            </p>

          </Card>
        </div>
      )}

    </div>
  );
};