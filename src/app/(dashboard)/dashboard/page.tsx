import { getProjects } from '@/actions/projects'
import { computeProjectFinance } from '@/lib/finance'
import { formatINRCompact } from '@/lib/currency'
import { getStatusColor, getLabelForValue, PROJECT_STATUSES } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { FolderOpen, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const projects = await getProjects()

  const projectSummaries = projects.map((p: any) => {
    const finance = computeProjectFinance(p)
    const pendingApprovalCount = p.expenseTransactions.filter((t: any) => t.approvalStatus === 'pending').length

    return {
      ...p,
      income: finance.income,
      spent: finance.totalCost,
      profit: finance.netProfit,
      pendingApprovalCount,
    }
  })

  const activeCount = projectSummaries.filter((p: any) => p.status === 'active').length

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
                        <span className="text-dark-500">Total Spent</span>
                        <span className="font-medium text-red-600 tabular-nums">
                          {formatINRCompact(p.spent)}
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
                            {Math.round((p.spent / p.budget) * 100)}% spent
                          </span>
                        )}
                        <span>{p._count.milestones} milestones</span>
                        {p.pendingApprovalCount > 0 && (
                          <span className="text-amber-600 font-medium">{p.pendingApprovalCount} pending</span>
                        )}
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
