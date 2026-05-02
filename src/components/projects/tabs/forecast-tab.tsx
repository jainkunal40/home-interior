'use client'

import { useEffect, useActionState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatINR } from '@/lib/currency'
import { updateBudgetCategories } from '@/actions/projects'

const BUDGET_CATEGORIES = [
  { key: 'materials', label: 'Materials' },
  { key: 'labor', label: 'Labor' },
  { key: 'furnishing', label: 'Furniture' },
  { key: 'transport', label: 'Transport' },
  { key: 'site_expense', label: 'Site Expense' },
] as const

export function ForecastTab({ project }: { project: any }) {
  const approved = (project.expenseTransactions ?? []).filter((t: any) => t.approvalStatus !== 'pending' && t.approvalStatus !== 'rejected')
  const normalExpenses = approved
    .filter((t: any) => !t.laborEntryId)
    .reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)
  const materialBills = (project.materialEntries ?? []).reduce((s: number, e: any) => s + e.billAmount, 0)
  const materialPaid = (project.materialEntries ?? []).reduce((s: number, e: any) => s + (e.payments ?? []).reduce((ps: number, p: any) => ps + p.amount, 0), 0)
  const materialDue = Math.max(0, materialBills - materialPaid)
  const laborTotal = (project.laborEntries ?? []).reduce((s: number, l: any) => s + l.totalAmount, 0)
  const laborPaid = (project.laborEntries ?? []).reduce((s: number, l: any) => s + l.advancePaid, 0)
  const laborDue = Math.max(0, laborTotal - laborPaid)
  const currentSpend = normalExpenses + materialPaid + laborPaid
  const projectedFinal = normalExpenses + materialBills + laborTotal
  const variance = projectedFinal - (project.budget || 0)
  const pendingMilestones = (project.milestones ?? []).filter((m: any) => m.status !== 'completed')

  const categoryActuals: Record<string, number> = {
    materials: 0,
    labor: laborTotal,
    furnishing: 0,
    transport: 0,
    site_expense: 0,
  }
  for (const t of approved) {
    if (t.laborEntryId) continue
    if (categoryActuals[t.category] !== undefined) categoryActuals[t.category] += t.amount + (t.taxAmount || 0)
  }
  for (const e of (project.materialEntries ?? [])) {
    const key = e.category === 'furnishing' ? 'furnishing' : 'materials'
    categoryActuals[key] = (categoryActuals[key] || 0) + e.billAmount
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Cost Forecast</h3>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Current Spend" value={currentSpend} />
            <Metric label="Likely Final Cost" value={projectedFinal} danger={variance > 0} />
            <Metric label="Unpaid Materials" value={materialDue} />
            <Metric label="Labor Dues" value={laborDue} />
          </div>
          {project.budget > 0 && (
            <div className={`mt-3 rounded-lg p-3 text-sm ${variance > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              You are likely to finish at <span className="font-bold">{formatINR(projectedFinal)}</span>, {variance > 0 ? 'over' : 'under'} budget by <span className="font-bold">{formatINR(Math.abs(variance))}</span>.
            </div>
          )}
          {pendingMilestones.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">{pendingMilestones.length} pending milestone{pendingMilestones.length !== 1 ? 's' : ''} may still affect scope.</p>
          )}
        </CardContent>
      </Card>

      <BudgetCategoryEditor project={project} categoryActuals={categoryActuals} />
    </div>
  )
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold tabular-nums ${danger ? 'text-red-600' : 'text-gray-900'}`}>{formatINR(value)}</p>
    </div>
  )
}

function BudgetCategoryEditor({ project, categoryActuals }: { project: any; categoryActuals: Record<string, number> }) {
  const action = updateBudgetCategories.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)
  const budgets = (project.budgetCategories ?? {}) as Record<string, number>

  useEffect(() => {}, [state?.success])

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Budget Categories</h3>
        <form action={formAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_CATEGORIES.map(cat => {
              const limit = Number(budgets[cat.key] || 0)
              const actual = categoryActuals[cat.key] || 0
              const over = limit > 0 && actual > limit
              return (
                <div key={cat.key} className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <Input name={cat.key} label={cat.label} type="number" prefix="₹" defaultValue={limit || ''} placeholder="0" />
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Actual: {formatINR(actual)}</span>
                    {limit > 0 && <span className={over ? 'text-red-600' : 'text-green-600'}>{over ? 'Over' : 'Under'} by {formatINR(Math.abs(limit - actual))}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">Budget categories saved.</p>}
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Category Budgets'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
