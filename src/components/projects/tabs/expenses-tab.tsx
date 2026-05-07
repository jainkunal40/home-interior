'use client'

import { useState, useEffect, useActionState } from 'react'
import { createExpense, updateExpense, deleteExpense, approveExpense, rejectExpense } from '@/actions/expenses'
import { updateMaterialEntryPayment } from '@/actions/materials'
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
import { Plus, Wallet, Trash2, Edit2, Link2, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

// Approved material-category transactions live in the Materials workflow.
const MATERIAL_CATEGORY_SET = new Set(['materials', 'hardware', 'furnishing'])

export function ExpensesTab({ project, allVendors = [], allContractors = [] }: { project: any; allVendors?: any[]; allContractors?: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Approved material-category rows are excluded here, but pending client submissions still need approval controls.
  const approvedTransactions = project.expenseTransactions.filter(
    (e: any) => e.approvalStatus !== 'pending' && e.approvalStatus !== 'rejected' && !MATERIAL_CATEGORY_SET.has(e.category)
  )
  const pendingTransactions = project.expenseTransactions.filter(
    (e: any) => e.approvalStatus === 'pending'
  )

  // Flatten material entry payments into display rows (read-only)
  const materialPaymentRows = (project.materialEntries ?? []).flatMap((entry: any) =>
    (entry.payments ?? []).map((p: any) => ({
      _isMaterialPayment: true,
      id: `material-${p.id}`,
      paymentId: p.id,
      entryId: entry.id,
      description: entry.description,
      category: entry.category,
      billAmount: entry.billAmount,
      billNumber: entry.billNumber,
      billDate: entry.billDate,
      notes: entry.notes,
      phaseId: entry.phaseId,
      vendorId: entry.vendorId,
      amount: p.amount,
      date: p.date,
      paymentMode: p.paymentMode,
      paymentNotes: p.notes,
      referenceNumber: p.referenceNumber,
      paidByClient: entry.paidByClient,
      vendorName: entry.vendor?.name || entry.vendorName,
    }))
  )
  const materialPaymentTotal = materialPaymentRows.reduce((s: number, p: any) => s + p.amount, 0)
  const displayRows = [
    ...approvedTransactions.map((t: any) => ({ ...t, _isMaterialPayment: false })),
    ...materialPaymentRows,
  ]
    .filter((row: any) => filterCategory === 'all' || row.category === filterCategory)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const total = approvedTransactions.reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0) + materialPaymentTotal
  const pendingTotal = pendingTransactions.reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)
  const filteredTotal = displayRows.reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)

  // Category breakdown (approved only)
  const categoryBreakdown: Record<string, number> = {}
  for (const exp of approvedTransactions) {
    const cat = exp.category || 'misc'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount + (exp.taxAmount || 0)
  }
  for (const payment of materialPaymentRows) {
    const cat = payment.category || 'materials'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + payment.amount
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

      {/* Pending Approval */}
      {pendingTransactions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-amber-700">Pending Approval</h3>
                <p className="text-xs text-amber-600">{pendingTransactions.length} expense{pendingTransactions.length !== 1 ? 's' : ''} from client · {formatINR(pendingTotal)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-amber-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 tabular-nums text-sm">{formatINR(t.amount + (t.taxAmount || 0))}</span>
                      <Badge className="bg-amber-50 text-amber-700">{getLabelForValue(EXPENSE_CATEGORIES, t.category)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>{format(new Date(t.date), 'dd MMM yyyy')}</span>
                      {t.vendorName && <><span>·</span><span>{t.vendorName}</span></>}
                    </div>
                    {t.notes && <p className="text-xs text-gray-400 mt-0.5">{t.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <form action={async () => { await approveExpense(t.id) }}>
                      <button type="submit" className="p-2 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50 min-w-[40px] min-h-[40px] flex items-center justify-center" title="Approve">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </form>
                    <form action={async () => { await rejectExpense(t.id) }}>
                      <button type="submit" className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center" title="Reject">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {displayRows.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-12 h-12" />}
          title={filterCategory !== 'all' ? 'No expenses in this category' : 'No expenses recorded'}
          description={filterCategory !== 'all' ? 'Try a different category or add a new expense.' : 'Start tracking material costs, vendor bills, and other expenses.'}
          action={<Button size="sm" onClick={openAdd}>Add First Expense</Button>}
        />
      ) : (
        <div className="space-y-2">
          {displayRows.map((t: any) => (
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
                      {t._isMaterialPayment && (
                        <Badge className="bg-gray-50 text-gray-600">Material Payment</Badge>
                      )}
                      {t.isReimbursable && (
                        <Badge className="bg-yellow-50 text-yellow-700">Reimbursable</Badge>
                      )}
                      {t.paidByClient && (
                        <Badge className="bg-purple-50 text-purple-700">Client Paid</Badge>
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
                    {t._isMaterialPayment && t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
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
                  {t._isMaterialPayment ? (
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <Modal open={showForm} onClose={closeForm} title={editItem?._isMaterialPayment ? 'Edit Material Payment' : editItem ? 'Edit Expense' : 'Add Expense'}>
        {editItem?._isMaterialPayment ? (
          <MaterialPaymentEditForm project={project} editItem={editItem} onClose={closeForm} allVendors={allVendors} />
        ) : (
          <ExpenseForm project={project} editItem={editItem} onClose={closeForm} allVendors={allVendors} allContractors={allContractors} />
        )}
      </Modal>
    </div>
  )
}

function MaterialPaymentEditForm({ project, editItem, onClose, allVendors = [] }: { project: any; editItem: any; onClose: () => void; allVendors?: any[] }) {
  const action = updateMaterialEntryPayment.bind(null, editItem.entryId, editItem.paymentId, project.id)
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input name="description" label="Material Description *" placeholder="e.g. Teak wood, hinges, laminate sheets" defaultValue={editItem.description || ''} required />
      <Select
        name="category"
        label="Category"
        options={EXPENSE_CATEGORIES.filter(c => !['labor', 'subcontractor'].includes(c.value))}
        defaultValue={editItem.category || 'materials'}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input name="billAmount" label="Bill Amount (₹) *" type="number" prefix="₹" defaultValue={editItem.billAmount || ''} required />
        <Input name="billNumber" label="Bill / Invoice No." placeholder="INV-001" defaultValue={editItem.billNumber || ''} />
      </div>
      <Input name="billDate" label="Bill Date" type="date" defaultValue={editItem.billDate ? new Date(editItem.billDate).toISOString().split('T')[0] : ''} />
      {allVendors.length > 0 ? (
        <Select
          name="vendorId"
          label="Vendor"
          options={[{ value: '', label: 'Select vendor or type below' }, ...allVendors.map(v => ({ value: v.id, label: `${v.name}${v.category ? ` (${v.category})` : ''}` }))]}
          defaultValue={editItem.vendorId || ''}
        />
      ) : null}
      <Input name="vendorName" label={allVendors.length > 0 ? 'Or enter vendor name' : 'Vendor Name'} placeholder="e.g., Shree Timber Works" defaultValue={editItem.vendorName || ''} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="amount" label="Payment Amount (₹) *" type="number" prefix="₹" defaultValue={editItem.amount || ''} required />
        <Input name="date" label="Payment Date *" type="date" defaultValue={editItem.date ? new Date(editItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
      </div>
      <Select name="paymentMode" label="Payment Mode" options={[...PAYMENT_MODES]} defaultValue={editItem.paymentMode || 'cash'} />
      <Input name="referenceNumber" label="Reference / UTR No." placeholder="Optional" defaultValue={editItem.referenceNumber || ''} />
      {project.phases?.length > 0 && (
        <Select
          name="phaseId"
          label="Project Phase"
          options={[{ value: '', label: 'Not linked' }, ...project.phases.map((p: any) => ({ value: p.id, label: p.name }))]}
          defaultValue={editItem.phaseId || ''}
        />
      )}
      <Textarea name="materialNotes" label="Material Notes" placeholder="Specs, dimensions, or other details..." defaultValue={editItem.notes || ''} />
      <Textarea name="paymentNotes" label="Payment Notes" placeholder="Optional payment note..." defaultValue={editItem.paymentNotes || ''} />
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          name="paidByClient"
          defaultChecked={!!editItem.paidByClient}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 accent-brand-500"
        />
        <span className="text-sm text-gray-700">Client bears this cost <span className="text-xs text-gray-400">(excluded from your P&L)</span></span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : 'Update Material'}
        </Button>
      </div>
    </form>
  )
}

function ExpenseForm({ project, editItem, onClose, allVendors = [], allContractors = [] }: { project: any; editItem: any; onClose: () => void; allVendors?: any[]; allContractors?: any[] }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateExpense.bind(null, editItem.id, project.id)
    : createExpense.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)
  const [selectedCategory, setSelectedCategory] = useState(editItem?.category || 'materials')
  const [selectedContractorId, setSelectedContractorId] = useState(
    editItem?.laborEntry?.contractorId ||
    (editItem?.vendorName ? allContractors.find(c => c.name === editItem.vendorName)?.id : '') || ''
  )
  const [selectedMaterialEntryId, setSelectedMaterialEntryId] = useState('')
  const [materialMode, setMaterialMode] = useState<'existing' | 'new'>('existing')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  // Use all vendors from the system
  const vendors = allVendors

  // Use all contractors from the system for subcontractor/labor categories
  const contractors = allContractors

  // Labor entries for linking payments
  const laborEntries = project.laborEntries || []
  const materialEntriesWithDue = (project.materialEntries || [])
    .map((entry: any) => {
      const paid = (entry.payments || []).reduce((s: number, p: any) => s + p.amount, 0)
      return { ...entry, paid, due: Math.max(0, entry.billAmount - paid) }
    })
    .filter((entry: any) => entry.due > 0 && (!selectedCategory || entry.category === selectedCategory || selectedCategory === 'materials'))

  const showMaterialLink = MATERIAL_CATEGORY_SET.has(selectedCategory)
  const showLaborLink = selectedCategory === 'labor' || selectedCategory === 'subcontractor'
  const showContractorSelect = selectedCategory === 'subcontractor' || selectedCategory === 'labor'
  const selectedMaterialEntry = materialEntriesWithDue.find((entry: any) => entry.id === selectedMaterialEntryId)
  const isNewMaterial = showMaterialLink && materialMode === 'new'

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
        onChange={(e) => {
          setSelectedCategory(e.target.value)
          setSelectedMaterialEntryId('')
          setMaterialMode('existing')
        }}
      />

      {showMaterialLink && (
        <>
          <Select
            name="materialMode"
            label="Material entry"
            options={[
              { value: 'existing', label: 'Add payment to existing material' },
              { value: 'new', label: 'Create new material entry' },
            ]}
            defaultValue={materialMode}
            onChange={(e) => {
              setMaterialMode(e.target.value as 'existing' | 'new')
              setSelectedMaterialEntryId('')
            }}
          />

          {materialMode === 'existing' && materialEntriesWithDue.length > 0 ? (
            <Select
              name="materialEntryId"
              label="Add payment to material *"
              options={[
                { value: '', label: 'Select material with due' },
                ...materialEntriesWithDue.map((entry: any) => ({
                  value: entry.id,
                  label: `${entry.description} — Due: ${formatINR(entry.due)}`,
                })),
              ]}
              defaultValue=""
              onChange={(e) => setSelectedMaterialEntryId(e.target.value)}
              required
            />
          ) : materialMode === 'existing' ? (
            <div className="p-3 rounded-lg bg-amber-50 text-sm text-amber-700">
              No existing {getLabelForValue(EXPENSE_CATEGORIES, selectedCategory).toLowerCase()} entry has pending due. Choose create new material entry.
            </div>
          ) : (
            <>
              <Input name="materialDescription" label="Material Description *" placeholder="e.g. Teak wood, hinges, laminate sheets" required />
              <Input name="materialBillAmount" label="Bill Amount (₹)" type="number" prefix="₹" placeholder="Defaults to payment amount" />
            </>
          )}
          {selectedMaterialEntry && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between text-sm">
              <span className="text-blue-700">Outstanding balance</span>
              <span className="font-bold text-blue-700 tabular-nums">{formatINR(selectedMaterialEntry.due)}</span>
            </div>
          )}
        </>
      )}

      {/* Vendor selection */}
      {(!showMaterialLink || isNewMaterial) && !showContractorSelect && vendors.length > 0 ? (
        <Select
          name="vendorId"
          label="Vendor"
          options={[{ value: '', label: 'Select vendor or type below' }, ...vendors.map(v => ({ value: v.id, label: `${v.name}${v.category ? ` (${v.category})` : ''}` }))]}
          defaultValue={editItem?.vendorId || ''}
        />
      ) : null}
      {(!showMaterialLink || isNewMaterial) && !showContractorSelect && (
        <Input name="vendorName" label={vendors.length > 0 ? 'Or enter vendor name' : 'Vendor Name'} placeholder="e.g., Shree Timber Works" defaultValue={editItem?.vendorName || ''} />
      )}

      {/* Contractor selection for subcontractor/labor categories */}
      {showContractorSelect && contractors.length > 0 && (
        <>
          <Select
            name="contractorId"
            label="Contractor / Subcontractor"
            options={[{ value: '', label: 'Select contractor' }, ...contractors.map(c => ({ value: c.id, label: `${c.name} (${c.trade})` }))]}
            defaultValue={selectedContractorId}
            onChange={(e) => setSelectedContractorId(e.target.value)}
          />
          <input type="hidden" name="vendorName" value={contractors.find(c => c.id === selectedContractorId)?.name || ''} />
        </>
      )}

      {/* Labor entry link for contractor/labor payments */}
      {!showMaterialLink && showLaborLink && laborEntries.length > 0 && (
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
      {(!showLaborLink || showMaterialLink) && editItem?.laborEntryId && (
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
      {(!showMaterialLink || isNewMaterial) && (
        <>
          {!showMaterialLink && (
            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" name="isReimbursable" value="true" id="isReimbursable" defaultChecked={editItem?.isReimbursable || false} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <label htmlFor="isReimbursable" className="text-sm text-gray-700">Mark as reimbursable</label>
            </div>
          )}
          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" name="paidByClient" value="true" id="paidByClient" defaultChecked={editItem?.paidByClient ?? !!project.clientManagedExpenses} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <label htmlFor="paidByClient" className="text-sm text-gray-700">Paid directly by client</label>
          </div>
        </>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending || (showMaterialLink && materialMode === 'existing' && materialEntriesWithDue.length === 0)}>
          {isPending ? 'Saving...' : isEdit ? 'Update Expense' : 'Save Expense'}
        </Button>
      </div>
    </form>
  )
}
