'use client'

import { useState, useEffect, useActionState } from 'react'
import { createLabor, updateLabor, deleteLabor } from '@/actions/labor'
import { formatINR } from '@/lib/currency'
import { getLabelForValue, TRADE_TYPES, RATE_TYPES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trash2, Edit2, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'

const LABOR_STATUSES = [
  { value: 'ongoing', label: 'Ongoing', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'pending_payment', label: 'Pending Payment', color: 'bg-orange-100 text-orange-700' },
]

export function LaborTab({ project, allContractors = [] }: { project: any; allContractors?: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const totalLabor = project.laborEntries.reduce((s: number, l: any) => s + l.totalAmount, 0)
  const totalAdvance = project.laborEntries.reduce((s: number, l: any) => s + l.advancePaid, 0)
  const totalPending = totalLabor - totalAdvance

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Labor & Contractors</h3>
          <p className="text-lg font-bold text-gray-900">{formatINR(totalLabor)}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Labor
        </Button>
      </div>

      {/* Summary */}
      {project.laborEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{formatINR(totalLabor)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-sm font-bold text-green-600 tabular-nums">{formatINR(totalAdvance)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-sm font-bold text-orange-600 tabular-nums">{formatINR(totalPending)}</p>
          </div>
        </div>
      )}

      {project.laborEntries.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No labor entries"
          description="Track contractor and labor costs with daily rates, fixed contracts, or per-unit pricing."
          action={<Button size="sm" onClick={openAdd}>Add First Entry</Button>}
        />
      ) : (
        <div className="space-y-2">
          {project.laborEntries.map((l: any) => {
            const remaining = l.totalAmount - l.advancePaid
            const statusInfo = LABOR_STATUSES.find(s => s.value === l.status)
            // Show linked payments
            const linkedPayments = l.payments || []
            return (
              <Card key={l.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1" onClick={() => openEdit(l)} role="button" tabIndex={0}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {l.contractor?.name || 'Unknown'}
                        </span>
                        <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-700'}>
                          {statusInfo?.label || l.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        <span>{getLabelForValue(TRADE_TYPES, l.tradeType)}</span>
                        <span>·</span>
                        <span>{getLabelForValue(RATE_TYPES, l.rateType)}: {formatINR(l.rateAmount)}</span>
                        {l.rateType !== 'fixed' && (
                          <>
                            <span>×</span>
                            <span>{l.quantity} {l.rateType === 'daily' ? 'days' : 'units'}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-gray-600">
                          Total: <span className="font-semibold tabular-nums">{formatINR(l.totalAmount)}</span>
                        </span>
                        {l.advancePaid > 0 && (
                          <span className="text-green-600">
                            Paid: <span className="font-medium tabular-nums">{formatINR(l.advancePaid)}</span>
                          </span>
                        )}
                        {remaining > 0 && (
                          <span className="text-orange-600">
                            Due: <span className="font-medium tabular-nums">{formatINR(remaining)}</span>
                          </span>
                        )}
                      </div>
                      {/* Payment history from linked expenses */}
                      {linkedPayments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-500">Payment History:</p>
                          {linkedPayments.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-2 text-xs text-gray-500">
                              <IndianRupee className="w-3 h-3 text-green-500" />
                              <span>{formatINR(p.amount)}</span>
                              <span className="text-gray-400">·</span>
                              <span>{format(new Date(p.date), 'dd MMM yyyy')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {l.startDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(l.startDate), 'dd MMM')}
                          {l.endDate && ` — ${format(new Date(l.endDate), 'dd MMM yyyy')}`}
                        </p>
                      )}
                      {l.notes && <p className="text-xs text-gray-400 mt-1">{l.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => openEdit(l)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <form action={async () => { if (confirm('Delete this labor entry?')) await deleteLabor(l.id, project.id) }}>
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

      {/* Add/Edit Labor Modal */}
      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Labor / Contractor' : 'Add Labor / Contractor'}>
        <LaborForm project={project} editItem={editItem} onClose={closeForm} allContractors={allContractors} />
      </Modal>
    </div>
  )
}

function LaborForm({ project, editItem, onClose, allContractors = [] }: { project: any; editItem: any; onClose: () => void; allContractors?: any[] }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateLabor.bind(null, editItem.id, project.id)
    : createLabor.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)
  const [selectedContractorId, setSelectedContractorId] = useState(editItem?.contractorId || '')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  const selectedContractor = allContractors.find(c => c.id === selectedContractorId)

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      {selectedContractorId && (
        <input type="hidden" name="contractorId" value={selectedContractorId} />
      )}
      {allContractors.length > 0 && !isEdit && (
        <Select
          name="_selectContractor"
          label="Select Existing Contractor"
          options={[{ value: '', label: 'Or enter new below' }, ...allContractors.map(c => ({ value: c.id, label: `${c.name} (${c.trade})` }))]}
          defaultValue={selectedContractorId}
          onChange={(e) => {
            const id = e.target.value
            setSelectedContractorId(id)
            const c = allContractors.find(x => x.id === id)
            if (c) {
              const nameInput = document.querySelector<HTMLInputElement>('input[name="contractorName"]')
              const tradeSelect = document.querySelector<HTMLSelectElement>('select[name="tradeType"]')
              if (nameInput) nameInput.value = c.name
              if (tradeSelect) tradeSelect.value = c.trade
            }
          }}
        />
      )}
      <Input name="contractorName" label="Contractor / Labor Name *" placeholder="e.g., Ramesh (Carpenter)" defaultValue={isEdit ? (editItem?.contractor?.name || '') : (selectedContractor?.name || '')} required />
      <Select name="tradeType" label="Trade *" options={[...TRADE_TYPES]} defaultValue={editItem?.tradeType || 'carpenter'} />
      <Select name="rateType" label="Rate Type *" options={[...RATE_TYPES]} defaultValue={editItem?.rateType || 'daily'} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="rateAmount" label="Rate (₹) *" type="number" prefix="₹" placeholder="800" defaultValue={editItem?.rateAmount || ''} required />
        <Input name="quantity" label="Qty / Days *" type="number" placeholder="10" defaultValue={editItem?.quantity || 1} required />
      </div>

      {isEdit && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <strong>Tip:</strong> Update rate or quantity here if scope changed. Payments are tracked via the Expenses tab — use category &quot;Labor&quot; and link to this entry.
        </div>
      )}

      <Input name="advancePaid" label="Initial Advance (₹)" type="number" prefix="₹" placeholder="0" defaultValue={editItem?.advancePaid || 0} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="startDate" label="Start Date" type="date" defaultValue={editItem?.startDate ? new Date(editItem.startDate).toISOString().split('T')[0] : ''} />
        <Input name="endDate" label="End Date" type="date" defaultValue={editItem?.endDate ? new Date(editItem.endDate).toISOString().split('T')[0] : ''} />
      </div>
      <Select
        name="status"
        label="Status"
        options={LABOR_STATUSES.map(s => ({ value: s.value, label: s.label }))}
        defaultValue={editItem?.status || 'ongoing'}
      />
      {project.phases?.length > 0 && (
        <Select
          name="phaseId"
          label="Project Phase"
          options={[{ value: '', label: 'Not linked' }, ...project.phases.map((p: any) => ({ value: p.id, label: p.name }))]}
          defaultValue={editItem?.phaseId || ''}
        />
      )}
      <Textarea name="notes" label="Notes" placeholder="Optional notes..." defaultValue={editItem?.notes || ''} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update Labor' : 'Save Labor'}
        </Button>
      </div>
    </form>
  )
}
