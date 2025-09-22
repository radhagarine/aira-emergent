import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'cta'
  size?: 'default' | 'sm' | 'lg'
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default', 
  ...props 
}) => {
  const baseStyles = 'font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center'
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    cta: 'bg-[#8B0000] text-white hover:bg-[#8B0000]/90 transition-all duration-300 hover:scale-105 active:scale-98'
  }
  const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    cta: 'px-8 py-6 text-lg'
  }

  return (
    <button 
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[variant === 'cta' ? 'cta' : size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface ButtonVariantsProps {
  variant: 'default' | 'outline' | 'ghost' | 'cta'; // Define the possible variants
}

export const buttonVariants = ({ variant }: ButtonVariantsProps) => {
  switch (variant) {
    case 'default':
      return 'bg-blue-500 text-white'; // Example styles for default
    case 'outline':
      return 'border border-blue-500 text-blue-500'; // Example styles for outline
    case 'ghost':
      return 'text-blue-500 hover:bg-blue-100'; // Example styles for ghost
    case 'cta':
      return 'bg-red-500 text-white hover:bg-red-600'; // Example styles for cta
    default:
      return ''; // Fallback for unknown variants
  }
};

