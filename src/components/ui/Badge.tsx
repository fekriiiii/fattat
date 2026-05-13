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
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
        {
          'bg-primary/10 text-primary-700': variant === 'primary',
          'bg-gold/15 text-yellow-800': variant === 'gold',
          'bg-dark/10 text-dark': variant === 'dark',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-red-100 text-red-700': variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
