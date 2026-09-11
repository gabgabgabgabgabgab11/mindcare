import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-gray-700">
          {label}
        </label>
        <select
          ref={ref}
          className={`border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';