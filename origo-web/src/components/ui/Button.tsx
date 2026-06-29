import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function Button({ children, variant = 'primary', size = 'md', onClick, className = '', disabled }: ButtonProps) {
  const base = 'font-semibold rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-poppins';
  const variants = {
    primary: 'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/25',
    secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'bg-transparent text-text-secondary hover:text-white',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
