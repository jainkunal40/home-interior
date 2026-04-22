import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, KeyRound } from 'lucide-react'
import { signOutAction } from '@/actions/sign-out'
import { ThemeToggleButton } from '@/components/theme-toggle-button'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if ((session.user as any).role !== 'client') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-dark-50">
      <header className="sticky top-0 z-40 bg-dark-900 border-b border-dark-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <Link href="/portal" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Explore Interiors" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-white">Explore Interiors</span>
            <span className="text-xs text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full border border-brand-400/20">Client</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggleButton />
            <Link href="/portal/change-password" className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-brand-400 flex items-center gap-2 text-sm min-w-[44px] min-h-[44px] justify-center">
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">Password</span>
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-brand-400 flex items-center gap-2 text-sm min-w-[44px] min-h-[44px] justify-center">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
