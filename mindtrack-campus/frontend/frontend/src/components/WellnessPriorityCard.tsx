import { useEffect, useState } from 'react';
import { getWellnessPriority } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import type { WellnessPriorityResponse } from '../types';

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-800 dark:text-emerald-300', label: 'Low' },
  moderate: { bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60', text: 'text-amber-800 dark:text-amber-300', label: 'Moderate' },
  elevated: { bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60', text: 'text-rose-800 dark:text-rose-300', label: 'Elevated' },
  insufficient_data: { bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'Getting Started' },
  LOW: { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-800 dark:text-emerald-300', label: 'Low' },
  MODERATE: { bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60', text: 'text-amber-800 dark:text-amber-300', label: 'Moderate' },
  ELEVATED: { bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60', text: 'text-rose-800 dark:text-rose-300', label: 'Elevated' },
  INSUFFICIENT_DATA: { bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'Getting Started' },
};

export const WellnessPriorityCard = () => {
  const [data, setData] = useState<WellnessPriorityResponse | null>(
    studentCache.dashboard?.wellnessPriority ?? null
  );
  const [isLoading, setIsLoading] = useState(!studentCache.dashboard);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reuse the priority already fetched by StudentDashboard if available
    if (studentCache.dashboard) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const priority = await getWellnessPriority();
        if (!cancelled) {
          setData(priority);
          // Write to cache if the dashboard slot exists
          if (studentCache.dashboard) {
            studentCache.dashboard.wellnessPriority = priority;
          }
        }
      } catch {
        if (!cancelled) setError('Unable to load your wellness overview right now.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div data-tour="wellness-overview" className="rounded-2xl border border-gray-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div data-tour="wellness-overview" className="rounded-2xl border border-gray-200 dark:border-slate-800 p-6 text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        {error ?? 'No wellness overview available yet.'}
      </div>
    );
  }

  const style = PRIORITY_STYLES[data.priority] ?? PRIORITY_STYLES.LOW;

  return (
    <div data-tour="wellness-overview" className={`rounded-2xl border p-6 ${style.bg}`}>
      <div className="flex items-start gap-2 mb-4 text-xs text-gray-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 rounded-lg px-3 py-2 border border-gray-200 dark:border-slate-700">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0" />
        </svg>
        <span>This is just a general check-in based on your responses — it's not a medical diagnosis. If you're feeling overwhelmed, please reach out to your school counselor.</span>
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Wellness Overview</p>
      <p className={`text-2xl font-black mb-3 ${style.text}`}>{style.label}</p>

      {data.contributing_factors.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Based on</p>
          <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
            {data.contributing_factors.map((factor, index) => (
              <li key={`${factor}-${index}`} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-slate-500 mt-2 shrink-0"></span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}


    </div>
  );
};
