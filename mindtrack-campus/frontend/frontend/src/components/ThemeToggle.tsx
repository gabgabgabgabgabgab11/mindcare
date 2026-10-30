import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/useTheme';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'sidebar';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${
          isDark
            ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
        } ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-brand-600 transition-transform duration-300" />
          )}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isDark ? 'bg-slate-700 text-amber-300' : 'bg-brand-50 text-brand-600'
          }`}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-xs ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-brand-700'
        } ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Light</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-brand-600" />
            <span>Dark</span>
          </>
        )}
      </button>
    );
  }

  // Default 'icon' button for headers and navigation bars
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-sm'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 shadow-xs'
      } ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300" />
      )}
    </button>
  );
};
