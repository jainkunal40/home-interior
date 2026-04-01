import { getProjects } from '@/actions/projects'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { formatINR, formatINRCompact } from '@/lib/currency'
import { getStatusColor, getLabelForValue, PROJECT_STATUSES } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SummaryCard } from '@/components/ui/summary-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  IndianRupee,
  FolderOpen,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await requireAuth()
  const projects = await getProjects()

  // Fetch pending labor payments
  const pendingLabor = await prisma.laborEntry.findMany({
    where: {
      project: { userId: session.user.id },
      status: { in: ['ongoing', 'pending_payment'] },
    },
    include: { contractor: true, project: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Fetch upcoming milestones (due within 7 days)
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingMilestones = await prisma.milestone.findMany({
    where: {
      project: { userId: session.user.id },
      status: { in: ['pending', 'in_progress'] },
      dueDate: { lte: weekLater },
    },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Compute dashboard summary
  let totalIncome = 0
  let totalExpenses = 0
  let totalLabor = 0
  let activeCount = 0

  const projectSummaries = projects.map((p: any) => {
    const income = p.incomeTransactions.reduce((s: number, t: any) => s + t.amount, 0)
    const expenses = p.expenseTransactions
      .filter((t: any) => !t.paidByClient)
      .reduce((s: number, t: any) => s + t.amount + t.taxAmount, 0)
    const clientPaid = p.expenseTransactions
      .filter((t: any) => t.paidByClient)
      .reduce((s: number, t: any) => s + t.amount + t.taxAmount, 0)
    const labor = p.laborEntries
      .filter((t: any) => !t.paidByClient)
      .reduce((s: number, t: any) => s + t.totalAmount, 0)
    const clientPaidLabor = p.laborEntries
      .filter((t: any) => t.paidByClient)
      .reduce((s: number, t: any) => s + t.totalAmount, 0)
    const profit = income - expenses - labor

    totalIncome += income
    totalExpenses += expenses
    totalLabor += labor
    if (p.status === 'active') activeCount++

    return { ...p, income, expenses, labor, profit, clientPaid }
  })

  const totalProfit = totalIncome - totalExpenses - totalLabor
  const overBudgetProjects = projectSummaries.filter((p: any) => p.budget > 0 && (p.expenses + p.labor) > p.budget)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-900">Dashboard</h1>
          <p className="text-sm text-dark-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeCount} active
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Income"
          value={totalIncome}
          icon={<IndianRupee className="w-4 h-4" />}
          trend="up"
        />
        <SummaryCard
          label="Total Expenses"
          value={totalExpenses}
          icon={<Wallet className="w-4 h-4" />}
          trend="down"
        />
        <SummaryCard
          label="Labor Cost"
          value={totalLabor}
          icon={<TrendingDown className="w-4 h-4" />}
          trend="down"
        />
        <SummaryCard
          label="Net Profit"
          value={totalProfit}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={totalProfit >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Budget Alerts & Pending Payments */}
      {(overBudgetProjects.length > 0 || pendingLabor.length > 0 || upcomingMilestones.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overBudgetProjects.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-700">Over Budget</h3>
                </div>
                <div className="space-y-1.5">
                  {overBudgetProjects.map((p: any) => {
                    const spent = p.expenses + p.labor
                    const overBy = spent - p.budget
                    return (
                      <Link key={p.id} href={`/projects/${p.id}`} className="flex justify-between items-center text-sm hover:bg-red-100/50 rounded px-1 -mx-1">
                        <span className="text-gray-700 truncate">{p.name}</span>
                        <span className="text-red-600 font-medium shrink-0 ml-2">+{formatINRCompact(overBy)}</span>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {pendingLabor.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-orange-700">Pending Payments</h3>
                </div>
                <div className="space-y-1.5">
                  {pendingLabor.map((l) => {
                    const due = l.totalAmount - l.advancePaid
                    return (
                      <Link key={l.id} href={`/projects/${l.project.id}`} className="flex justify-between items-center text-sm hover:bg-orange-100/50 rounded px-1 -mx-1">
                        <span className="text-gray-700 truncate">{l.contractor?.name || 'Unnamed'}</span>
                        <span className="text-orange-600 font-medium shrink-0 ml-2">{formatINRCompact(due)}</span>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {upcomingMilestones.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-blue-700">Due This Week</h3>
                </div>
                <div className="space-y-1.5">
                  {upcomingMilestones.map((m) => (
                    <Link key={m.id} href={`/projects/${m.project.id}`} className="flex justify-between items-center text-sm hover:bg-blue-100/50 rounded px-1 -mx-1">
                      <span className="text-gray-700 truncate">{m.title}</span>
                      <span className="text-blue-600 text-xs shrink-0 ml-2">{m.project.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Project List */}
      {projectSummaries.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-16 h-16" />}
          title="No projects yet"
          description="Create your first project to start tracking income, expenses, and profitability."
          action={
            <Link href="/projects/new">
              <Button>
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider">Your Projects</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projectSummaries.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:shadow-md transition-all hover:border-brand-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-dark-900 truncate">{p.name}</h3>
                        {p.client && (
                          <p className="text-sm text-dark-500 truncate">{p.client.name}</p>
                        )}
                        {p.siteAddress && (
                          <p className="text-xs text-dark-400 truncate mt-0.5">{p.siteAddress}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(p.status)}>
                        {getLabelForValue(PROJECT_STATUSES, p.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-500">Budget</span>
                        <span className="font-medium tabular-nums">{formatINRCompact(p.budget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Income</span>
                        <span className="font-medium text-green-600 tabular-nums">
                          {formatINRCompact(p.income)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Expenses</span>
                        <span className="font-medium text-red-600 tabular-nums">
                          {formatINRCompact(p.expenses)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Profit</span>
                        <span
                          className={`font-semibold tabular-nums ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {formatINRCompact(p.profit)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dark-100 flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-dark-400">
                        {p.budget > 0 && (
                          <span>
                            {Math.round(((p.expenses + p.labor) / p.budget) * 100)}% spent
                          </span>
                        )}
                        <span>{p._count.milestones} milestones</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-brand-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
