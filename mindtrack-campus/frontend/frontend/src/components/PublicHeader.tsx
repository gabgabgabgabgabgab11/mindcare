import { Heart } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const PublicHeader = () => (
  <header className="sticky top-0 z-50 border-b border-emerald-100/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
    <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2.5" aria-label="MindCare home">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/20"><Heart className="h-5 w-5 fill-current" aria-hidden="true" /></span>
        <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">MindCare</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
        <NavLink to="/about" className={({ isActive }) => `text-xs font-bold sm:text-sm ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'}`}>About us</NavLink>
        <NavLink to="/user-manual" className={({ isActive }) => `text-xs font-bold sm:text-sm ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'}`}>User manual</NavLink>
        <ThemeToggle variant="icon" />
        <Link to="/login" className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-700 sm:px-4 sm:text-sm">Sign in</Link>
      </div>
    </nav>
  </header>
);
