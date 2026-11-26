import { Heart, Menu, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const PublicHeader = () => (
  <header className="sticky top-0 z-50 border-b border-emerald-100/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
    <nav aria-label="Main navigation" className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-8 sm:py-4">
      <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="MindCare home">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/20 sm:h-10 sm:w-10"><Heart className="h-4 w-4 fill-current sm:h-5 sm:w-5" aria-hidden="true" /></span>
        <span className="mindcare-wordmark text-base font-black tracking-tight text-slate-900 sm:text-lg dark:text-white">MindCare</span>
      </Link>
      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        <NavLink to="/about" className={({ isActive }) => `hidden text-sm font-bold sm:block ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'}`}>About us</NavLink>
        <NavLink to="/user-manual" className={({ isActive }) => `hidden text-sm font-bold sm:block ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'}`}>User manual</NavLink>
        <ThemeToggle variant="icon" />
        <Link to="/login" className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-700 sm:px-4 sm:text-sm">Sign in</Link>
        <details className="group sm:hidden">
          <summary aria-label="Navigation menu" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5 group-open:hidden" aria-hidden="true" />
            <X className="hidden h-5 w-5 group-open:block" aria-hidden="true" />
          </summary>
          <div className="absolute inset-x-4 top-full mt-2 rounded-2xl border border-emerald-100 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <NavLink to="/about" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800">About us</NavLink>
            <NavLink to="/user-manual" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800">User manual</NavLink>
          </div>
        </details>
      </div>
    </nav>
  </header>
);
