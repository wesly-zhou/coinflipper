'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, label, helperText, ...props }, ref) => {
    const baseStyles =
      'w-full bg-transparent text-white placeholder-slate-500 focus:outline-none transition-colors duration-200';

    const errorStyles = error
      ? 'text-red-400 border-red-400'
      : 'border-[#262626] focus:border-white';

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} border rounded-lg px-4 py-3 ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`mt-1 text-sm ${error ? 'text-red-400' : 'text-slate-400'}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
