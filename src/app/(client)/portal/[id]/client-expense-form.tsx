'use client'

import { useState, useEffect, useActionState } from 'react'
import { submitClientExpense } from '@/actions/expenses'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

const CATEGORIES = [
  { value: 'materials', label: 'Materials' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'furnishing', label: 'Furnishing' },
  { value: 'transport', label: 'Transport' },
  { value: 'site_expense', label: 'Site Expense' },
  { value: 'rental', label: 'Rental' },
  { value: 'utility', label: 'Utility' },
  { value: 'labor', label: 'Labor' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'misc', label: 'Miscellaneous' },
]

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

export function ClientExpenseForm({ projectId }: { projectId: string }) {
  const [showForm, setShowForm] = useState(false)
  const submitAction = submitClientExpense.bind(null, projectId)
  const [state, action, pending] = useActionState(submitAction, null)

  useEffect(() => {
    if (state?.success) setShowForm(false)
  }, [state?.success])

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
        <Plus className="w-4 h-4" />
        Add Expense
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Add Expense</h2>
          <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100 min-w-[32px] min-h-[32px] flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
          Expenses you add will be sent to the project owner for approval before being included in calculations.
        </p>
        <form action={action} className="space-y-3">
          {state?.error && (
            <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input name="date" label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <Input name="amount" label="Amount (₹)" type="number" step="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select name="category" label="Category" options={CATEGORIES} required />
            <Select name="paymentMode" label="Payment Mode" options={PAYMENT_MODES} required />
          </div>
          <Input name="vendorName" label="Vendor / Paid To" placeholder="Shop or person name" />
          <Input name="taxAmount" label="Tax / GST Amount (₹)" type="number" step="0.01" defaultValue="0" />
          <Textarea name="notes" label="Notes" placeholder="What was this expense for?" rows={2} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
