import { requireAuth } from '@/lib/session'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  return <DashboardShell user={session.user}>{children}</DashboardShell>
}
