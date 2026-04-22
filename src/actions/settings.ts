'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  notificationChannel: z.enum(['none', 'whatsapp', 'telegram']).default('none'),
  telegramChatId: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export async function updateProfile(_prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Check email uniqueness
  const existing = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: session.user.id } },
  })
  if (existing) return { error: 'Email already in use by another account' }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      notificationChannel: parsed.data.notificationChannel,
      telegramChatId: parsed.data.telegramChatId || null,
    },
  })

  revalidatePath('/settings')
  return { success: true, message: 'Profile updated successfully' }
}

export async function changePassword(_prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = passwordSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: 'User not found' }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!isValid) return { error: 'Current password is incorrect' }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  })

  return { success: true, message: 'Password changed successfully' }
}

export async function resetClientPassword(_prev: any, formData: FormData) {
  const session = await requireAuth()
  // Only owners can reset client passwords
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role === 'client') return { error: 'Unauthorized' }

  const clientId = formData.get('clientId') as string
  if (!clientId) return { error: 'Client ID is required' }

  const client = await prisma.client.findUnique({ where: { id: clientId }, include: { user: true } })
  if (!client?.userId) return { error: 'Client has no portal account' }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let newPassword = ''
  for (let i = 0; i < 8; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length))

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: client.userId }, data: { passwordHash } })
  await prisma.client.update({ where: { id: clientId }, data: { portalPassword: newPassword } })

  revalidatePath('/projects')
  return { success: true, newPassword, email: client.email }
}

export async function getUserProfile() {
  const session = await requireAuth()
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, notificationChannel: true, telegramChatId: true, role: true, createdAt: true },
  })
}

// ─── User Preferences ────────────────────────────────────────

/**
 * Fetch all preferences for the current user as a plain object.
 * Safe to call from unauthenticated routes — returns {} if not logged in.
 */
export async function getPreferences(): Promise<Record<string, string>> {
  try {
    const session = await requireAuth()
    const rows = await prisma.userPreference.findMany({ where: { userId: session.user.id } })
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  } catch {
    return {}
  }
}

/**
 * Upsert a single preference key/value for the current user.
 */
export async function setPreference(key: string, value: string) {
  const session = await requireAuth()
  await prisma.userPreference.upsert({
    where: { userId_key: { userId: session.user.id, key } },
    update: { value },
    create: { userId: session.user.id, key, value },
  })
}
