import React, { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-700',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
