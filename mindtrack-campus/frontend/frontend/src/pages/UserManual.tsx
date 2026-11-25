import { useEffect } from 'react';
import { ArrowRight, BookOpen, Heart, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';

const topics = [
  { id: 'account', title: 'Create an account & sign in', intro: 'Start with an email address you can access.', steps: [
    'Choose Sign in, then Create an account. Enter your email and a password with at least 8 characters, an uppercase letter, a lowercase letter, and a number.',
    'Repeat your password, read the Terms & Conditions and Privacy Policy, then select the agreement checkbox and Create Account.',
    'If email verification is required, check your inbox and spam folder for the confirmation link before signing in.',
    'Sign in with your email and password. Use Forgot? on the sign-in page to request a password reset if needed.',
  ] },
  { id: 'first-visit', title: 'Your first visit & daily check-in', intro: 'Take a moment to get comfortable before exploring.', steps: [
    'On your first student visit, read the welcome and consent screens and complete the consent steps to continue.',
    'Choose the mood that best describes how you feel. Wait for your check-in to save before continuing.',
    'Returning students start with a mood check-in. Follow the on-screen choices to continue to the dashboard or a screening.',
  ] },
  { id: 'dashboard', title: 'Find your way around', intro: 'Your dashboard brings your wellness activity together.', steps: [
    'Use the navigation menu to open your journal, screenings, Freedom Wall, resources, and support. On a small screen, open the menu to see these pages.',
    'Review your check-in history, recent activity, and wellness summaries on the dashboard.',
    'Open your profile to update the available profile details and companion preferences. Use the theme button to switch between light and dark mode.',
  ] },
  { id: 'journal', title: 'Write a reflective journal', intro: 'Give your thoughts a little room.', steps: [
    'Open the journal and write your reflection in the entry box.',
    'Choose the save action, read the privacy notice, and confirm if you wish to save the entry.',
    'Wait for the save result. You may see a reflection insight; these automated insights are not diagnoses.',
    'Find saved reflections in your past entries. If saving fails, keep a copy of your text and retry once your connection is stable.',
  ] },
  { id: 'screenings', title: 'Complete a wellness screening', intro: 'PHQ-9 and GAD-7 support reflection on your wellbeing.', steps: [
    'Choose the screening you want to complete from the available dashboard options.',
    'Read the instructions and answer each question based on the timeframe shown. Review your answers before submitting.',
    'Read the result and suggested next steps. A screening result is not a clinical diagnosis; speak with a qualified professional for an assessment.',
  ] },
  { id: 'wall', title: 'Share on the Freedom Wall', intro: 'Offer encouragement while protecting your personal information.', steps: [
    'Open Freedom Wall and choose Affirmation, Gratitude, or Win.',
    'Write a positive post of up to 300 characters. An optional nickname is available; avoid identifying details about yourself or others.',
    'Submit and read the status message. Posts may be published, held for review, or rejected under the community guidelines.',
    'Use the report action on a concerning post to send it for review.',
  ] },
  { id: 'resources', title: 'Explore resources & support', intro: 'Find a next step that feels right for you.', steps: [
    'Open Resources to browse the available wellness materials and exercises.',
    'Open Professional Support to view campus guidance information and the listed contact options. Follow the contact or booking instructions provided there.',
    'MindCare does not provide emergency monitoring. For an urgent need, seek immediate help through local emergency services or a qualified professional.',
  ] },
  { id: 'privacy', title: 'Manage privacy & sign out', intro: 'Understand your choices before sharing.', steps: [
    'Open Privacy Settings to read the policy and review Anonymize My Activity and Allow Activity Tracking. Read each control’s explanation before changing it.',
    'Use Sign out from the navigation menu when you finish on a shared device.',
    'After seven days without activity in this browser, you may be asked to sign in again.',
  ] },
];

export const UserManual = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'User manual | MindCare';
    window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fcfa] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />
      <main id="manual-content">
        <section className="relative isolate overflow-hidden border-b border-emerald-100 px-5 py-16 sm:px-8 sm:py-24 dark:border-slate-800">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-900/20" />
          <div className="mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-200"><BookOpen size={15} aria-hidden="true" />THE MINDCARE USER MANUAL</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl dark:text-white">A little guidance.<br /><span className="text-emerald-600 dark:text-emerald-400">At your own pace.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">From your first sign-in to your next reflection, here’s how to make yourself at home in MindCare. This guide is for student users.</p>
            <Link to="/create-account" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Get started <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[240px_1fr] lg:gap-14">
          <aside className="rounded-3xl border border-emerald-100 bg-white p-6 lg:sticky lg:top-28 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">In this guide</h2>
            <nav aria-label="Manual topics" className="mt-4 flex flex-col gap-3">
              {topics.map((topic, index) => <a key={topic.id} href={`#${topic.id}`} className="text-sm leading-6 text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300">{index + 1}. {topic.title}</a>)}
              <a href="#troubleshooting" className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Need a little help?</a>
            </nav>
          </aside>
          <div className="min-w-0 space-y-6">
            {topics.map((topic, index) => (
              <section key={topic.id} id={topic.id} aria-labelledby={`${topic.id}-heading`} className="scroll-mt-40 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9 dark:border-slate-800 dark:bg-slate-900">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{String(index + 1).padStart(2, '0')}</span>
                <h2 id={`${topic.id}-heading`} className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{topic.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{topic.intro}</p>
                <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600 marker:font-bold marker:text-emerald-600 dark:text-slate-300">{topic.steps.map(step => <li key={step} className="pl-1">{step}</li>)}</ol>
              </section>
            ))}
            <section id="troubleshooting" aria-labelledby="help-heading" className="scroll-mt-40 rounded-3xl bg-[#0f242a] p-6 text-white sm:p-9">
              <LifeBuoy className="h-7 w-7 text-emerald-300" aria-hidden="true" />
              <h2 id="help-heading" className="mt-4 text-2xl font-extrabold">Need a little help?</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
                <p><strong className="text-white">Can’t create an account?</strong> Check the password requirements, agreement checkbox, and error message. If confirmation emails are temporarily unavailable, wait before retrying and let the MindCare team know the error code shown.</p>
                <p><strong className="text-white">Can’t sign in?</strong> Check your email, password, and verification email. Use Forgot? to reset your password. After repeated unsuccessful attempts, wait for the displayed cooldown.</p>
                <p><strong className="text-white">A page won’t load?</strong> Check your connection and use the retry action if available. Save a copy of any unsent writing before refreshing. Share the page and error message with the MindCare team, without including passwords or private journal content.</p>
              </div>
              <Link to="/login" className="mt-6 inline-flex items-center gap-2 font-bold text-emerald-200 hover:underline">Back to sign in <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-emerald-100 px-5 py-8 dark:border-slate-800"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400"><Link to="/" className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300"><Heart size={17} aria-hidden="true" />MindCare</Link><Link to="/privacy-policy" className="hover:underline">Privacy policy</Link><span>Small steps toward student wellbeing.</span></div></footer>
    </div>
  );
};
