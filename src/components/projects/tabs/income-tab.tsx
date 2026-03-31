'use client'

import { useState, useEffect, useActionState } from 'react'
import { createIncome, updateIncome, deleteIncome } from '@/actions/income'
import { formatINR } from '@/lib/currency'
import { getLabelForValue, PAYMENT_TYPES, PAYMENT_MODES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, IndianRupee, Trash2, Edit2 } from 'lucide-react'
import { format } from 'date-fns'

export function IncomeTab({ project }: { project: any }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const total = project.incomeTransactions.reduce((s: number, t: any) => s + t.amount, 0)

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Income</h3>
          <p className="text-lg font-bold text-green-600">{formatINR(total)}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Income
        </Button>
      </div>

      {project.incomeTransactions.length === 0 ? (
        <EmptyState
          icon={<IndianRupee className="w-12 h-12" />}
          title="No income recorded"
          description="Record client payments, advances, and deposits."
          action={<Button size="sm" onClick={openAdd}>Add First Income</Button>}
        />
      ) : (
        <div className="space-y-2">
          {project.incomeTransactions.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1" onClick={() => openEdit(t)} role="button" tabIndex={0}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-green-600 tabular-nums">
                        {formatINR(t.amount)}
                      </span>
                      <Badge className="bg-green-50 text-green-700">
                        {getLabelForValue(PAYMENT_TYPES, t.paymentType)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{format(new Date(t.date), 'dd MMM yyyy')}</span>
                      <span>·</span>
                      <span>{getLabelForValue(PAYMENT_MODES, t.paymentMode)}</span>
                      {t.receivedFrom && (
                        <>
                          <span>·</span>
                          <span>From: {t.receivedFrom}</span>
                        </>
                      )}
                    </div>
                    {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
                    {t.referenceNumber && (
                      <p className="text-xs text-gray-400">Ref: {t.referenceNumber}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <form action={async () => { if (confirm('Delete this income entry?')) await deleteIncome(t.id, project.id) }}>
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

      {/* Add/Edit Income Modal */}
      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Income' : 'Add Income'}>
        <IncomeForm project={project} editItem={editItem} onClose={closeForm} />
      </Modal>
    </div>
  )
}

function IncomeForm({ project, editItem, onClose }: { project: any; editItem: any; onClose: () => void }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateIncome.bind(null, editItem.id, project.id)
    : createIncome.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input name="date" label="Date *" type="date" defaultValue={editItem ? new Date(editItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
      <Input name="amount" label="Amount (₹) *" type="number" prefix="₹" placeholder="50000" defaultValue={editItem?.amount || ''} required />
      <Select name="paymentType" label="Payment Type *" options={[...PAYMENT_TYPES]} defaultValue={editItem?.paymentType || 'advance'} />
      <Select name="paymentMode" label="Payment Mode *" options={[...PAYMENT_MODES]} defaultValue={editItem?.paymentMode || 'bank_transfer'} />
      <Input name="receivedFrom" label="Received From" placeholder="Client name" defaultValue={editItem?.receivedFrom || ''} />
      <Input name="referenceNumber" label="Reference / Txn ID" placeholder="UPI ref, cheque no, etc." defaultValue={editItem?.referenceNumber || ''} />
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
          {isPending ? 'Saving...' : isEdit ? 'Update Income' : 'Save Income'}
        </Button>
      </div>
    </form>
  )
}
