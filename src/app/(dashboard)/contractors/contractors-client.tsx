'use client'

import { useState, useEffect, useActionState } from 'react'
import { createContractor, updateContractor, deleteContractor } from '@/actions/contractors'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { TRADE_TYPES } from '@/lib/utils'
import { formatINR } from '@/lib/currency'
import { Plus, Users, Trash2, Edit2, Phone } from 'lucide-react'

export function ContractorsClient({ contractors }: { contractors: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contractors</h1>
          <p className="text-sm text-gray-500">{contractors.length} contractor{contractors.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Contractor
        </Button>
      </div>

      {contractors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-16 h-16" />}
          title="No contractors yet"
          description="Add contractors to track their work across projects."
          action={<Button size="sm" onClick={openAdd}>Add First Contractor</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contractors.map((c) => {
            const totalAmount = c.laborEntries?.reduce((s: number, l: any) => s + l.totalAmount, 0) || 0
            const totalPaid = c.laborEntries?.reduce((s: number, l: any) => s + l.advancePaid, 0) || 0
            const totalDue = totalAmount - totalPaid
            const activeJobs = c.laborEntries?.filter((l: any) => l.status === 'ongoing').length || 0

            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <Badge className="bg-gray-100 text-gray-600 capitalize">{c.trade}</Badge>
                      </div>
                      {c.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </p>
                      )}
                      {c.laborEntries?.length > 0 && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-gray-500">Total: <span className="font-medium">{formatINR(totalAmount)}</span></span>
                          <span className="text-green-600">Paid: <span className="font-medium">{formatINR(totalPaid)}</span></span>
                          {totalDue > 0 && (
                            <span className="text-orange-600">Due: <span className="font-medium">{formatINR(totalDue)}</span></span>
                          )}
                        </div>
                      )}
                      {activeJobs > 0 && (
                        <p className="text-xs text-blue-600 mt-1">{activeJobs} active job{activeJobs > 1 ? 's' : ''}</p>
                      )}
                      {c.laborEntries?.map((l: any) => (
                        <p key={l.id} className="text-xs text-gray-400 mt-0.5">
                          {l.project?.name} — {formatINR(l.totalAmount)} ({l.status})
                        </p>
                      ))}
                      {c.notes && <p className="text-xs text-gray-400 mt-1">{c.notes}</p>}
                      {c.projects?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.projects.map((pc: any) => (
                            <span key={pc.project.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 border border-brand-200">
                              {pc.project.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <form action={async () => { if (confirm('Delete this contractor? Their labor entries will remain.')) await deleteContractor(c.id) }}>
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

      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Contractor' : 'Add Contractor'}>
        <ContractorForm editItem={editItem} onClose={closeForm} />
      </Modal>
    </div>
  )
}

function ContractorForm({ editItem, onClose }: { editItem: any; onClose: () => void }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateContractor.bind(null, editItem.id)
    : createContractor
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input name="name" label="Contractor Name *" placeholder="e.g., Ramesh Kumar" defaultValue={editItem?.name || ''} required />
      <Input name="phone" label="Phone" type="tel" placeholder="+91 98765 43210" defaultValue={editItem?.phone || ''} />
      <Select name="trade" label="Trade *" options={[...TRADE_TYPES]} defaultValue={editItem?.trade || 'carpenter'} />
      <Textarea name="notes" label="Notes" placeholder="Optional notes..." defaultValue={editItem?.notes || ''} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Contractor'}
        </Button>
      </div>
    </form>
  )
}
