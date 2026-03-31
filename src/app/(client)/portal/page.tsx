import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatINR } from '@/lib/currency'
import { getStatusColor, getLabelForValue, PROJECT_STATUSES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { EmptyState } from '@/components/ui/empty-state'
import { FolderOpen, IndianRupee, Wallet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function ClientPortalPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Find client record linked to this user
  const client = await prisma.client.findFirst({
    where: { userId: session.user.id },
  })

  if (!client) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">My Projects</h1>
        <EmptyState
          icon={<FolderOpen className="w-16 h-16" />}
          title="No projects found"
          description="Your account is not linked to any projects yet. Please contact your designer."
        />
      </div>
    )
  }

  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    include: {
      incomeTransactions: { select: { amount: true } },
      expenseTransactions: { select: { amount: true, taxAmount: true } },
      laborEntries: { select: { totalAmount: true } },
      milestones: { select: { status: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  let totalPaid = 0
  let totalBudget = 0

  const summaries = projects.map((p) => {
    const income = p.incomeTransactions.reduce((s, t) => s + t.amount, 0)
    const expenses = p.expenseTransactions.reduce((s, t) => s + t.amount + t.taxAmount, 0)
    const labor = p.laborEntries.reduce((s, t) => s + t.totalAmount, 0)
    const totalCost = expenses + labor
    const completedMilestones = p.milestones.filter(m => m.status === 'completed').length

    totalPaid += income
    totalBudget += p.budget

    return { ...p, income, totalCost, completedMilestones, totalMilestones: p.milestones.length }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome, {client.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your project overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Total Paid" value={totalPaid} trend="up" icon={<IndianRupee className="w-4 h-4" />} />
        <SummaryCard label="Total Budget" value={totalBudget} icon={<Wallet className="w-4 h-4" />} />
      </div>

      <div className="space-y-3">
        {summaries.map((p) => (
          <Link key={p.id} href={`/portal/${p.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <Badge className={getStatusColor(p.status)}>
                        {getLabelForValue(PROJECT_STATUSES, p.status)}
                      </Badge>
                    </div>
                    {p.siteAddress && <p className="text-xs text-gray-500 mt-0.5">{p.siteAddress}</p>}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-green-600">Paid: {formatINR(p.income)}</span>
                      {p.budget > 0 && <span className="text-gray-500">Budget: {formatINR(p.budget)}</span>}
                    </div>
                    {p.totalMilestones > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {p.completedMilestones}/{p.totalMilestones} milestones completed
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
