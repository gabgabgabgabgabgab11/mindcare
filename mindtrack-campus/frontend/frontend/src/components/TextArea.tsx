import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          {label}
        </label>
        <textarea
          ref={ref}
          className={`border rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors min-h-30 resize-y ${
            error 
              ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40' 
              : 'border-gray-300 dark:border-slate-700 focus:ring-blue-200 dark:focus:ring-blue-900/40 focus:border-blue-500'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';