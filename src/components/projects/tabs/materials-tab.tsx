'use client'

import { useState, useActionState, useEffect } from 'react'
import {
  createMaterial, updateMaterial, deleteMaterial,
  addMaterialPayment, deleteMaterialPayment,
} from '@/actions/materials'
import { formatINR } from '@/lib/currency'
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Trash2, Edit2, ChevronDown, ChevronUp, IndianRupee, Receipt } from 'lucide-react'
import { format } from 'date-fns'

const MATERIAL_CATEGORIES = EXPENSE_CATEGORIES.filter(c =>
  ['materials', 'hardware', 'furnishing', 'misc'].includes(c.value)
)
const MATERIAL_CATEGORY_VALUES = new Set(MATERIAL_CATEGORIES.map(c => c.value))

export function MaterialsTab({ project, allVendors = [] }: { project: any; allVendors?: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [paymentFor, setPaymentFor] = useState<any>(null)

  const entries: any[] = project.materialEntries ?? []

  // Material-category expense transactions (one-off, not linked to labor)
  const expenseRows: any[] = (project.expenseTransactions ?? []).filter(
    (e: any) =>
      MATERIAL_CATEGORY_VALUES.has(e.category) &&
      !e.laborEntryId &&
      e.approvalStatus !== 'rejected'
  )

  const totalBill = entries.reduce((s, e) => s + e.billAmount, 0)
  const totalPaid = entries.reduce((s, e) => s + e.payments.reduce((ps: number, p: any) => ps + p.amount, 0), 0)
  const totalPending = totalBill - totalPaid
  const totalExpenses = expenseRows.reduce((s: number, e: any) => s + e.amount + (e.taxAmount ?? 0), 0)
  const grandTotal = totalBill + totalExpenses

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Materials & Purchases</h3>
          <p className="text-lg font-bold text-gray-900">{formatINR(grandTotal)}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Material
        </Button>
      </div>

      {/* Summary — only when there's something to show */}
      {(entries.length > 0 || expenseRows.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Bills Total</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{formatINR(totalBill)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Bills Paid</p>
            <p className="text-sm font-bold text-green-600 tabular-nums">{formatINR(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Bills Pending</p>
            <p className={`text-sm font-bold tabular-nums ${totalPending > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {formatINR(totalPending)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">One-off Expenses</p>
            <p className="text-sm font-bold text-gray-700 tabular-nums">{formatINR(totalExpenses)}</p>
          </div>
        </div>
      )}

      {entries.length === 0 && expenseRows.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No material entries"
          description="Track purchases and bills. Record the total bill and log partial payments as you pay them."
          action={<Button size="sm" onClick={openAdd}>Add First Entry</Button>}
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const paid = entry.payments.reduce((s: number, p: any) => s + p.amount, 0)
            const due = entry.billAmount - paid
            const isExpanded = expandedId === entry.id
            const pctPaid = entry.billAmount > 0 ? Math.min(100, Math.round((paid / entry.billAmount) * 100)) : 0

            return (
              <Card key={entry.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{entry.description}</span>
                        <Badge className="bg-blue-50 text-blue-700 capitalize">
                          {MATERIAL_CATEGORIES.find(c => c.value === entry.category)?.label ?? entry.category}
                        </Badge>
                        {entry.paidByClient && (
                          <Badge className="bg-purple-50 text-purple-700">Client Paid</Badge>
                        )}
                        {due <= 0 && (
                          <Badge className="bg-green-100 text-green-700">Fully Paid</Badge>
                        )}
                        {due > 0 && paid > 0 && (
                          <Badge className="bg-orange-100 text-orange-700">Partial</Badge>
                        )}
                        {paid === 0 && (
                          <Badge className="bg-red-50 text-red-600">Unpaid</Badge>
                        )}
                      </div>

                      {/* Vendor / bill info */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        {entry.vendorName && <span>{entry.vendorName}</span>}
                        {entry.billNumber && (
                          <>
                            {entry.vendorName && <span>·</span>}
                            <span>Bill #{entry.billNumber}</span>
                          </>
                        )}
                        {entry.billDate && (
                          <>
                            <span>·</span>
                            <span>{format(new Date(entry.billDate), 'dd MMM yyyy')}</span>
                          </>
                        )}
                      </div>

                      {/* Amounts */}
                      <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                        <span className="text-gray-700">
                          Bill: <span className="font-semibold tabular-nums">{formatINR(entry.billAmount)}</span>
                        </span>
                        {paid > 0 && (
                          <span className="text-green-600">
                            Paid: <span className="font-medium tabular-nums">{formatINR(paid)}</span>
                          </span>
                        )}
                        {due > 0 && (
                          <span className="text-orange-600 font-semibold">
                            Due: <span className="tabular-nums">{formatINR(due)}</span>
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {entry.billAmount > 0 && (
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pctPaid >= 100 ? 'bg-green-500' : 'bg-brand-400'}`}
                            style={{ width: `${pctPaid}%` }}
                          />
                        </div>
                      )}

                      {/* Payment history toggle */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {entry.payments.length} payment{entry.payments.length !== 1 ? 's' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentFor(entry)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          + Add Payment
                        </button>
                      </div>

                      {/* Payment history */}
                      {isExpanded && entry.payments.length > 0 && (
                        <div className="mt-2 space-y-1 pl-1 border-l-2 border-gray-100">
                          {entry.payments.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-2 text-xs text-gray-500 group">
                              <IndianRupee className="w-3 h-3 text-green-500 shrink-0" />
                              <span className="font-medium text-gray-700 tabular-nums">{formatINR(p.amount)}</span>
                              <span>·</span>
                              <span>{format(new Date(p.date), 'dd MMM yyyy')}</span>
                              <span className="text-gray-400 capitalize">{p.paymentMode.replace('_', ' ')}</span>
                              {p.referenceNumber && <span>· {p.referenceNumber}</span>}
                              <form
                                action={async () => {
                                  if (confirm('Delete this payment?')) await deleteMaterialPayment(p.id, project.id)
                                }}
                                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <button type="submit" className="text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </form>
                            </div>
                          ))}
                        </div>
                      )}

                      {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <form action={async () => { if (confirm('Delete this material entry and all its payments?')) await deleteMaterial(entry.id, project.id) }}>
                        <button type="submit" className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* One-off material expenses from Expenses tab */}
      {expenseRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              One-off Expenses ({expenseRows.length})
            </h4>
          </div>
          <div className="space-y-2">
            {expenseRows.map((exp: any) => {
              const total = exp.amount + (exp.taxAmount ?? 0)
              const catLabel = EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label ?? exp.category
              return (
                <Card key={exp.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">
                            {exp.vendor?.name || exp.vendorName || 'No vendor'}
                          </span>
                          <Badge className="bg-blue-50 text-blue-700">{catLabel}</Badge>
                          {exp.paidByClient && (
                            <Badge className="bg-purple-50 text-purple-700">Client Paid</Badge>
                          )}
                          {exp.approvalStatus === 'pending' && (
                            <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="font-semibold text-gray-900 tabular-nums">{formatINR(total)}</span>
                          {exp.taxAmount > 0 && (
                            <span className="text-xs text-gray-400">(incl. ₹{exp.taxAmount} tax)</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {format(new Date(exp.date), 'dd MMM yyyy')}
                          </span>
                          {exp.billNumber && (
                            <span className="text-xs text-gray-400">Bill #{exp.billNumber}</span>
                          )}
                        </div>
                        {exp.notes && <p className="text-xs text-gray-400 mt-1">{exp.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-green-100 text-green-700 text-xs">Paid</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 text-center">
            These are one-off expenses from the Expenses tab. Edit them there.
          </p>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Material Entry' : 'Add Material Entry'}>
        <MaterialForm project={project} editItem={editItem} onClose={closeForm} allVendors={allVendors} />
      </Modal>

      {/* Add payment modal */}
      <Modal open={!!paymentFor} onClose={() => setPaymentFor(null)} title={`Record Payment — ${paymentFor?.description ?? ''}`}>
        {paymentFor && (
          <PaymentForm entry={paymentFor} projectId={project.id} onClose={() => setPaymentFor(null)} />
        )}
      </Modal>
    </div>
  )
}

function MaterialForm({
  project, editItem, onClose, allVendors = [],
}: { project: any; editItem: any; onClose: () => void; allVendors?: any[] }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateMaterial.bind(null, editItem.id, project.id)
    : createMaterial.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input
        name="description"
        label="Description *"
        placeholder="e.g. Teak wood — 200 sq ft, Italian marble tiles"
        defaultValue={editItem?.description || ''}
        required
      />
      <Select
        name="category"
        label="Category"
        options={EXPENSE_CATEGORIES.filter(c => !['labor', 'subcontractor'].includes(c.value))}
        defaultValue={editItem?.category || 'materials'}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="billAmount"
          label="Bill Amount (₹) *"
          type="number"
          prefix="₹"
          placeholder="0"
          defaultValue={editItem?.billAmount || ''}
          required
        />
        <Input
          name="billNumber"
          label="Bill / Invoice No."
          placeholder="e.g. INV-001"
          defaultValue={editItem?.billNumber || ''}
        />
      </div>
      <Input
        name="billDate"
        label="Bill Date"
        type="date"
        defaultValue={editItem?.billDate ? new Date(editItem.billDate).toISOString().split('T')[0] : ''}
      />
      {allVendors.length > 0 ? (
        <Select
          name="vendorId"
          label="Vendor"
          options={[
            { value: '', label: 'Select vendor or enter name below' },
            ...allVendors.map(v => ({ value: v.id, label: v.name })),
          ]}
          defaultValue={editItem?.vendorId || ''}
        />
      ) : null}
      <Input
        name="vendorName"
        label={allVendors.length > 0 ? 'Or Vendor Name (free text)' : 'Vendor Name'}
        placeholder="e.g. Shree Timber Works"
        defaultValue={editItem?.vendorName || ''}
      />
      {project.phases?.length > 0 && (
        <Select
          name="phaseId"
          label="Project Phase"
          options={[{ value: '', label: 'Not linked' }, ...project.phases.map((p: any) => ({ value: p.id, label: p.name }))]}
          defaultValue={editItem?.phaseId || ''}
        />
      )}
      <Textarea
        name="notes"
        label="Notes"
        placeholder="Specs, dimensions, or other details..."
        defaultValue={editItem?.notes || ''}
      />
      {/* Client paid toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          name="paidByClient"
          defaultChecked={!!editItem?.paidByClient}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 accent-brand-500"
        />
        <span className="text-sm text-gray-700">Client bears this cost <span className="text-xs text-gray-400">(excluded from your P&L)</span></span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Entry'}
        </Button>
      </div>
    </form>
  )
}

function PaymentForm({ entry, projectId, onClose }: { entry: any; projectId: string; onClose: () => void }) {
  const paid = entry.payments.reduce((s: number, p: any) => s + p.amount, 0)
  const due = entry.billAmount - paid

  const action = addMaterialPayment.bind(null, entry.id, projectId)
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      {due > 0 && (
        <div className="p-3 bg-orange-50 rounded-lg flex items-center justify-between text-sm">
          <span className="text-orange-700">Outstanding balance</span>
          <span className="font-bold text-orange-700 tabular-nums">{formatINR(due)}</span>
        </div>
      )}
      <Input
        name="amount"
        label="Payment Amount (₹) *"
        type="number"
        prefix="₹"
        placeholder={due > 0 ? String(due) : '0'}
        required
      />
      <Input name="date" label="Payment Date *" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
      <Select
        name="paymentMode"
        label="Payment Mode"
        options={[...PAYMENT_MODES]}
        defaultValue="cash"
      />
      <Input name="referenceNumber" label="Reference / UTR No." placeholder="Optional" />
      <Textarea name="notes" label="Notes" placeholder="Optional" />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : 'Record Payment'}
        </Button>
      </div>
    </form>
  )
}
