import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'gold' | 'dark' | 'success' | 'error'
  className?: string
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset',
        {
          'bg-primary/[0.08] text-primary-700 ring-primary/15': variant === 'primary',
          'bg-gold/10 text-yellow-800 ring-gold/25': variant === 'gold',
          'bg-dark/[0.06] text-dark ring-dark/10': variant === 'dark',
          'bg-green-50 text-green-800 ring-green-600/15': variant === 'success',
          'bg-red-50 text-red-700 ring-red-600/15': variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
