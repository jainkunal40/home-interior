'use client'

import { useState, useEffect, useActionState } from 'react'
import { createVendor, updateVendor, deleteVendor } from '@/actions/vendors'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { EXPENSE_CATEGORIES } from '@/lib/utils'
import { Plus, Store, Trash2, Edit2, Phone, Mail } from 'lucide-react'

export function VendorsClient({ vendors }: { vendors: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Store className="w-16 h-16" />}
          title="No vendors yet"
          description="Add vendors to quickly select them when recording expenses."
          action={<Button size="sm" onClick={openAdd}>Add First Vendor</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vendors.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{v.name}</p>
                    {v.category && (
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{v.category}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {v.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {v.phone}
                        </span>
                      )}
                      {v.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {v.email}
                        </span>
                      )}
                    </div>
                    {v.gstNumber && <p className="text-xs text-gray-400 mt-1">GST: {v.gstNumber}</p>}
                    {v.notes && <p className="text-xs text-gray-400 mt-1">{v.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(v)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <form action={async () => { if (confirm('Delete this vendor?')) await deleteVendor(v.id) }}>
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

      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Vendor' : 'Add Vendor'}>
        <VendorForm editItem={editItem} onClose={closeForm} />
      </Modal>
    </div>
  )
}

function VendorForm({ editItem, onClose }: { editItem: any; onClose: () => void }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateVendor.bind(null, editItem.id)
    : createVendor
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input name="name" label="Vendor Name *" placeholder="e.g., Shree Timber Works" defaultValue={editItem?.name || ''} required />
      <Input name="phone" label="Phone" type="tel" placeholder="+91 98765 43210" defaultValue={editItem?.phone || ''} />
      <Input name="email" label="Email" type="email" placeholder="vendor@email.com" defaultValue={editItem?.email || ''} />
      <Select
        name="category"
        label="Category"
        options={[{ value: '', label: 'No category' }, ...EXPENSE_CATEGORIES]}
        defaultValue={editItem?.category || ''}
      />
      <Input name="address" label="Address" placeholder="Shop address" defaultValue={editItem?.address || ''} />
      <Input name="gstNumber" label="GST Number" placeholder="29ABCDE1234F1Z5" defaultValue={editItem?.gstNumber || ''} />
      <Textarea name="notes" label="Notes" placeholder="Optional notes..." defaultValue={editItem?.notes || ''} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  )
}
