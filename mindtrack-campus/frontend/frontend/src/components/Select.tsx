import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          {label}
        </label>
        <select
          ref={ref}
          className={`border rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40' 
              : 'border-gray-300 dark:border-slate-700 focus:ring-blue-200 dark:focus:ring-blue-900/40 focus:border-blue-500'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';