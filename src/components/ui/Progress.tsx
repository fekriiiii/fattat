import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number // 0-100
  className?: string
  color?: 'primary' | 'gold'
}

export function Progress({ value, className, color = 'primary' }: ProgressProps) {
  return (
    <div className={cn('h-[5px] bg-dark/[0.06] rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          color === 'primary' ? 'bg-primary' : 'bg-gold'
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
