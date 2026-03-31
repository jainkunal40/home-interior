import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  return session as typeof session & { user: { id: string; name: string; email: string; role?: string } }
}
