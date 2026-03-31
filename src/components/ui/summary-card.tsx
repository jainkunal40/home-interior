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
  const color = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-900'

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <div className="text-gray-400">{icon}</div>}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn('mt-1 text-lg sm:text-xl font-bold tabular-nums', color)}>
        {isText ? value : formatINR(value as number)}
      </p>
    </div>
  )
}
