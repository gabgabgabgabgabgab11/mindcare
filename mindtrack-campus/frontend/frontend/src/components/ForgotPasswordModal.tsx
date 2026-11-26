import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';
import { Button } from './Button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError(null);
      setSent(false);
      setIsSubmitting(false);
      // Focus the email input after opening
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (resetError) {
      setError('We could not start the password reset. Please try again later.');
      return;
    }
    // Deliberately generic: do not reveal whether an address has an account.
    setSent(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-pw-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div>
            <p className="mindcare-wordmark text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">MindCare</p>
            <h2 id="forgot-pw-title" className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              Reset your password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
            Enter your email address and we'll send a secure password-reset link.
          </p>

          {sent ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  If an account uses that email, a password-reset link has been sent. Please check your inbox (and spam folder).
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              )}
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Email address
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:focus:border-brand-400 focus:bg-white dark:focus:bg-slate-800 font-normal transition-all"
                  />
                </div>
              </label>
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        {sent && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-5 py-2 text-sm font-semibold">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
