import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

type NavigationState = { type: string };

export const SidebarLink = ({
  to,
  label,
  icon,
  state,
    onNavigate = () => undefined,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  state?: NavigationState;
    onNavigate?: () => void;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to && (!state || location.state?.type === state.type);

  return (
    <Link
      to={to}
      state={state}
      onClick={onNavigate}
      className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
        isActive
          ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-r-4 border-brand-600 dark:border-brand-400 font-semibold'
          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-300'
      }`}
    >
      <div className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'}>
        {icon}
      </div>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
};