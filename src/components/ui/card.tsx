import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dark-200 bg-white shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md hover:border-brand-300 transition-all',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-b border-dark-100', className)}>{children}</div>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-4 py-3 sm:px-6 sm:py-4', className)}>{children}</div>
}
