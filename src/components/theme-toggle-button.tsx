'use client'

import { useTheme } from '@/components/theme-provider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggleButton() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-brand-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
