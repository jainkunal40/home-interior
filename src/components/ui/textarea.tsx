import * as React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || props.name
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-dark-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-dark-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400/20 disabled:cursor-not-allowed disabled:bg-dark-50',
            error && 'border-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
export { Textarea }
