import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/currency'

interface SummaryCardProps {
  label: string
  value: number | string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  compact?: boolean
  isText?: boolean
}

export function SummaryCard({ label, value, icon, trend, className, compact, isText }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'bg-dark-900 rounded-xl border border-dark-700 shadow-sm',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <div className="text-brand-400">{icon}</div>}
        <p className="text-xs font-medium text-dark-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn('mt-1 text-lg sm:text-xl font-bold tabular-nums',
        trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white'
      )}>
        {isText ? value : formatINR(value as number)}
      </p>
    </div>
  )
}
