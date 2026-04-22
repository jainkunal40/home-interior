'use client'

import { useState, useEffect, useActionState } from 'react'
import { submitClientPayment } from '@/actions/income'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, X, IndianRupee } from 'lucide-react'

const PAYMENT_TYPES = [
  { value: 'advance', label: 'Advance' },
  { value: 'milestone_payment', label: 'Milestone Payment' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'final_payment', label: 'Final Payment' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

export function ClientPaymentForm({ projectId }: { projectId: string }) {
  const [showForm, setShowForm] = useState(false)
  const submitAction = submitClientPayment.bind(null, projectId)
  const [state, action, pending] = useActionState(submitAction, null)

  useEffect(() => {
    if (state?.success) setShowForm(false)
  }, [state?.success])

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <IndianRupee className="w-4 h-4" />
        Record Payment to Owner
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Record Payment to Owner</h2>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="p-1 rounded hover:bg-gray-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
          Use this to record a payment you have made directly to the project owner.
        </p>
        <form action={action} className="space-y-3">
          {state?.error && (
            <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input name="date" label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <Input name="amount" label="Amount (₹)" type="number" step="0.01" min="1" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select name="paymentType" label="Payment Type" options={PAYMENT_TYPES} placeholder="Select type" required />
            <Select name="paymentMode" label="Payment Mode" options={PAYMENT_MODES} placeholder="Select mode" required />
          </div>
          <Input name="referenceNumber" label="Reference / UTR Number" placeholder="Optional — for bank transfers, UPI etc." />
          <Textarea name="notes" label="Notes" placeholder="Any additional details?" rows={2} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? 'Saving...' : 'Save Payment'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
