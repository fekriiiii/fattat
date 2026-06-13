import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

export function Card({ padded = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-card shadow-card border border-dark/[0.05]',
        padded && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
