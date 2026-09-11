import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSavingMood, setIsSavingMood] = useState(false);

  // Dynamic Greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Use the student's actual name for a premium, personalized feel
  const userName = "Aldrin";

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setIsSavingMood(true);
    // Simulate saving the mood
    setTimeout(() => {
      setIsSavingMood(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto w-full pb-8">
      
      {/* 1. HERO GREETING SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden mt-2">
        {/* Decorative Background Blur */}
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            {greeting}, {userName}.
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-md">
            Welcome to your wellness space. Take things at your own pace today.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-purple-50 px-4 py-2.5 rounded-2xl border border-purple-100">
          <div className="w-8 h-8 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Campus</p>
            <p className="text-xs font-bold text-purple-900">PUP Santa Maria</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Takes up more space on desktop) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* 2. QUICK MOOD CHECK-IN WIDGET */}
          <Card className="p-6 md:p-8 rounded-3xl shadow-sm border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">How are you feeling?</h2>
                <p className="text-xs text-gray-500 mt-1">Log your current mood to track your baseline.</p>
              </div>
              {isSavingMood && (
                <span className="text-xs font-bold text-purple-600 animate-pulse bg-purple-50 px-3 py-1 rounded-full">Saving...</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Positive Mood */}
              <button 
                onClick={() => handleMoodSelect('good')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:-translate-y-1 ${selectedMood === 'good' ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-100 bg-white hover:border-green-200'}`}
              >
                <svg className={`w-8 h-8 mb-2 ${selectedMood === 'good' ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className={`text-xs font-bold ${selectedMood === 'good' ? 'text-green-700' : 'text-gray-500'}`}>Good</span>
              </button>
              
              {/* Neutral Mood */}
              <button 
                onClick={() => handleMoodSelect('okay')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:-translate-y-1 ${selectedMood === 'okay' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-blue-200'}`}
              >
                <svg className={`w-8 h-8 mb-2 ${selectedMood === 'okay' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h.01M15 10h.01M9 15h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className={`text-xs font-bold ${selectedMood === 'okay' ? 'text-blue-700' : 'text-gray-500'}`}>Okay</span>
              </button>

              {/* Struggling Mood */}
              <button 
                onClick={() => handleMoodSelect('struggling')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:-translate-y-1 ${selectedMood === 'struggling' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-100 bg-white hover:border-orange-200'}`}
              >
                <svg className={`w-8 h-8 mb-2 ${selectedMood === 'struggling' ? 'text-orange-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h.01M15 10h.01M10 14a3.001 3.001 0 004 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className={`text-xs font-bold ${selectedMood === 'struggling' ? 'text-orange-700' : 'text-gray-500'}`}>Struggling</span>
              </button>
            </div>
          </Card>

          {/* 3. ASSESSMENTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PHQ-9 Card */}
            <Card className="p-6 rounded-3xl shadow-sm border-gray-100 bg-white flex flex-col justify-between h-full group hover:border-purple-200 transition-colors">
              <div>
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">PHQ-9 Screening</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">Reflect on your mood and emotional well-being over the past two weeks.</p>
              </div>
              <button 
                onClick={() => navigate('/assessments', { state: { type: 'PHQ-9' } })}
                className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider"
              >
                Start Check <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </Card>

            {/* GAD-7 Card */}
            <Card className="p-6 rounded-3xl shadow-sm border-gray-100 bg-white flex flex-col justify-between h-full group hover:border-blue-200 transition-colors">
              <div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">GAD-7 Screening</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">Explore how anxiety may be affecting you and identify triggers.</p>
              </div>
              <button 
                onClick={() => navigate('/assessments', { state: { type: 'GAD-7' } })}
                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
              >
                Start Check <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </Card>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* 4. WELLNESS SNAPSHOT (Gamification & Journal) */}
          <Card className="p-0 rounded-3xl shadow-sm border-gray-100 bg-white overflow-hidden">
            
            <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Journal Streak</span>
                <span className="text-2xl">🔥</span>
              </div>
              <h3 className="text-3xl font-black mb-1">3 Days</h3>
              <p className="text-xs text-indigo-100">You're doing great! Keep writing to process your thoughts.</p>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Today's Prompt
              </h4>
              <p className="text-sm text-gray-600 italic mb-4">"What is one small win you had today?"</p>
              
              <Button onClick={() => navigate('/journal')} variant="secondary" className="w-full bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-purple-700 transition-colors text-xs py-2.5 rounded-xl shadow-sm">
                Open Journal
              </Button>
            </div>
            
          </Card>

          {/* Quick Support Link */}
          <button onClick={() => navigate('/resources')} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-purple-200 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900">Find Support</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">OSS Counseling</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

        </div>
      </div>
    </div>
  );
};