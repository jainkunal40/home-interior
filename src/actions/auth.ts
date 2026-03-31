'use server'

import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { signupSchema, loginSchema } from '@/lib/validations'
import { redirect } from 'next/navigation'

export async function signupAction(_prev: any, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, passwordHash } })

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch {
    // Auth may throw on redirect
  }
  redirect('/dashboard')
}

export async function loginAction(_prev: any, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Look up user to determine role for redirect
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch {
    return { error: 'Invalid email or password' }
  }
  redirect(user?.role === 'client' ? '/portal' : '/dashboard')
}
