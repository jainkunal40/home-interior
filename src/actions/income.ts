'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { incomeSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createIncome(projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = incomeSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Verify project ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return { error: 'Project not found' }

  const { date, phaseId, ...rest } = parsed.data
  await prisma.incomeTransaction.create({
    data: {
      ...rest,
      date: new Date(date),
      phaseId: phaseId || null,
      projectId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'payment_received',
      entityType: 'income',
      entityId: projectId,
      details: `Income of ₹${rest.amount} recorded`,
      userId: session.user.id,
      projectId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function updateIncome(incomeId: string, projectId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = incomeSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { date, phaseId, ...rest } = parsed.data
  await prisma.incomeTransaction.update({
    where: { id: incomeId },
    data: { ...rest, date: new Date(date), phaseId: phaseId || null },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteIncome(incomeId: string, projectId: string) {
  await requireAuth()
  await prisma.incomeTransaction.delete({ where: { id: incomeId } })
  revalidatePath(`/projects/${projectId}`)
}
