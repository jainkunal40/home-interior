import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  siteAddress: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).default('planning'),
  budget: z.coerce.number().min(0, 'Budget must be positive').default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
})

export const incomeSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentType: z.string().min(1, 'Payment type is required'),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  receivedFrom: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  phaseId: z.string().optional(),
})

export const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  vendorName: z.string().optional(),
  vendorId: z.string().optional(),
  contractorId: z.string().optional(),
  laborEntryId: z.string().optional(),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  taxAmount: z.coerce.number().min(0).default(0),
  gstPercent: z.coerce.number().min(0).max(100).optional(),
  billNumber: z.string().optional(),
  isReimbursable: z.boolean().default(false),
  notes: z.string().optional(),
  phaseId: z.string().optional(),
})

export const laborSchema = z.object({
  contractorName: z.string().min(1, 'Contractor name is required'),
  tradeType: z.string().min(1, 'Trade type is required'),
  rateType: z.string().min(1, 'Rate type is required'),
  rateAmount: z.coerce.number().positive('Rate must be positive'),
  quantity: z.coerce.number().positive('Quantity must be positive').default(1),
  advancePaid: z.coerce.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['ongoing', 'completed', 'pending_payment']).default('ongoing'),
  notes: z.string().optional(),
  phaseId: z.string().optional(),
  contractorId: z.string().optional(),
})

export const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  completionDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).default('pending'),
  phaseId: z.string().optional(),
})

export const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
})
