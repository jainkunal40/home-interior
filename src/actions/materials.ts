'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const materialSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().default('materials'),
  vendorName: z.string().optional(),
  vendorId: z.string().optional(),
  billNumber: z.string().optional(),
  billDate: z.string().optional(),
  billAmount: z.coerce.number().min(0, 'Bill amount must be 0 or more'),
  paidByClient: z.string().optional(), // checkbox sends 'on' when checked
  phaseId: z.string().optional(),
  notes: z.string().optional(),
})

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  paymentMode: z.string().default('cash'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

async function verifyProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } })
  if (!project) throw new Error('Project not found')
  return project
}

export async function createMaterial(projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  await verifyProject(projectId, session.user.id)

  const raw = Object.fromEntries(formData)
  const parsed = materialSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { billDate, vendorId, phaseId, paidByClient, ...rest } = parsed.data

  const entry = await prisma.materialEntry.create({
    data: {
      ...rest,
      billDate: billDate ? new Date(billDate) : null,
      vendorId: vendorId || null,
      phaseId: phaseId || null,
      paidByClient: paidByClient === 'on',
      projectId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'created',
      entityType: 'material',
      entityId: entry.id,
      details: `Material entry added: ${rest.description} (Bill: ₹${rest.billAmount})`,
      userId: session.user.id,
      projectId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
  return { success: true }
}

export async function updateMaterial(materialId: string, projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  await verifyProject(projectId, session.user.id)

  const raw = Object.fromEntries(formData)
  const parsed = materialSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { billDate, vendorId, phaseId, paidByClient, ...rest } = parsed.data

  await prisma.materialEntry.updateMany({
    where: { id: materialId, projectId },
    data: {
      ...rest,
      billDate: billDate ? new Date(billDate) : null,
      vendorId: vendorId || null,
      phaseId: phaseId || null,
      paidByClient: paidByClient === 'on',
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
  return { success: true }
}

export async function deleteMaterial(materialId: string, projectId: string) {
  const session = await requireAuth()
  await verifyProject(projectId, session.user.id)

  await prisma.materialEntry.deleteMany({ where: { id: materialId, projectId } })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
  return { success: true }
}

export async function addMaterialPayment(materialId: string, projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  await verifyProject(projectId, session.user.id)

  // Verify the material belongs to this project
  const entry = await prisma.materialEntry.findFirst({ where: { id: materialId, projectId } })
  if (!entry) return { error: 'Material entry not found' }

  const raw = Object.fromEntries(formData)
  const parsed = paymentSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { date, referenceNumber, ...rest } = parsed.data

  await prisma.materialPayment.create({
    data: {
      ...rest,
      date: new Date(date),
      referenceNumber: referenceNumber || null,
      materialEntryId: materialId,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'payment_received',
      entityType: 'material',
      entityId: materialId,
      details: `Payment of ₹${rest.amount} recorded for "${entry.description}"`,
      userId: session.user.id,
      projectId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
  return { success: true }
}

export async function updateMaterialEntryPayment(materialId: string, paymentId: string, projectId: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  await verifyProject(projectId, session.user.id)

  const payment = await prisma.materialPayment.findFirst({
    where: { id: paymentId, materialEntry: { id: materialId, projectId } },
    include: { materialEntry: true },
  })
  if (!payment) return { error: 'Material payment not found' }

  const raw = Object.fromEntries(formData)
  const materialParsed = materialSchema.safeParse({
    ...raw,
    notes: raw.materialNotes,
  })
  if (!materialParsed.success) return { error: materialParsed.error.issues[0].message }

  const paymentParsed = paymentSchema.safeParse({
    ...raw,
    notes: raw.paymentNotes,
  })
  if (!paymentParsed.success) return { error: paymentParsed.error.issues[0].message }

  const { billDate, vendorId, phaseId, paidByClient, ...materialData } = materialParsed.data
  const { date, referenceNumber, ...paymentData } = paymentParsed.data

  const otherPayments = await prisma.materialPayment.findMany({
    where: { materialEntryId: materialId, id: { not: paymentId } },
    select: { amount: true },
  })
  const otherPaid = otherPayments.reduce((sum, p) => sum + p.amount, 0)
  if (materialData.billAmount < otherPaid + paymentData.amount) {
    return { error: 'Bill amount cannot be less than recorded payments' }
  }

  await prisma.materialEntry.update({
    where: { id: materialId },
    data: {
      ...materialData,
      billDate: billDate ? new Date(billDate) : null,
      vendorId: vendorId || null,
      phaseId: phaseId || null,
      paidByClient: paidByClient === 'on',
    },
  })

  await prisma.materialPayment.update({
    where: { id: paymentId },
    data: {
      ...paymentData,
      date: new Date(date),
      referenceNumber: referenceNumber || null,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
  return { success: true }
}

export async function deleteMaterialPayment(paymentId: string, projectId: string) {
  const session = await requireAuth()
  await verifyProject(projectId, session.user.id)

  await prisma.materialPayment.delete({ where: { id: paymentId } })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/portal`)
  revalidatePath(`/portal/${projectId}`)
  return { success: true }
}
