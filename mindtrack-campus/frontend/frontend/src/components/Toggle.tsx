import React, { forwardRef } from 'react';

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-start gap-4 cursor-pointer group ${className}`}>
        <div className="relative flex items-center h-6">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          {/* Toggle Background */}
          <div className="w-11 h-6 bg-gray-300 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 transition-colors"></div>
          {/* Toggle Dot */}
          <div className="absolute left-0.5 top-0.5 bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform peer-checked:translate-x-full peer-checked:border-white"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          {description && (
            <span className="text-sm text-gray-500 mt-1">{description}</span>
          )}
        </div>
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';