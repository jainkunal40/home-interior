'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Store,
} from 'lucide-react'
import { signOutAction } from '@/actions/sign-out'
import { useState, useCallback } from 'react'

interface DashboardShellProps {
  user: any
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects/new', label: 'New Project', icon: Plus },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/contractors', label: 'Contractors', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/projects/new', label: 'New', icon: Plus },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-dark-900 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            type="button"
            onClick={openSidebar}
            onTouchEnd={(e) => { e.preventDefault(); openSidebar() }}
            className="p-2 -ml-2 rounded-lg hover:bg-dark-800 active:bg-dark-700 min-w-[44px] min-h-[44px] flex items-center justify-center text-brand-400"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Explore Interiors" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-white">Explore Interiors</span>
          </Link>
          <div className="w-[44px]" />
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={closeSidebar}
            onTouchEnd={(e) => { e.preventDefault(); closeSidebar() }}
          />
          <nav className="fixed left-0 top-0 bottom-0 w-72 bg-dark-900 shadow-xl animate-slide-in">
            <SidebarContent pathname={pathname} user={user} onClose={closeSidebar} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col bg-dark-900 border-r border-dark-800">
        <SidebarContent pathname={pathname} user={user} />
      </nav>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900 border-t border-dark-800 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors min-w-[56px] min-h-[44px] justify-center',
                  isActive ? 'text-brand-400' : 'text-dark-400 active:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="h-16 lg:hidden" />
    </div>
  )
}

function SidebarContent({ pathname, user, onClose }: { pathname: string; user: any; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-16 border-b border-dark-800">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <Image src="/logo.jpg" alt="Explore Interiors" width={36} height={36} className="rounded-xl" />
          <span className="text-lg font-bold text-white">Explore Interiors</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            onTouchEnd={(e) => { e.preventDefault(); onClose() }}
            className="p-2 rounded-lg hover:bg-dark-800 active:bg-dark-700 lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-dark-400"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/projects/new' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                    isActive ? 'bg-brand-400/10 text-brand-400 border border-brand-400/20' : 'text-dark-400 hover:bg-dark-800 hover:text-white active:bg-dark-700'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="p-3 border-t border-dark-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-400/20 text-brand-400 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 truncate">{user?.email}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-brand-400 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
