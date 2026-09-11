import React, { forwardRef } from 'react';

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="radio"
          ref={ref}
          className={`w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 ${className}`}
          {...props}
        />
        <span className="text-sm text-gray-700 group-hover:text-gray-900">
          {label}
        </span>
      </label>
    );
  }
);

RadioButton.displayName = 'RadioButton';