import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-text-secondary font-medium">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</div>
        )}
        <input
          ref={ref}
          className={`w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
export default Input;
