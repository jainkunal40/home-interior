import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
] as const

export const PAYMENT_TYPES = [
  { value: 'advance', label: 'Advance' },
  { value: 'milestone_payment', label: 'Milestone Payment' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'final_payment', label: 'Final Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' },
] as const

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
] as const

export const EXPENSE_CATEGORIES = [
  { value: 'materials', label: 'Materials' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'transport', label: 'Transport' },
  { value: 'labor', label: 'Labor' },
  { value: 'site_expense', label: 'Site Expense' },
  { value: 'rental', label: 'Rental' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'furnishing', label: 'Furnishing' },
  { value: 'utility', label: 'Utility' },
  { value: 'misc', label: 'Misc' },
] as const

export const TRADE_TYPES = [
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'painter', label: 'Painter' },
  { value: 'false_ceiling', label: 'False Ceiling' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'pop', label: 'POP' },
  { value: 'modular', label: 'Modular' },
  { value: 'civil', label: 'Civil' },
  { value: 'helper', label: 'Helper' },
  { value: 'other', label: 'Other' },
] as const

export const RATE_TYPES = [
  { value: 'daily', label: 'Daily Rate' },
  { value: 'fixed', label: 'Fixed Contract' },
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_sqft', label: 'Per Sq Ft' },
  { value: 'per_item', label: 'Per Item' },
] as const

export const PHASE_NAMES = [
  'Design', 'Demolition', 'Civil', 'Electrical', 'Plumbing',
  'Carpentry', 'Painting', 'Furnishing', 'Handover',
] as const

export const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700' },
] as const

export function getStatusColor(status: string): string {
  return PROJECT_STATUSES.find(s => s.value === status)?.color ?? 'bg-gray-100 text-gray-700'
}

export function getLabelForValue(list: readonly { value: string; label: string }[], value: string): string {
  return list.find(item => item.value === value)?.label ?? value
}
