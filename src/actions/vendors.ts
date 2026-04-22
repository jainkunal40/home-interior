'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
})

export async function getVendors() {
  await requireAuth()
  return prisma.vendor.findMany({
    orderBy: { name: 'asc' },
    include: {
      projects: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function getAllVendorsSimple() {
  await requireAuth()
  return prisma.vendor.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true },
  })
}

export async function getVendorAnalytics() {
  const session = await requireAuth()
  // Aggregate spend per vendor across all user's projects
  const results = await prisma.expenseTransaction.groupBy({
    by: ['vendorId', 'vendorName'],
    where: {
      project: { userId: session.user.id },
      approvalStatus: { not: 'rejected' },
      vendorId: { not: null },
    },
    _sum: { amount: true, taxAmount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  })

  // Enrich with vendor name from DB for tracked vendors
  const vendorIds = results.map(r => r.vendorId).filter(Boolean) as string[]
  const vendors = vendorIds.length > 0
    ? await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true, category: true } })
    : []
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]))

  return results.map(r => ({
    vendorId: r.vendorId,
    name: r.vendorId ? (vendorMap[r.vendorId]?.name ?? r.vendorName ?? 'Unknown') : (r.vendorName ?? 'Unknown'),
    category: r.vendorId ? (vendorMap[r.vendorId]?.category ?? null) : null,
    totalSpend: (r._sum.amount ?? 0) + (r._sum.taxAmount ?? 0),
    txCount: r._count.id,
  }))
}

export async function createVendor(_prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = vendorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const vendor = await prisma.vendor.create({ data: parsed.data })
  revalidatePath('/vendors')
  return { success: true, vendorId: vendor.id }
}

export async function updateVendor(vendorId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = vendorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.vendor.update({ where: { id: vendorId }, data: parsed.data })
  revalidatePath('/vendors')
  return { success: true }
}

export async function deleteVendor(vendorId: string) {
  await requireAuth()
  await prisma.vendor.delete({ where: { id: vendorId } })
  revalidatePath('/vendors')
}

export async function assignVendorToProject(vendorId: string, projectId: string) {
  await requireAuth()
  await prisma.projectVendor.upsert({
    where: { projectId_vendorId: { projectId, vendorId } },
    create: { projectId, vendorId },
    update: {},
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/vendors')
}

export async function removeVendorFromProject(vendorId: string, projectId: string) {
  await requireAuth()
  await prisma.projectVendor.deleteMany({
    where: { projectId, vendorId },
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/vendors')
}
