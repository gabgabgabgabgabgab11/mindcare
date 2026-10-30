import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getAssessmentQuestions, submitGad7, submitPhq9, getCurrentUser } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { getCompanionDisplay, PETS, type CompanionPetState } from '../constants/pets';
import { getCompanionPetState, setCompanionPetState } from '../utils/petState';
import { useTheme } from '../contexts/useTheme';
import type { AssessmentQuestions, AssessmentResult } from '../types';

export const Assessments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const isGad7 = location.state?.type === 'GAD-7';
  const assessmentCode = isGad7 ? 'gad7' : 'phq9';
  const assessmentName = isGad7 ? 'GAD-7' : 'PHQ-9';

  const [questionData, setQuestionData] = useState<AssessmentQuestions | null>(null);
  const [isLoadingQuestionData, setIsLoadingQuestionData] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [responses, setResponses] = useState<number[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Companion state
  const cachedData = studentCache.dashboard;
  const [petId, setPetId] = useState<string | null>(cachedData?.user?.companion_pet ?? null);
  const [nickname, setNickname] = useState<string>(cachedData?.user?.companion_nickname ?? '');
  const [petState, setPetState] = useState<CompanionPetState>(() => getCompanionPetState(isDarkMode));
  const [isPoked, setIsPoked] = useState(false);

  useEffect(() => {
    const handleNicknameChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
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
          setNickname(user.companion_nickname ?? '');
        })
        .catch(() => {});
    }
  }, [cachedData]);

  const effectivePetId = petId || 'capybara';
  const companionInfo = getCompanionDisplay(
    effectivePetId, 
    new Date().getHours(), 
    nickname, 
    isDarkMode, 
    isCompleted ? 'happy' : petState
  ) || {
    pet: PETS.capybara,
    image: PETS.capybara.images[isCompleted ? 'happy' : petState],
    isSleeping: petState === 'sleeping' && !isCompleted,
    state: isCompleted ? 'happy' : petState,
    statusText: '',
  };

  const handlePoke = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 500);

    const nextState: CompanionPetState =
      petState === 'sleeping' ? 'idle' : petState === 'idle' ? 'happy' : (isDarkMode ? 'sleeping' : 'idle');
    setCompanionPetState(nextState);
  };

  useEffect(() => {
    getAssessmentQuestions(assessmentCode)
      .then((data) => {
        setQuestionData(data);
        setCurrentStep(0);
        setResponses([]);
        setSelectedAnswer(null);
        setIsCompleted(false);
        setError(null);
      })
      .catch(() => setError(`${assessmentName} questions could not be loaded. Please try again.`))
      .finally(() => setIsLoadingQuestionData(false));
  }, [assessmentCode, assessmentName]);

  const currentQuestions = questionData?.items ?? [];
  const responseOptions = questionData ? Object.entries(questionData.scale).sort(([a], [b]) => Number(a) - Number(b)) : [];
  const isLoadingQuestions = isLoadingQuestionData || questionData?.assessment_code !== assessmentCode;

  const handleNext = async () => {
    if (selectedAnswer === null || !questionData || isSubmitting) return;

    setError(null);
    setIsFading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const nextResponses = [...responses, selectedAnswer];
    if (currentStep < currentQuestions.length - 1) {
      setResponses(nextResponses);
      setCurrentStep(prev => prev + 1);
      setSelectedAnswer(null);
      setIsFading(false);
      return;
    }

    try {
      setIsSubmitting(true);
      const submittedResult = isGad7
        ? await submitGad7({ responses: nextResponses })
        : await submitPhq9({ responses: nextResponses });
      setResult(submittedResult);
      setIsCompleted(true);
    } catch {
      setError('Your assessment could not be submitted. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsFading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-5xl mx-auto w-full min-h-[80vh] py-4 sm:py-6 px-2 sm:px-6">
      
      {isLoadingQuestions && (
        <Card className="w-full max-w-md p-8 rounded-3xl shadow-sm border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center animate-pulse">
          <div className="w-12 h-12 bg-brand-100 dark:bg-brand-950/80 rounded-full mx-auto mb-4 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Loading {assessmentName} questions...</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Preparing your screening questionnaire</p>
        </Card>
      )}

      {!isLoadingQuestions && !isCompleted && questionData && (
        <div className={`w-full transition-all duration-300 ease-in-out ${isFading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}
              className="text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-gray-400 dark:text-slate-500">{assessmentName}</span>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-widest bg-brand-50 dark:bg-brand-950/70 border border-brand-100 dark:border-brand-900/50 px-3 py-1 rounded-full">
                Question {currentStep + 1} of {currentQuestions.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / currentQuestions.length) * 100}%` }}
            />
          </div>

          {/* Main Screening Layout mapped to user scales: Pet (Orange) on Left, Question (Black) on Top-Right, Choices (Blue) on Bottom-Right */}
          <div className="flex flex-row items-center gap-2.5 sm:gap-6 w-full">
            
            {/* 1. ORANGE: Companion Pet on the Left (scaled to span alongside the right side) */}
            <div className="w-[36%] xs:w-[38%] sm:w-[35%] md:w-[32%] lg:w-[30%] shrink-0 flex flex-col items-center justify-center self-center py-2">
              <button
                type="button"
                onClick={handlePoke}
                title={`Click to poke ${nickname || companionInfo.pet.name} (${petState})`}
                className={`w-28 h-28 xs:w-36 xs:h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 p-0 flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer select-none focus:outline-none bg-transparent border-none ${
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
              <div className="flex items-center gap-1.5 mt-2 text-center">
                <span className="text-xs sm:text-sm font-extrabold text-gray-700 dark:text-slate-200 tracking-tight">
                  {nickname || companionInfo.pet.name}
                </span>
                <span className="text-xs">
                  {petState === 'sleeping' ? '💤' : petState === 'idle' ? '🐾' : '✨'}
                </span>
              </div>
            </div>

            {/* 2. RIGHT SIDE: Question Bubble (Black) on Top + Choices Card (Blue) on Bottom */}
            <div className="flex-1 min-w-0 flex flex-col gap-2.5 sm:gap-4">
              
              {/* BLACK: Question in Speech Bubble */}
              <div className="relative bg-white dark:bg-slate-900 border-2 border-brand-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs transition-colors">
                {/* Speech bubble tail pointing left to the pet */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-r-8 border-r-white dark:border-r-slate-900 border-b-6 border-b-transparent"></div>
                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-r-8 border-r-brand-100 dark:border-slate-800 border-b-6 border-b-transparent -z-10"></div>

                <p className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 leading-snug">
                  {questionData.instructions}
                </p>
                <h2 className="text-xs xs:text-sm sm:text-base md:text-xl font-black text-gray-900 dark:text-white leading-snug">
                  {currentQuestions[currentStep]}
                </h2>
              </div>

              {/* BLUE: Choices Card */}
              <Card className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {responseOptions.map(([value, option]) => {
                    const index = Number(value);
                    const isSelected = selectedAnswer === index;
                    return (
                      <button 
                        key={index}
                        onClick={() => setSelectedAnswer(index)}
                        disabled={isSubmitting}
                        className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 text-left text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-60 flex items-center justify-between group ${
                          isSelected 
                            ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/40 text-brand-950 dark:text-white shadow-xs' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-brand-300 dark:hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-slate-700/80'
                        }`}
                      >
                        <span className="font-semibold text-xs sm:text-sm leading-snug">{option}</span>
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-2 ${
                          isSelected
                            ? 'border-brand-600 dark:border-brand-400 bg-brand-600 dark:border-brand-400 text-white'
                            : 'border-slate-300 dark:border-slate-600 group-hover:border-brand-400 dark:group-hover:border-brand-400'
                        }`}>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2.5 sm:pt-4 border-t border-gray-100 dark:border-slate-800 gap-2">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 max-w-32 sm:max-w-44 leading-tight">
                    This screening is for self-awareness only and does not provide a diagnosis.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={handleNext} 
                    disabled={selectedAnswer === null}
                    className={`rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm border-none shadow-md transition-all shrink-0 ${
                      selectedAnswer === null 
                        ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed' 
                        : 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer shadow-brand-600/20'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : currentStep === currentQuestions.length - 1 ? 'See Results' : 'Next'}
                  </Button>
                </div>
                {error && <p className="mt-2 text-right text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* VIEW 2: THE WELLNESS REFLECTION (RESULTS SCREEN)          */}
      {/* --------------------------------------------------------- */}
      {isCompleted && (
        <div className={`w-full max-w-xl transition-all duration-500 ease-in-out ${isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <Card className="p-8 rounded-3xl shadow-lg border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden transition-colors">
            
            <div className="absolute top-[-20%] left-[20%] w-40 h-40 bg-brand-200 dark:bg-brand-900/30 rounded-full blur-3xl opacity-50 dark:opacity-20 pointer-events-none"></div>

            {/* Companion celebrating completion */}
            <div className="flex flex-col items-center mb-3 relative z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                <img
                  src={companionInfo.image}
                  alt={`${companionInfo.pet.name} celebrating`}
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                />
              </div>
              <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300 mt-1">
                {nickname || companionInfo.pet.name} is proud of you! ✨
              </span>
            </div>

            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2 relative z-10">
              {result?.severity_band ?? 'Submitted'}
            </span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3 relative z-10">Your current wellness reflection</h1>
            
            <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-6 relative z-10">
              <span className="block">
                Your {assessmentName} results fall in the <span className="capitalize">{result?.severity_band.replaceAll('_', ' ') ?? 'submitted'}</span> range.
              </span>
              <span className="block">This reflects recent {isGad7 ? 'anxiety' : 'mood'} symptoms; it is not a diagnosis.</span>
            </p>

            <section className="w-full bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 rounded-2xl mb-8 text-left relative z-10 overflow-hidden">
              <button
                type="button"
                aria-expanded={isRecommendationsOpen}
                aria-controls="supportive-recommendations-list"
                onClick={() => setIsRecommendationsOpen((open) => !open)}
                className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-brand-100/50 dark:hover:bg-brand-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
              >
                <span className="text-xs font-bold text-brand-900 dark:text-brand-300 uppercase tracking-wider">
                  Supportive Recommendations
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-brand-700 dark:text-brand-300 transition-transform duration-200 ${isRecommendationsOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isRecommendationsOpen && (
              <ul id="supportive-recommendations-list" className="flex flex-col gap-3 px-5 pb-5">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-500 dark:text-brand-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">Take a short break today and allow yourself to rest without guilt.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-500 dark:text-brand-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">Talk to someone you trust — a friend, family member, or classmate.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-500 dark:text-brand-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">Consider reaching out to PUP Santa Maria campus counseling if you ever need extra support.</p>
                </li>
              </ul>
              )}
            </section>

            <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-3.5 shadow-md border-none text-sm relative z-10 cursor-pointer shadow-brand-600/20">
              Back to Dashboard
            </Button>

            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-6 relative z-10 text-center max-w-62.5">
              MindCare is a wellness screening tool — not a diagnostic service.
            </p>

          </Card>
        </div>
      )}

    </div>
  );
};
