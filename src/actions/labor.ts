'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { laborSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createLabor(projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = laborSchema.safeParse({
    ...raw,
    paidByClient: raw.paidByClient === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return { error: 'Project not found' }

  const { contractorName, startDate, endDate, phaseId, contractorId, ...rest } = parsed.data

  // Find or create contractor
  let cId = contractorId
  if (!cId) {
    const contractor = await prisma.contractor.create({
      data: { name: contractorName, trade: rest.tradeType },
    })
    cId = contractor.id
  }

  const totalAmount = rest.rateType === 'fixed' ? rest.rateAmount : rest.rateAmount * rest.quantity

  await prisma.laborEntry.create({
    data: {
      ...rest,
      totalAmount,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      phaseId: phaseId || null,
      contractorId: cId,
      projectId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'labor_added',
      entityType: 'labor',
      entityId: projectId,
      details: `Labor entry for ${contractorName} (₹${totalAmount})`,
      userId: session.user.id,
      projectId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function updateLabor(laborId: string, projectId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = laborSchema.safeParse({
    ...raw,
    paidByClient: raw.paidByClient === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { contractorName, startDate, endDate, phaseId, contractorId, ...rest } = parsed.data
  const totalAmount = rest.rateType === 'fixed' ? rest.rateAmount : rest.rateAmount * rest.quantity

  await prisma.laborEntry.update({
    where: { id: laborId },
    data: {
      ...rest,
      totalAmount,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      phaseId: phaseId || null,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteLabor(laborId: string, projectId: string) {
  await requireAuth()
  await prisma.laborEntry.delete({ where: { id: laborId } })
  revalidatePath(`/projects/${projectId}`)
}
