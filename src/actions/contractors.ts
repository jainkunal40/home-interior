'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const contractorSchema = z.object({
  name: z.string().min(1, 'Contractor name is required'),
  phone: z.string().optional(),
  trade: z.string().min(1, 'Trade is required'),
  notes: z.string().optional(),
})

export async function getContractors() {
  await requireAuth()
  return prisma.contractor.findMany({
    orderBy: { name: 'asc' },
    include: {
      laborEntries: {
        select: { id: true, totalAmount: true, advancePaid: true, status: true, project: { select: { name: true } } },
      },
      projects: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function getAllContractorsSimple() {
  await requireAuth()
  return prisma.contractor.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, trade: true },
  })
}

export async function createContractor(_prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = contractorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const contractor = await prisma.contractor.create({ data: parsed.data })
  revalidatePath('/contractors')
  return { success: true, contractorId: contractor.id }
}

export async function updateContractor(contractorId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = contractorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.contractor.update({ where: { id: contractorId }, data: parsed.data })
  revalidatePath('/contractors')
  return { success: true }
}

export async function deleteContractor(contractorId: string) {
  await requireAuth()
  await prisma.contractor.delete({ where: { id: contractorId } })
  revalidatePath('/contractors')
}

export async function assignContractorToProject(contractorId: string, projectId: string) {
  await requireAuth()
  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId, contractorId } },
    create: { projectId, contractorId },
    update: {},
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/contractors')
}

export async function removeContractorFromProject(contractorId: string, projectId: string) {
  await requireAuth()
  await prisma.projectContractor.deleteMany({
    where: { projectId, contractorId },
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/contractors')
}
