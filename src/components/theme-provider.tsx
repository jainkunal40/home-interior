'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getPreferences, setPreference } from '@/actions/settings'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Apply saved localStorage value immediately (anti-flash, same as inline script)
    const local = localStorage.getItem('sitebooks-theme') as Theme | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initial = local ?? preferred
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')

    // Then sync from DB (source of truth across devices)
    getPreferences().then(prefs => {
      const dbTheme = prefs['theme'] as Theme | undefined
      if (dbTheme && dbTheme !== initial) {
        setTheme(dbTheme)
        localStorage.setItem('sitebooks-theme', dbTheme)
        document.documentElement.classList.toggle('dark', dbTheme === 'dark')
      }
    }).catch(() => {/* not authenticated or network error — ignore */})
  }, [])

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('sitebooks-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      // Persist to DB (fire and forget — UI is already updated)
      setPreference('theme', next).catch(() => {})
      return next
    })
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
