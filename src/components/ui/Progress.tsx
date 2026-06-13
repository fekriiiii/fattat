import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number // 0-100
  className?: string
  color?: 'primary' | 'gold'
}

export function Progress({ value, className, color = 'primary' }: ProgressProps) {
  return (
    <div className={cn('h-2 bg-dark/[0.05] rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          color === 'primary'
            ? 'bg-gradient-to-r from-primary-600 to-primary'
            : 'bg-gradient-to-r from-[#E2B433] to-gold'
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
