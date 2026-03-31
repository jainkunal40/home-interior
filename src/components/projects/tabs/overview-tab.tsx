'use client'

import { useState, useEffect, useActionState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatINR } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'
import { getLabelForValue, EXPENSE_CATEGORIES, MILESTONE_STATUSES, PROJECT_STATUSES } from '@/lib/utils'
import { format } from 'date-fns'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateProject, deleteProject } from '@/actions/projects'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

interface OverviewTabProps {
  project: any
  totalIncome: number
  totalExpenses: number
  totalLabor: number
  netProfit: number
}

export function OverviewTab({ project, totalIncome, totalExpenses, totalLabor, netProfit }: OverviewTabProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const budgetUsed = totalExpenses + totalLabor
  const budgetPercent = project.budget > 0 ? Math.round((budgetUsed / project.budget) * 100) : 0
  const isOverBudget = budgetUsed > project.budget && project.budget > 0
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  for (const exp of project.expenseTransactions) {
    const cat = exp.category || 'misc'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount + (exp.taxAmount || 0)
  }
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])

  // Pending labor
  const pendingLabor = project.laborEntries.filter((l: any) => l.status === 'pending_payment' || l.status === 'ongoing')
  const pendingAmount = pendingLabor.reduce((s: number, l: any) => s + (l.totalAmount - l.advancePaid), 0)

  return (
    <div className="space-y-4">
      {/* Budget Progress */}
      {project.budget > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Budget vs Actual</h3>
              <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {budgetPercent}% used
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : budgetPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Spent: {formatINR(budgetUsed)}</span>
              <span>Budget: {formatINR(project.budget)}</span>
            </div>
            {isOverBudget && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Over budget by {formatINR(budgetUsed - project.budget)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Summary</h3>
          <div className="space-y-2">
            <SummaryRow label="Total Income" value={totalIncome} color="text-green-600" />
            <SummaryRow label="Total Expenses" value={-totalExpenses} color="text-red-600" />
            <SummaryRow label="Labor Cost" value={-totalLabor} color="text-red-600" />
            <div className="border-t border-gray-100 pt-2 mt-2">
              <SummaryRow
                label="Net Profit"
                value={netProfit}
                color={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
                bold
              />
            </div>
            <div className="text-xs text-gray-500">
              Profit margin: <span className="font-medium">{profitMargin}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Breakdown</h3>
            <div className="space-y-2">
              {sortedCategories.map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {getLabelForValue(EXPENSE_CATEGORIES, cat)}
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatINR(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingAmount > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending Labor Payments</h3>
            <p className="text-lg font-bold text-orange-600">{formatINR(pendingAmount)}</p>
            <p className="text-xs text-gray-500">
              {pendingLabor.length} contractor{pendingLabor.length > 1 ? 's' : ''} with pending payments
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent milestones */}
      {project.milestones.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Milestones</h3>
            <div className="space-y-2">
              {project.milestones.slice(0, 5).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{m.title}</span>
                  <Badge className={MILESTONE_STATUSES.find(s => s.value === m.status)?.color}>
                    {getLabelForValue(MILESTONE_STATUSES, m.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Project Info</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 min-h-[44px] px-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 min-h-[44px] px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {project.client && (
              <>
                <InfoRow label="Client" value={project.client.name} />
                {project.client.phone && <InfoRow label="Phone" value={project.client.phone} />}
                {project.client.email && <InfoRow label="Email" value={project.client.email} />}
              </>
            )}
            {project.siteAddress && <InfoRow label="Location" value={project.siteAddress} />}
            {project.startDate && (
              <InfoRow label="Start" value={format(new Date(project.startDate), 'dd MMM yyyy')} />
            )}
            {project.endDate && (
              <InfoRow label="End" value={format(new Date(project.endDate), 'dd MMM yyyy')} />
            )}
            {project.description && <InfoRow label="Description" value={project.description} />}
          </div>
        </CardContent>
      </Card>

      {/* Edit Project Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <EditProjectForm project={project} onClose={() => setShowEdit(false)} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Project">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{project.name}</span>? This will permanently remove all income, expenses, labor entries, milestones, attachments, and notes associated with this project.
          </p>
          <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true)
                await deleteProject(project.id)
                router.push('/dashboard')
              }}
              className="flex-1 bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function EditProjectForm({ project, onClose }: { project: any; onClose: () => void }) {
  const boundUpdate = updateProject.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(boundUpdate, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

      <Input label="Project Name" name="name" required defaultValue={project.name} />
      <Select
        label="Status"
        name="status"
        options={PROJECT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
        defaultValue={project.status}
      />
      <Input label="Budget (₹)" name="budget" type="number" defaultValue={project.budget || ''} />
      <Input label="Site Address" name="siteAddress" defaultValue={project.siteAddress || ''} />
      <Textarea label="Description" name="description" defaultValue={project.description || ''} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" name="startDate" type="date" defaultValue={project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : ''} />
        <Input label="End Date" name="endDate" type="date" defaultValue={project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : ''} />
      </div>

      <div className="border-t border-gray-100 pt-3 mt-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">CLIENT DETAILS</p>
        <Input label="Client Name" name="clientName" defaultValue={project.client?.name || ''} />
        <Input label="Client Phone" name="clientPhone" defaultValue={project.client?.phone || ''} />
        <Input label="Client Email" name="clientEmail" type="email" defaultValue={project.client?.email || ''} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}

function SummaryRow({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold text-base' : 'font-medium'} ${color}`}>
        {formatINR(Math.abs(value))}
      </span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  )
}
