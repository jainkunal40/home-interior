'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { expenseSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createExpense(projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = expenseSchema.safeParse({
    ...raw,
    isReimbursable: raw.isReimbursable === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return { error: 'Project not found' }

  const { date, phaseId, vendorId, laborEntryId, ...rest } = parsed.data

  // If vendorId is provided, auto-fill vendorName from vendor record
  let vendorName = rest.vendorName
  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (vendor) vendorName = vendor.name
  }

  const expense = await prisma.expenseTransaction.create({
    data: {
      ...rest,
      vendorName: vendorName || null,
      date: new Date(date),
      phaseId: phaseId || null,
      vendorId: vendorId || null,
      laborEntryId: laborEntryId || null,
      projectId,
    },
  })

  // If linked to a labor entry, update the labor entry's advancePaid
  if (laborEntryId) {
    await recalcLaborPaid(laborEntryId)
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
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Get the old expense to check if laborEntryId changed
  const oldExpense = await prisma.expenseTransaction.findUnique({ where: { id: expenseId } })
  const oldLaborEntryId = oldExpense?.laborEntryId

  const { date, phaseId, vendorId, laborEntryId, ...rest } = parsed.data

  let vendorName = rest.vendorName
  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (vendor) vendorName = vendor.name
  }

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: {
      ...rest,
      vendorName: vendorName || null,
      date: new Date(date),
      phaseId: phaseId || null,
      vendorId: vendorId || null,
      laborEntryId: laborEntryId || null,
    },
  })

  // Recalc labor paid for both old and new labor entries
  if (oldLaborEntryId) await recalcLaborPaid(oldLaborEntryId)
  if (laborEntryId && laborEntryId !== oldLaborEntryId) await recalcLaborPaid(laborEntryId)

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteExpense(expenseId: string, projectId: string) {
  await requireAuth()
  const expense = await prisma.expenseTransaction.findUnique({ where: { id: expenseId } })
  const laborEntryId = expense?.laborEntryId

  await prisma.expenseTransaction.delete({ where: { id: expenseId } })

  // Recalc labor paid if was linked
  if (laborEntryId) await recalcLaborPaid(laborEntryId)

  revalidatePath(`/projects/${projectId}`)
}

/** Recalculate advancePaid on a labor entry from linked expense payments */
async function recalcLaborPaid(laborEntryId: string) {
  const linkedExpenses = await prisma.expenseTransaction.findMany({
    where: { laborEntryId },
    select: { amount: true },
  })
  const totalPaid = linkedExpenses.reduce((sum, e) => sum + e.amount, 0)
  await prisma.laborEntry.update({
    where: { id: laborEntryId },
    data: { advancePaid: totalPaid },
  })
}
