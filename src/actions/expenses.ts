'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { expenseSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { notifyExpensePendingApproval, notifyExpenseApprovalStatus } from '@/lib/notifications'

export async function createExpense(projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = expenseSchema.safeParse({
    ...raw,
    isReimbursable: raw.isReimbursable === 'true',
    paidByClient: raw.paidByClient === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return { error: 'Project not found' }

  const { date, phaseId, vendorId, laborEntryId, contractorId, ...rest } = parsed.data

  // If vendorId is provided, auto-fill vendorName from vendor record
  let vendorName = rest.vendorName
  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (vendor) vendorName = vendor.name
  }

  // Auto-create or find a LaborEntry when category is labor/subcontractor and contractor is selected
  let resolvedLaborEntryId = laborEntryId || null
  const isLaborCategory = rest.category === 'labor' || rest.category === 'subcontractor'
  if (isLaborCategory && contractorId && !laborEntryId) {
    // Check if a labor entry already exists for this contractor + project
    const existingEntry = await prisma.laborEntry.findFirst({
      where: { contractorId, projectId },
    })
    if (existingEntry) {
      resolvedLaborEntryId = existingEntry.id
    } else {
      // Fetch contractor info for the new labor entry
      const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } })
      const newEntry = await prisma.laborEntry.create({
        data: {
          tradeType: contractor?.trade || 'other',
          rateType: 'fixed',
          rateAmount: rest.amount,
          quantity: 1,
          totalAmount: rest.amount,
          advancePaid: 0,
          status: 'ongoing',
          contractorId,
          projectId,
        },
      })
      resolvedLaborEntryId = newEntry.id
    }
  }

  const expense = await prisma.expenseTransaction.create({
    data: {
      ...rest,
      vendorName: vendorName || null,
      date: new Date(date),
      phaseId: phaseId || null,
      vendorId: vendorId || null,
      laborEntryId: resolvedLaborEntryId,
      projectId,
    },
  })

  // If linked to a labor entry, update the labor entry's advancePaid and paidByClient
  if (resolvedLaborEntryId) {
    await recalcLaborPaid(resolvedLaborEntryId)
    await syncLaborPaidByClient(resolvedLaborEntryId)
  }

  await prisma.activityLog.create({
    data: {
      action: 'expense_added',
      entityType: 'expense',
      entityId: expense.id,
      details: `Expense of ₹${rest.amount} added (${rest.category})${vendorName ? ` to ${vendorName}` : ''}`,
      userId: session.user.id,
      projectId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function updateExpense(expenseId: string, projectId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = expenseSchema.safeParse({
    ...raw,
    isReimbursable: raw.isReimbursable === 'true',
    paidByClient: raw.paidByClient === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Get the old expense to check if laborEntryId changed
  const oldExpense = await prisma.expenseTransaction.findUnique({ where: { id: expenseId } })
  const oldLaborEntryId = oldExpense?.laborEntryId

  const { date, phaseId, vendorId, laborEntryId, contractorId, ...rest } = parsed.data

  let vendorName = rest.vendorName
  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (vendor) vendorName = vendor.name
  }

  // Auto-create or find a LaborEntry when category is labor/subcontractor and contractor is selected
  let resolvedLaborEntryId = laborEntryId || null
  const isLaborCategory = rest.category === 'labor' || rest.category === 'subcontractor'
  if (isLaborCategory && contractorId && !laborEntryId) {
    const existingEntry = await prisma.laborEntry.findFirst({
      where: { contractorId, projectId },
    })
    if (existingEntry) {
      resolvedLaborEntryId = existingEntry.id
    } else {
      const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } })
      const newEntry = await prisma.laborEntry.create({
        data: {
          tradeType: contractor?.trade || 'other',
          rateType: 'fixed',
          rateAmount: rest.amount,
          quantity: 1,
          totalAmount: rest.amount,
          advancePaid: 0,
          status: 'ongoing',
          contractorId,
          projectId,
        },
      })
      resolvedLaborEntryId = newEntry.id
    }
  }

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: {
      ...rest,
      vendorName: vendorName || null,
      date: new Date(date),
      phaseId: phaseId || null,
      vendorId: vendorId || null,
      laborEntryId: resolvedLaborEntryId,
    },
  })

  // Recalc labor paid for both old and new labor entries
  if (oldLaborEntryId) {
    await recalcLaborPaid(oldLaborEntryId)
    await syncLaborPaidByClient(oldLaborEntryId)
  }
  if (resolvedLaborEntryId && resolvedLaborEntryId !== oldLaborEntryId) {
    await recalcLaborPaid(resolvedLaborEntryId)
    await syncLaborPaidByClient(resolvedLaborEntryId)
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteExpense(expenseId: string, projectId: string) {
  await requireAuth()
  const expense = await prisma.expenseTransaction.findUnique({ where: { id: expenseId } })
  const laborEntryId = expense?.laborEntryId

  await prisma.expenseTransaction.delete({ where: { id: expenseId } })

  // Recalc labor paid if was linked
  if (laborEntryId) {
    await recalcLaborPaid(laborEntryId)
    await syncLaborPaidByClient(laborEntryId)
  }

  revalidatePath(`/projects/${projectId}`)
}

/** Recalculate advancePaid on a labor entry from linked expense payments */
async function recalcLaborPaid(laborEntryId: string) {
  const linkedExpenses = await prisma.expenseTransaction.findMany({
    where: { laborEntryId, approvalStatus: 'approved' },
    select: { amount: true },
  })
  const totalPaid = linkedExpenses.reduce((sum, e) => sum + e.amount, 0)
  await prisma.laborEntry.update({
    where: { id: laborEntryId },
    data: { advancePaid: totalPaid },
  })
}

/** Sync paidByClient on labor entry based on its linked expenses */
async function syncLaborPaidByClient(laborEntryId: string) {
  const linkedExpenses = await prisma.expenseTransaction.findMany({
    where: { laborEntryId },
    select: { paidByClient: true },
  })
  // If all linked expenses are paidByClient, mark labor entry as paidByClient too
  const allClientPaid = linkedExpenses.length > 0 && linkedExpenses.every(e => e.paidByClient)
  await prisma.laborEntry.update({
    where: { id: laborEntryId },
    data: { paidByClient: allClientPaid },
  })
}

// ─── Client-submitted expenses ──────────────────────────────

const clientExpenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  vendorName: z.string().optional(),
  vendorId: z.string().optional(),
  contractorId: z.string().optional(),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  taxAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

export async function submitClientExpense(projectId: string, _prev: any, formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const client = await prisma.client.findFirst({ where: { userId: session.user.id } })
  if (!client) return { error: 'Client not found' }

  // Verify client owns this project
  const project = await prisma.project.findFirst({ where: { id: projectId, clientId: client.id } })
  if (!project) return { error: 'Project not found' }

  const raw = Object.fromEntries(formData)
  const parsed = clientExpenseSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { date, vendorId, contractorId, ...rest } = parsed.data

  const expense = await prisma.expenseTransaction.create({
    data: {
      ...rest,
      date: new Date(date),
      projectId,
      paidByClient: true,
      approvalStatus: 'pending',
      submittedByClientId: client.id,
      ...(vendorId ? { vendorId } : {}),
    },
  })

  // Notify owner
  const owner = await prisma.user.findUnique({ where: { id: project.userId }, select: { phone: true, notificationChannel: true, telegramChatId: true } })
  await notifyExpensePendingApproval(
    { channel: (owner?.notificationChannel ?? 'none') as any, phone: owner?.phone, telegramChatId: owner?.telegramChatId },
    {
      clientName: client.name,
      projectName: project.name,
      amount: rest.amount,
      category: rest.category,
      expenseId: expense.id,
      notes: rest.notes || undefined,
    },
  )

  revalidatePath(`/portal/${projectId}`)
  return { success: true, message: 'Expense submitted for approval' }
}

// ─── Owner approval actions ─────────────────────────────────

export async function approveExpense(expenseId: string) {
  const session = await requireAuth()
  const expense = await prisma.expenseTransaction.findUnique({
    where: { id: expenseId },
    include: { project: { include: { client: true } } },
  })
  if (!expense || expense.project.userId !== session.user.id) return { error: 'Not found' }

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: { approvalStatus: 'approved' },
  })

  if (expense.laborEntryId) await recalcLaborPaid(expense.laborEntryId)

  // Notify client
  const client = expense.project.client
  await notifyExpenseApprovalStatus(
    { channel: (client?.notificationChannel ?? 'none') as any, phone: client?.phone, telegramChatId: client?.telegramChatId },
    {
      projectName: expense.project.name,
      amount: expense.amount,
      category: expense.category,
      status: 'approved',
    },
  )

  revalidatePath(`/projects/${expense.projectId}`)
  return { success: true }
}

export async function rejectExpense(expenseId: string) {
  const session = await requireAuth()
  const expense = await prisma.expenseTransaction.findUnique({
    where: { id: expenseId },
    include: { project: { include: { client: true } } },
  })
  if (!expense || expense.project.userId !== session.user.id) return { error: 'Not found' }

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: { approvalStatus: 'rejected' },
  })

  if (expense.laborEntryId) await recalcLaborPaid(expense.laborEntryId)

  // Notify client
  const rejClient = expense.project.client
  await notifyExpenseApprovalStatus(
    { channel: (rejClient?.notificationChannel ?? 'none') as any, phone: rejClient?.phone, telegramChatId: rejClient?.telegramChatId },
    {
      projectName: expense.project.name,
      amount: expense.amount,
      category: expense.category,
      status: 'rejected',
    },
  )

  revalidatePath(`/projects/${expense.projectId}`)
  return { success: true }
}
