import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { Button } from '../components/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="mx-auto mt-12 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <p className="mindcare-wordmark text-sm font-bold text-brand-600">MindCare</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Enter your email address and we'll send a secure password-reset link.</p>
        {sent ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">If an account uses that email, a password-reset link has been sent. Please check your inbox.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Email
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="you@gmail.com" />
            </label>
            <Button type="submit" isLoading={isSubmitting} className="w-full">Send reset link</Button>
          </form>
        )}
        <Link to="/login" className="mt-6 inline-block text-sm font-bold text-brand-600 hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
};
