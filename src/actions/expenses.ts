'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { expenseSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { notifyExpensePendingApproval, notifyExpenseApprovalStatus } from '@/lib/notifications'
import { isCountedExpense } from '@/lib/finance'

const MATERIAL_CATEGORY_SET = new Set(['materials', 'hardware', 'furnishing'])

export async function createExpense(projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = expenseSchema.safeParse({
    ...raw,
    isReimbursable: raw.isReimbursable === 'true',
    paidByClient: raw.paidByClient === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  if (MATERIAL_CATEGORY_SET.has(parsed.data.category)) {
    return { error: 'Material expenses are managed in the Materials tab' }
  }

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return { error: 'Project not found' }

  const {
    date,
    phaseId,
    vendorId,
    laborEntryId,
    contractorId,
    ...rest
  } = parsed.data

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

  // If linked to a labor entry, add this expense to its paid amount and sync paidByClient
  if (resolvedLaborEntryId) {
    await adjustLaborPaid(resolvedLaborEntryId, isCountedExpense(expense) ? expense.amount : 0)
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
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
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

  // Get the old expense to check category changes and labor linkage
  const oldExpense = await prisma.expenseTransaction.findUnique({ where: { id: expenseId } })
  if (!oldExpense) return { error: 'Expense not found' }
  const oldLaborEntryId = oldExpense.laborEntryId

  // Legacy material-category expenses stay in the Materials workflow, but
  // remain editable there. New material expenses must use a MaterialEntry.
  const isMaterialCategory = MATERIAL_CATEGORY_SET.has(parsed.data.category)
  const wasMaterialCategory = MATERIAL_CATEGORY_SET.has(oldExpense.category)
  if (isMaterialCategory !== wasMaterialCategory) {
    return {
      error: isMaterialCategory
        ? 'Material expenses are managed in the Materials tab'
        : 'Material expenses must stay in the Materials tab',
    }
  }

  const {
    date,
    phaseId,
    vendorId,
    laborEntryId,
    contractorId,
    ...rest
  } = parsed.data

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

  const updatedExpense = await prisma.expenseTransaction.update({
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

  // Move only the delta this expense contributes, so hand-entered advances survive
  const oldContribution = isCountedExpense(oldExpense) ? oldExpense.amount : 0
  const newContribution = isCountedExpense(updatedExpense) ? updatedExpense.amount : 0

  if (oldLaborEntryId && oldLaborEntryId === resolvedLaborEntryId) {
    await adjustLaborPaid(oldLaborEntryId, newContribution - oldContribution)
  } else {
    if (oldLaborEntryId) await adjustLaborPaid(oldLaborEntryId, -oldContribution)
    if (resolvedLaborEntryId) await adjustLaborPaid(resolvedLaborEntryId, newContribution)
  }

  for (const laborEntryId of new Set(
    [oldLaborEntryId, resolvedLaborEntryId].filter((id): id is string => !!id)
  )) {
    await syncLaborPaidByClient(laborEntryId)
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteExpense(expenseId: string, projectId: string) {
  await requireAuth()
  const expense = await prisma.expenseTransaction.findUnique({ where: { id: expenseId } })
  const laborEntryId = expense?.laborEntryId

  await prisma.expenseTransaction.delete({ where: { id: expenseId } })

  // Remove only what this expense contributed; hand-entered advances stay intact
  if (laborEntryId) {
    await adjustLaborPaid(laborEntryId, expense && isCountedExpense(expense) ? -expense.amount : 0)
    await syncLaborPaidByClient(laborEntryId)
  }

  revalidatePath(`/projects/${projectId}`)
}

/**
 * Adjust a labor entry's advancePaid by a delta instead of recomputing it from
 * linked expenses. Recomputing used to overwrite advances the owner recorded by
 * hand (entries with no linked expense rows), silently losing money.
 * Never drops below zero, since a negative advance is meaningless.
 */
async function adjustLaborPaid(laborEntryId: string, delta: number) {
  if (!laborEntryId || !Number.isFinite(delta) || delta === 0) return
  const entry = await prisma.laborEntry.findUnique({
    where: { id: laborEntryId },
    select: { advancePaid: true },
  })
  if (!entry) return
  await prisma.laborEntry.update({
    where: { id: laborEntryId },
    data: { advancePaid: Math.max(0, entry.advancePaid + delta) },
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
  category: z.string().trim().min(1, 'Category is required'),
  vendorName: z.string().trim().optional(),
  vendorId: z.string().trim().optional(),
  contractorId: z.string().trim().optional(),
  paymentMode: z.string().trim().min(1, 'Payment mode is required'),
  taxAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().optional(),
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
  const owner = await prisma.user.findUnique({ where: { id: project.userId }, select: { phone: true, notificationChannel: true, telegramChatId: true, id: true } })
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

  if (owner) {
    await prisma.activityLog.create({
      data: {
        action: 'expense_submitted',
        entityType: 'expense',
        entityId: expense.id,
        details: `Client ${client.name} submitted expense of ₹${rest.amount.toLocaleString('en-IN')} (${rest.category}) for approval`,
        userId: owner.id,
        projectId,
      },
    })
  }

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

  const wasCounted = isCountedExpense(expense)

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: { approvalStatus: 'approved' },
  })

  // Only add the amount once — re-approving an approved expense must not double count
  if (expense.laborEntryId) {
    if (!wasCounted) await adjustLaborPaid(expense.laborEntryId, expense.amount)
    await syncLaborPaidByClient(expense.laborEntryId)
  }

  await prisma.activityLog.create({
    data: {
      action: 'expense_approved',
      entityType: 'expense',
      entityId: expenseId,
      details: `Expense of ₹${expense.amount.toLocaleString('en-IN')} (${expense.category}) approved`,
      userId: session.user.id,
      projectId: expense.projectId,
    },
  })

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

  const wasCounted = isCountedExpense(expense)

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: { approvalStatus: 'rejected' },
  })

  // Only remove the amount if it was actually counted before
  if (expense.laborEntryId) {
    if (wasCounted) await adjustLaborPaid(expense.laborEntryId, -expense.amount)
    await syncLaborPaidByClient(expense.laborEntryId)
  }

  await prisma.activityLog.create({
    data: {
      action: 'expense_rejected',
      entityType: 'expense',
      entityId: expenseId,
      details: `Expense of ₹${expense.amount.toLocaleString('en-IN')} (${expense.category}) rejected`,
      userId: session.user.id,
      projectId: expense.projectId,
    },
  })

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
