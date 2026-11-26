import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { clearFailedLogins, getLoginCooldownMs, recordFailedLogin } from '../utils/loginAttemptLimiter';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { DevPatchNotes } from '../components/DevPatchNotes';
import { Eye, EyeOff } from 'lucide-react';
import { consumeInactivityNotice } from '../utils/sessionInactivity';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, role, authError, retryAccountLoad } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(() => getLoginCooldownMs());
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inactivityMessage] = useState(consumeInactivityNotice);
  const registrationMessage = (location.state as { message?: string } | null)?.message ?? inactivityMessage;

  // The ONLY place that decides where someone lands - driven entirely by
  // the real role the backend returns for this account, never by
  // anything picked on this screen. Students are routed to /welcome
  // where returning students do mood/screening and new students do full onboarding.
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      navigate(role === 'admin' ? '/admin' : '/welcome');
    }
  }, [isAuthenticated, isLoading, navigate, role]);



  useEffect(() => {
    if (!cooldownMs) return;
    const timer = window.setInterval(() => setCooldownMs(getLoginCooldownMs()), 1_000);
    return () => window.clearInterval(timer);
  }, [cooldownMs]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const remainingCooldown = getLoginCooldownMs();
    if (remainingCooldown) {
      setCooldownMs(remainingCooldown);
      return;
    }
    setIsSubmitting(true);

    try {
      await login(email, password);
      clearFailedLogins();
      // Account loading has its own bounded loading/error state.
    } catch (loginError) {
      if (typeof loginError !== 'object' || loginError === null || !('code' in loginError) || loginError.code !== 'invalid_credentials') {
        setError('Sign-in could not be completed. Please check your connection and try again.');
        return;
      }
      recordFailedLogin();
      const nextCooldown = getLoginCooldownMs();
      setCooldownMs(nextCooldown);
      setError(nextCooldown
        ? 'Too many unsuccessful sign-in attempts. Please wait 15 minutes before trying again.'
        : 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 w-full relative transition-colors duration-200">
      {/* Quick Theme Toggle in corner */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle variant="pill" />
      </div>

      {/* LEFT COLUMN: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 relative z-10 min-h-screen lg:min-h-screen">
        {/* Soft background ambient gradient glows */}
        <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-brand-200/50 dark:bg-brand-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-brand-200/50 dark:bg-brand-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 pointer-events-none"></div>

        <div className="w-full max-w-md p-8 md:p-10 rounded-3xl shadow-xl shadow-brand-950/5 dark:shadow-2xl dark:shadow-black/50 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl relative z-10 transition-colors">
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className="w-12 h-12 bg-teal-700 dark:bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-800/25 ring-4 ring-teal-50 dark:ring-teal-950/60 mb-4 transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 4c-8.2.3-13.7 3-15.6 7.8-1.2 3.1.5 6.2 3.6 6.2C14.6 18 18.2 11.3 20 4Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                <path d="M5.3 19.2c2.8-4.8 6.7-8.4 11.8-11.2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                <path d="M10.2 14.6c-.2-1.4-.9-2.6-2.1-3.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
            <h1 className="mindcare-wordmark text-3xl font-black text-slate-900 dark:text-white tracking-tight">MindCare</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Welcome back to your safe space</p>
          </div>

          {(error || authError) && (
            <div role="alert" className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm font-medium rounded-xl px-4 py-3 mb-4">
              {error || authError}
            </div>
          )}
          {registrationMessage && (
            <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {registrationMessage}
            </div>
          )}

          {!isAuthenticated && <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:focus:border-brand-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
                  placeholder="you@gmail.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                <button type="button" onClick={() => setIsForgotOpen(true)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">Forgot?</button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:focus:border-brand-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {cooldownMs > 0 && <p className="text-center text-xs font-semibold text-amber-700 dark:text-amber-300">Sign-in is temporarily paused for {Math.ceil(cooldownMs / 60_000)} minute(s).</p>}
            <Button type="submit" variant="primary" disabled={cooldownMs > 0} className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl py-3.5 mt-2 shadow-lg shadow-brand-600/25 border-none text-sm font-semibold transition-all cursor-pointer" isLoading={isSubmitting}>
              Sign In to Portal
            </Button>
          </form>}
          {isAuthenticated && authError && (
            <Button type="button" onClick={() => { void retryAccountLoad(); }} isLoading={isLoading} className="mt-4 w-full">
              Try loading my account again
            </Button>
          )}
          {isAuthenticated && isLoading && <p role="status" className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">Loading your account…</p>}
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            New to MindCare?{' '}
            <Link to="/create-account" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Feature Highlights */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-slate-800 via-[#29364a] to-[#203b3d] px-8 py-12 lg:py-8 lg:px-16 xl:px-24 flex flex-col justify-center relative overflow-hidden text-white border-t lg:border-t-0 lg:border-l border-white/10">
        <div className="absolute top-[-10%] right-[-20%] w-160 h-160 bg-teal-300 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-120 h-120 bg-brand-400 rounded-full mix-blend-screen filter blur-[100px] opacity-15 pointer-events-none"></div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></span>
            MindCare Campus
          </div>

          <h2 className="text-3xl md:text-4xl xl:text-5xl font-black text-white mb-4 leading-tight">
            Prioritize your<br/>peace of mind.
          </h2>
          <p className="text-slate-200/90 mb-8 md:mb-10 text-base md:text-lg leading-relaxed">
            The official wellness and peer-support platform for students who want to stay in tune with their mental well-being.
          </p>

          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="flex items-start gap-4 md:gap-5">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shrink-0 text-teal-100 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Private Journaling</h3>
                <p className="text-slate-200/80 text-sm mt-1 leading-relaxed">A secure space to write down your thoughts, reflect on your day, and privately process your emotions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 md:gap-5">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shrink-0 text-teal-100 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Freedom Wall</h3>
                <p className="text-slate-200/80 text-sm mt-1 leading-relaxed">Share your struggles and victories anonymously. Give and receive hugs from fellow students.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 md:gap-5">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shrink-0 text-teal-100 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Professional Guidance</h3>
                <p className="text-slate-200/80 text-sm mt-1 leading-relaxed">Easily access wellness exercises and securely connect with campus counselors when you need it.</p>
              </div>
            </div>
          </div>
          <DevPatchNotes />
          <Link to="/user-manual" className="mt-4 inline-block text-sm font-bold text-teal-200 hover:underline">Need a hand? Read the user manual →</Link>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
};
