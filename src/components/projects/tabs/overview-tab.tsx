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
import { resetClientPassword } from '@/actions/settings'
import { assignVendorToProject, removeVendorFromProject } from '@/actions/vendors'
import { assignContractorToProject, removeContractorFromProject } from '@/actions/contractors'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye, EyeOff, Copy, Check, Plus, X, Store, Users, MessageCircle, Smartphone, RotateCcw } from 'lucide-react'

function shareViaWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function shareViaSMS(text: string) {
  window.open(`sms:?body=${encodeURIComponent(text)}`, '_self')
}

interface OverviewTabProps {
  project: any
  totalIncome: number
  totalExpenses: number
  totalLabor: number
  netProfit: number
  clientPaidTotal?: number
  allVendors?: any[]
  allContractors?: any[]
}

export function OverviewTab({ project, totalIncome, totalExpenses, totalLabor, netProfit, clientPaidTotal = 0, allVendors = [], allContractors = [] }: OverviewTabProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const budgetUsed = totalExpenses + totalLabor
  const budgetPercent = project.budget > 0 ? Math.round((budgetUsed / project.budget) * 100) : 0
  const isOverBudget = budgetUsed > project.budget && project.budget > 0
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0

  // Category breakdown (exclude labor-linked to avoid double-counting with labor entries)
  const categoryBreakdown: Record<string, number> = {}
  for (const exp of project.expenseTransactions) {
    if (exp.laborEntryId) continue
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
            {clientPaidTotal > 0 && (
              <SummaryRow label="Client Paid (excluded from P&L)" value={clientPaidTotal} color="text-purple-600" />
            )}
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

      {/* Assigned Vendors */}
      <AssignedVendorsCard project={project} allVendors={allVendors} />

      {/* Assigned Contractors */}
      <AssignedContractorsCard project={project} allContractors={allContractors} />

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
                {project.client.portalPassword && project.client.email && (
                  <PortalCredentials email={project.client.email} password={project.client.portalPassword} clientId={project.client.id} />
                )}
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
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state?.success && !state.clientPassword) onClose()
  }, [state?.success, state?.clientPassword, onClose])

  function copyCredentials() {
    if (!state?.clientEmail || !state?.clientPassword) return
    const text = `Login Email: ${state.clientEmail}\nPassword: ${state.clientPassword}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Show credentials screen after save if a new client login was created
  if (state?.success && state?.clientPassword) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-1">Project updated!</p>
          <p className="text-sm text-green-700">
            A portal login has been created for the client. Share these credentials so they can access their project.
          </p>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Login Email</span>
            <span className="text-sm font-medium text-gray-900">{state.clientEmail}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Password</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono text-gray-900">
                {showPassword ? state.clientPassword : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-gray-400 hover:text-brand-600 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyCredentials}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => shareViaWhatsApp(`Your Explore Interiors portal login:\nEmail: ${state.clientEmail}\nPassword: ${state.clientPassword}`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-green-200 rounded-xl hover:bg-green-50 text-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => shareViaSMS(`Your Explore Interiors portal login:\nEmail: ${state.clientEmail}\nPassword: ${state.clientPassword}`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-blue-200 rounded-xl hover:bg-blue-50 text-blue-700 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3">
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </div>
    )
  }

  // Check if client exists but has no portal login
  const clientNeedsLogin = project.client && project.client.email && !project.client.userId

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
        {clientNeedsLogin && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ This client has no portal login yet. Save to auto-create one — you&apos;ll see the credentials after saving.
          </p>
        )}
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

function PortalCredentials({ email, password, clientId }: { email: string; password: string; clientId: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resetState, resetAction, resetPending] = useActionState(resetClientPassword, null)
  const displayPassword = resetState?.success ? resetState.newPassword : password

  function copyCredentials() {
    const text = `Login Email: ${email}\nPassword: ${displayPassword}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
      <p className="text-xs font-semibold text-brand-700 mb-2">Client Portal Credentials</p>
      {resetState?.success && (
        <div className="p-2 rounded-lg bg-green-50 text-green-700 text-xs mb-2">Password reset successfully</div>
      )}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Login Email</span>
          <span className="text-gray-900 font-medium">{email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Password</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-900 font-mono text-sm">
              {showPassword ? displayPassword : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-400 hover:text-brand-600 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 -ml-2 flex-wrap">
        <button
          type="button"
          onClick={copyCredentials}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium min-h-[32px] px-2 rounded-lg hover:bg-brand-100"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={() => shareViaWhatsApp(`Your Explore Interiors portal login:\nEmail: ${email}\nPassword: ${displayPassword}`)}
          className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium min-h-[32px] px-2 rounded-lg hover:bg-green-50"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => shareViaSMS(`Your Explore Interiors portal login:\nEmail: ${email}\nPassword: ${displayPassword}`)}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium min-h-[32px] px-2 rounded-lg hover:bg-blue-50"
        >
          <Smartphone className="w-3.5 h-3.5" />
          SMS
        </button>
        <form action={resetAction}>
          <input type="hidden" name="clientId" value={clientId} />
          <button
            type="submit"
            disabled={resetPending}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium min-h-[32px] px-2 rounded-lg hover:bg-red-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetPending ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AssignedVendorsCard({ project, allVendors }: { project: any; allVendors: any[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const assignedIds = new Set((project.projectVendors || []).map((pv: any) => pv.vendor.id))
  const available = allVendors.filter(v => !assignedIds.has(v.id))

  async function handleAssign(vendorId: string) {
    await assignVendorToProject(vendorId, project.id)
    setShowAdd(false)
  }

  async function handleRemove(vendorId: string) {
    await removeVendorFromProject(vendorId, project.id)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Assigned Vendors</h3>
          </div>
          {available.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 min-h-[36px] px-2 rounded-lg hover:bg-brand-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign
            </button>
          )}
        </div>

        {(project.projectVendors || []).length === 0 && !showAdd && (
          <p className="text-sm text-gray-400">No vendors assigned to this project yet.</p>
        )}

        {(project.projectVendors || []).length > 0 && (
          <div className="space-y-2">
            {project.projectVendors.map((pv: any) => (
              <div key={pv.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{pv.vendor.name}</p>
                  {pv.vendor.category && (
                    <p className="text-xs text-gray-500 capitalize">{pv.vendor.category}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(pv.vendor.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div className="mt-2 p-2 border border-brand-200 rounded-lg bg-brand-50/50">
            <p className="text-xs font-medium text-gray-600 mb-2">Select vendor to assign:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {available.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleAssign(v.id)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-brand-100 transition-colors min-h-[40px]"
                >
                  <span className="font-medium text-gray-900">{v.name}</span>
                  {v.category && <span className="text-xs text-gray-500 ml-2 capitalize">{v.category}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssignedContractorsCard({ project, allContractors }: { project: any; allContractors: any[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const assignedIds = new Set((project.projectContractors || []).map((pc: any) => pc.contractor.id))
  const available = allContractors.filter(c => !assignedIds.has(c.id))

  async function handleAssign(contractorId: string) {
    await assignContractorToProject(contractorId, project.id)
    setShowAdd(false)
  }

  async function handleRemove(contractorId: string) {
    await removeContractorFromProject(contractorId, project.id)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Assigned Contractors</h3>
          </div>
          {available.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 min-h-[36px] px-2 rounded-lg hover:bg-brand-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign
            </button>
          )}
        </div>

        {(project.projectContractors || []).length === 0 && !showAdd && (
          <p className="text-sm text-gray-400">No contractors assigned to this project yet.</p>
        )}

        {(project.projectContractors || []).length > 0 && (
          <div className="space-y-2">
            {project.projectContractors.map((pc: any) => (
              <div key={pc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{pc.contractor.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{pc.contractor.trade}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(pc.contractor.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div className="mt-2 p-2 border border-brand-200 rounded-lg bg-brand-50/50">
            <p className="text-xs font-medium text-gray-600 mb-2">Select contractor to assign:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {available.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAssign(c.id)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-brand-100 transition-colors min-h-[40px]"
                >
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-500 ml-2 capitalize">{c.trade}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
