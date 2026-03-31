import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { signOutAction } from '@/actions/sign-out'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if ((session.user as any).role !== 'client') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-bold">S</div>
            <span className="font-bold text-gray-900">SiteBooks</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Client</span>
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
