import { Link, useLocation } from 'react-router-dom';

export const DesktopNavLink = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`text-sm font-bold transition-all ${
        isActive
          ? 'text-brand-700 dark:text-brand-300 border-b-2 border-brand-600 dark:border-brand-400 pb-1'
          : 'text-gray-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300'
      }`}
    >
      {label}
    </Link>
  );
};
