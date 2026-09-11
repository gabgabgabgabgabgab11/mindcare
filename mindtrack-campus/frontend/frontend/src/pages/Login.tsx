import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeRole, setActiveRole] = useState<'student' | 'oss_admin'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      login(activeRole);
      setIsSubmitting(false);
      
      if (activeRole === 'student') {
        navigate('/welcome'); // Route students to the new onboarding sequence!
      } else {
        navigate('/admin'); // Admins go straight to dashboard
      }
    }, 800);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-[#F8F9FE] w-full relative">
      
      {/* LEFT COLUMN: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative z-10">
        
        <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 pointer-events-none"></div>

        <Card className="w-full max-w-md p-8 md:p-10 rounded-4xl shadow-xl shadow-purple-900/5 border border-white/60 bg-white/80 backdrop-blur-xl relative z-10 flex flex-col justify-center">
          
          <div className="flex flex-col items-center justify-center mb-6 text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <h1 className="text-3xl font-black text-purple-900 tracking-tight">MindCare</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">Your space for wellness and support.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
              {activeRole === 'student' ? 'Welcome back' : 'Admin Portal Access'}
            </h2>

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  placeholder={activeRole === 'student' ? 'Student ID or Email' : 'Admin Email'}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  placeholder="Password"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                   <a href="#" className="text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors">Forgot password?</a>
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3.5 mt-2 shadow-md border-none text-sm" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          {/* New Disclaimer Section exactly like the video */}
          {activeRole === 'student' && (
            <div className="mt-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <p className="text-[10px] text-purple-900/60 leading-relaxed text-center">
                <span className="font-bold">Disclaimer:</span> MindCare is a wellness screening and self-awareness tool. It does not provide a mental health diagnosis and does not replace professional counseling or other mental health services.
              </p>
            </div>
          )}

          {/* Privacy Links */}
          <div className="flex items-center justify-center gap-3 mt-6 text-[10px] font-bold text-gray-400">
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-purple-600 transition-colors">Terms & Conditions</a>
          </div>

          {/* Directory Separator Toggle */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button 
              type="button" 
              onClick={() => setActiveRole(activeRole === 'student' ? 'oss_admin' : 'student')}
              className="text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              {activeRole === 'student' ? 'Are you an OSS Admin? Log in here.' : 'Return to Student Login'}
            </button>
          </div>

        </Card>
      </div>

      {/* RIGHT COLUMN: Feature Highlights */}
      <div className="w-full lg:w-1/2 lg:h-full bg-purple-900 px-8 py-12 lg:py-8 lg:px-16 xl:px-24 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-20%] w-160 h-160 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

        <h2 className="text-3xl md:text-4xl xl:text-5xl font-black text-white mb-3 leading-tight relative z-10">
          Prioritize your<br/>peace of mind.
        </h2>
        <p className="text-purple-200 mb-8 md:mb-10 text-base md:text-lg relative z-10 max-w-md">
          The official wellness and peer-support platform designed specifically for the PUP Santa Maria community.
        </p>
        
        {/* Features remain the same... */}
        <div className="flex flex-col gap-6 lg:gap-8 relative z-10">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-12 h-12 bg-purple-800/60 rounded-2xl flex items-center justify-center border border-purple-700 shrink-0 text-purple-300 shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Private Journaling</h3>
              <p className="text-purple-200 text-sm mt-1 leading-relaxed max-w-sm">A secure space to write down your thoughts, reflect on your day, and privately process your emotions.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-12 h-12 bg-purple-800/60 rounded-2xl flex items-center justify-center border border-purple-700 shrink-0 text-purple-300 shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Anonymous Freedom Wall</h3>
              <p className="text-purple-200 text-sm mt-1 leading-relaxed max-w-sm">Share your struggles and victories anonymously. Give and receive hugs from fellow students.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};