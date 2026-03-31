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
  return prisma.vendor.findMany({ orderBy: { name: 'asc' } })
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
