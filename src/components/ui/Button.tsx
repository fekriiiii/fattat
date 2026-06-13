'use client'

import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, loading = false, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-btn transition-all duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
        'active:scale-[0.97]',
        {
          'bg-gradient-to-b from-[#11857C] to-primary text-cream shadow-btn hover:from-primary-600 hover:to-primary-700 active:shadow-btn-pressed': variant === 'primary',
          'bg-gradient-to-b from-[#27344A] to-dark text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_-6px_rgba(31,41,55,0.45)] hover:to-dark/90': variant === 'secondary',
          'bg-transparent text-dark hover:bg-dark/[0.06]': variant === 'ghost',
          'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_6px_16px_-6px_rgba(220,38,38,0.45)] hover:to-red-700': variant === 'danger',
          'text-sm px-4 py-2.5': size === 'sm',
          'text-base px-6 py-3.5': size === 'md',
          'text-[17px] px-6 py-[18px] tracking-[-0.01em]': size === 'lg',
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Laddar…
        </span>
      ) : children}
    </button>
  )
})
