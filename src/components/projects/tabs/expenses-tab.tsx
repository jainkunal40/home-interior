'use client'

import { useState, useEffect, useActionState } from 'react'
import { createExpense, updateExpense, deleteExpense } from '@/actions/expenses'
import { formatINR } from '@/lib/currency'
import { getLabelForValue, EXPENSE_CATEGORIES, PAYMENT_MODES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Wallet, Trash2, Edit2, Link2 } from 'lucide-react'
import { format } from 'date-fns'

export function ExpensesTab({ project }: { project: any }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const expenses = filterCategory === 'all'
    ? project.expenseTransactions
    : project.expenseTransactions.filter((e: any) => e.category === filterCategory)

  const total = project.expenseTransactions.reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)
  const filteredTotal = expenses.reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  for (const exp of project.expenseTransactions) {
    const cat = exp.category || 'misc'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount + (exp.taxAmount || 0)
  }
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Expenses</h3>
          <p className="text-lg font-bold text-red-600">{formatINR(total)}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {sortedCategories.map(([cat, amount]) => {
                const percent = total > 0 ? Math.round((amount / total) * 100) : 0
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[36px] ${
                      filterCategory === cat
                        ? 'bg-brand-50 border-brand-200 text-brand-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {getLabelForValue(EXPENSE_CATEGORIES, cat)} · {percent}%
                  </button>
                )
              })}
              {filterCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 min-h-[36px]"
                >
                  Clear filter
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {filterCategory !== 'all' && (
        <p className="text-sm text-gray-500">
          Showing {getLabelForValue(EXPENSE_CATEGORIES, filterCategory)}: {formatINR(filteredTotal)}
        </p>
      )}

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-12 h-12" />}
          title={filterCategory !== 'all' ? 'No expenses in this category' : 'No expenses recorded'}
          description={filterCategory !== 'all' ? 'Try a different category or add a new expense.' : 'Start tracking material costs, vendor bills, and other expenses.'}
          action={<Button size="sm" onClick={openAdd}>Add First Expense</Button>}
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1" onClick={() => openEdit(t)} role="button" tabIndex={0}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-red-600 tabular-nums">
                        {formatINR(t.amount)}
                      </span>
                      {t.taxAmount > 0 && (
                        <span className="text-xs text-gray-400">
                          +{formatINR(t.taxAmount)} tax
                        </span>
                      )}
                      <Badge className="bg-red-50 text-red-700">
                        {getLabelForValue(EXPENSE_CATEGORIES, t.category)}
                      </Badge>
                      {t.isReimbursable && (
                        <Badge className="bg-yellow-50 text-yellow-700">Reimbursable</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>{format(new Date(t.date), 'dd MMM yyyy')}</span>
                      <span>·</span>
                      <span>{getLabelForValue(PAYMENT_MODES, t.paymentMode)}</span>
                      {(t.vendor?.name || t.vendorName) && (
                        <>
                          <span>·</span>
                          <span>{t.vendor?.name || t.vendorName}</span>
                        </>
                      )}
                    </div>
                    {t.laborEntry && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <Link2 className="w-3 h-3" />
                        <span>Linked to: {t.laborEntry.contractor?.name || 'Labor entry'}</span>
                      </div>
                    )}
                    {t.billNumber && (
                      <p className="text-xs text-gray-400 mt-0.5">Bill: {t.billNumber}</p>
                    )}
                    {t.notes && <p className="text-xs text-gray-400 mt-0.5">{t.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <form action={async () => { if (confirm('Delete this expense?')) await deleteExpense(t.id, project.id) }}>
                      <button type="submit" className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm project={project} editItem={editItem} onClose={closeForm} />
      </Modal>
    </div>
  )
}

function ExpenseForm({ project, editItem, onClose }: { project: any; editItem: any; onClose: () => void }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateExpense.bind(null, editItem.id, project.id)
    : createExpense.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)
  const [selectedCategory, setSelectedCategory] = useState(editItem?.category || 'materials')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  // Collect unique vendors from all project expenses
  const vendorMap = new Map<string, { id: string; name: string }>()
  for (const exp of project.expenseTransactions) {
    if (exp.vendor?.id) vendorMap.set(exp.vendor.id, exp.vendor)
  }
  const vendors = Array.from(vendorMap.values())

  // Labor entries for linking payments
  const laborEntries = project.laborEntries || []

  const showLaborLink = selectedCategory === 'labor' || selectedCategory === 'subcontractor'

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input name="date" label="Date *" type="date" defaultValue={editItem ? new Date(editItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
      <Input name="amount" label="Amount (₹) *" type="number" prefix="₹" placeholder="25000" defaultValue={editItem?.amount || ''} required />
      <Select
        name="category"
        label="Category *"
        options={[...EXPENSE_CATEGORIES]}
        defaultValue={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      />

      {/* Vendor selection */}
      {vendors.length > 0 ? (
        <Select
          name="vendorId"
          label="Vendor"
          options={[{ value: '', label: 'Select vendor or type below' }, ...vendors.map(v => ({ value: v.id, label: v.name }))]}
          defaultValue={editItem?.vendorId || ''}
        />
      ) : null}
      <Input name="vendorName" label={vendors.length > 0 ? 'Or enter vendor name' : 'Vendor Name'} placeholder="e.g., Shree Timber Works" defaultValue={editItem?.vendorName || ''} />

      {/* Labor entry link for contractor/labor payments */}
      {showLaborLink && laborEntries.length > 0 && (
        <Select
          name="laborEntryId"
          label="Link to Labor / Contractor"
          options={[
            { value: '', label: 'Not linked' },
            ...laborEntries.map((l: any) => {
              const name = l.contractor?.name || 'Unknown'
              const remaining = l.totalAmount - l.advancePaid
              return {
                value: l.id,
                label: `${name} — Due: ${formatINR(remaining)}`,
              }
            }),
          ]}
          defaultValue={editItem?.laborEntryId || ''}
        />
      )}
      {!showLaborLink && editItem?.laborEntryId && (
        <input type="hidden" name="laborEntryId" value="" />
      )}

      <Select name="paymentMode" label="Payment Mode *" options={[...PAYMENT_MODES]} defaultValue={editItem?.paymentMode || 'upi'} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="taxAmount" label="Tax/GST (₹)" type="number" prefix="₹" placeholder="0" defaultValue={editItem?.taxAmount || 0} />
        <Input name="gstPercent" label="GST %" type="number" placeholder="18" defaultValue={editItem?.gstPercent || ''} />
      </div>
      <Input name="billNumber" label="Bill / Invoice No." placeholder="INV-001" defaultValue={editItem?.billNumber || ''} />
      {project.phases?.length > 0 && (
        <Select
          name="phaseId"
          label="Project Phase"
          options={[{ value: '', label: 'Not linked' }, ...project.phases.map((p: any) => ({ value: p.id, label: p.name }))]}
          defaultValue={editItem?.phaseId || ''}
        />
      )}
      <Textarea name="notes" label="Notes" placeholder="Optional notes..." defaultValue={editItem?.notes || ''} />
      <div className="flex items-center gap-2 py-1">
        <input type="checkbox" name="isReimbursable" value="true" id="isReimbursable" defaultChecked={editItem?.isReimbursable || false} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
        <label htmlFor="isReimbursable" className="text-sm text-gray-700">Mark as reimbursable</label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update Expense' : 'Save Expense'}
        </Button>
      </div>
    </form>
  )
}
