import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { Button } from '../components/Button';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('Use at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }
    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (updateError) {
      setError('This reset link is invalid or expired. Request a new one and try again.');
      return;
    }
    await supabase.auth.signOut();
    navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in with your new password.' } });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="mx-auto mt-12 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-bold text-brand-600">MindCare</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">New password
            <input type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Confirm password
            <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
          <Button type="submit" isLoading={isSubmitting} className="w-full">Update password</Button>
        </form>
        <Link to="/login" className="mt-6 inline-block text-sm font-bold text-brand-600 hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
};
