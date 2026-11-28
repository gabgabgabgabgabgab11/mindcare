import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { Button } from '../components/Button';
import { TermsModal } from '../components/TermsModal';
import { ThemeToggle } from '../components/ThemeToggle';

import { describeSignupError } from '../utils/signupErrors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CreateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const passwordRequirements = [
    ['At least 8 characters', password.length >= 8],
    ['One uppercase letter', /[A-Z]/.test(password)],
    ['One lowercase letter', /[a-z]/.test(password)],
    ['One number', /\d/.test(password)],
  ] as const;
  const isPasswordValid = passwordRequirements.every(([, valid]) => valid);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionInFlight.current) return;
    setError(null);
    const normalizedEmail = email.trim();
    if (!emailPattern.test(normalizedEmail)) return setError('Use a valid email address (e.g. you@gmail.com).');
    if (!isPasswordValid) return setError('Password does not meet the requirements.');
    if (password !== confirmPassword) return setError('Password confirmation does not match.');
    if (!hasAgreed) return setError('Accept the Terms & Conditions and Privacy Policy to continue.');
    submissionInFlight.current = true;
    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: normalizedEmail, password });
      if (signUpError) {
        setError(describeSignupError(signUpError));
        return;
      }
      if (!data.user) {
        setError('Registration could not be confirmed. Check your inbox or try signing in before creating another account.');
        return;
      }
      navigate('/login', { state: { message: 'Check your email to verify your account.' } });
    } catch (signUpError) {
      setError(describeSignupError(signUpError));
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 md:px-8 relative transition-colors duration-200">
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle variant="pill" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <div className="w-full p-6 md:p-10 rounded-3xl shadow-xl shadow-brand-950/5 dark:shadow-2xl dark:shadow-black/50 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors">
          <div className="mb-8">
            <p className="mindcare-wordmark text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">MindCare</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Your MindCare Account</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Set up your account to begin monitoring your wellness and accessing student support resources.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Email Address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gmail.com"
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 font-normal text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-600 dark:focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Password
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 pr-20 font-normal text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-600 dark:focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <ul className="grid gap-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
              {passwordRequirements.map(([label, valid]) => (
                <li key={label} className={valid ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                  {valid ? '✓' : '○'} {label}
                </li>
              ))}
            </ul>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Confirm Password
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 font-normal text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-600 dark:focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </label>

            <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(event) => setHasAgreed(event.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-brand-600"
              />
              <span>
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Terms &amp; Conditions
                </button>{' '}
                and{' '}
                <Link to="/privacy-policy" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!hasAgreed || isSubmitting}
              className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 py-3.5 text-white font-semibold shadow-lg shadow-brand-600/25 border-none transition-all cursor-pointer"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAgree={() => {
          setHasAgreed(true);
          setIsTermsOpen(false);
        }}
      />
    </div>
  );
};
