'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { projectSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

function generatePassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function ensureClientUser(clientId: string, email: string, name: string): Promise<{ password?: string }> {
  const existing = await prisma.client.findUnique({ where: { id: clientId }, include: { user: true } })
  if (existing?.userId) return {} // already linked

  // Check if a user with this email exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    await prisma.client.update({ where: { id: clientId }, data: { userId: existingUser.id } })
    return {}
  }

  // Create a new user for the client
  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'client' },
  })
  await prisma.client.update({ where: { id: clientId }, data: { userId: user.id, portalPassword: password } })
  return { password }
}

export async function getProjects(search?: string, status?: string) {
  const session = await requireAuth()
  const where: any = { userId: session.user.id }
  if (status && status !== 'all') where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { client: { name: { contains: search } } },
      { siteAddress: { contains: search } },
    ]
  }

  return prisma.project.findMany({
    where,
    include: {
      client: true,
      incomeTransactions: { select: { amount: true } },
      expenseTransactions: { select: { amount: true, taxAmount: true, paidByClient: true, laborEntryId: true, approvalStatus: true } },
      laborEntries: { select: { totalAmount: true, paidByClient: true } },
      _count: { select: { milestones: true, attachments: true, notes: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getProject(id: string) {
  const session = await requireAuth()
  return prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      client: true,
      phases: { orderBy: { sortOrder: 'asc' } },
      incomeTransactions: { orderBy: { date: 'desc' } },
      expenseTransactions: {
        orderBy: { date: 'desc' },
        include: { vendor: true, laborEntry: { include: { contractor: true } } },
      },
      laborEntries: {
        orderBy: { createdAt: 'desc' },
        include: { contractor: true, payments: { select: { id: true, amount: true, date: true } } },
      },
      milestones: { orderBy: { dueDate: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      projectVendors: { include: { vendor: true } },
      projectContractors: { include: { contractor: true } },
    },
  })
}

export async function createProject(_prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { clientName, clientPhone, clientEmail, clientNotificationChannel, clientTelegramChatId, startDate, endDate, ...projectData } = parsed.data

  let clientId: string | undefined
  let clientPassword: string | undefined
  if (clientName) {
    const client = await prisma.client.create({
      data: {
        name: clientName,
        phone: clientPhone || null,
        email: clientEmail || null,
        notificationChannel: clientNotificationChannel || 'none',
        telegramChatId: clientTelegramChatId || null,
      },
    })
    clientId = client.id

    // Auto-create login for client if email is provided
    if (clientEmail) {
      const result = await ensureClientUser(client.id, clientEmail, clientName)
      clientPassword = result.password
    }
  }

  const project = await prisma.project.create({
    data: {
      ...projectData,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      userId: session.user.id,
      clientId: clientId || null,
    },
  })

  // Create default phases
  const defaultPhases = [
    'Design', 'Demolition', 'Civil', 'Electrical', 'Plumbing',
    'Carpentry', 'Painting', 'Furnishing', 'Handover',
  ]
  await prisma.projectPhase.createMany({
    data: defaultPhases.map((name, i) => ({
      name,
      sortOrder: i,
      projectId: project.id,
    })),
  })

  await prisma.activityLog.create({
    data: {
      action: 'created',
      entityType: 'project',
      entityId: project.id,
      details: `Created project "${project.name}"`,
      userId: session.user.id,
      projectId: project.id,
    },
  })

  revalidatePath('/dashboard')
  return { success: true, projectId: project.id, clientPassword, clientEmail: clientEmail || undefined }
}

export async function updateProject(id: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { clientName, clientPhone, clientEmail, clientNotificationChannel, clientTelegramChatId, startDate, endDate, ...projectData } = parsed.data

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id }, include: { client: true } })
  if (!project) return { error: 'Project not found' }

  let clientPassword: string | undefined
  if (clientName) {
    if (project.clientId) {
      await prisma.client.update({
        where: { id: project.clientId },
        data: {
          name: clientName,
          phone: clientPhone || null,
          email: clientEmail || null,
          notificationChannel: clientNotificationChannel || 'none',
          telegramChatId: clientTelegramChatId || null,
        },
      })
      // Ensure client has a login if email provided
      if (clientEmail) {
        const result = await ensureClientUser(project.clientId, clientEmail, clientName)
        clientPassword = result.password
      }
    } else {
      const client = await prisma.client.create({
        data: { name: clientName, phone: clientPhone || null, email: clientEmail || null },
      })
      await prisma.project.update({ where: { id }, data: { clientId: client.id } })
      if (clientEmail) {
        const result = await ensureClientUser(client.id, clientEmail, clientName)
        clientPassword = result.password
      }
    }
  }

  await prisma.project.update({
    where: { id },
    data: {
      ...projectData,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  })

  revalidatePath(`/projects/${id}`)
  revalidatePath('/dashboard')
  return { success: true, clientPassword, clientEmail: clientEmail || undefined }
}

export async function deleteProject(id: string) {
  const session = await requireAuth()
  await prisma.project.deleteMany({ where: { id, userId: session.user.id } })
  revalidatePath('/dashboard')
}

export async function duplicateProject(id: string) {
  const session = await requireAuth()
  const source = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      phases: { orderBy: { sortOrder: 'asc' } },
      milestones: true,
    },
  })
  if (!source) return { error: 'Project not found' }

  const newProject = await prisma.project.create({
    data: {
      name: `${source.name} (Copy)`,
      description: source.description,
      siteAddress: source.siteAddress,
      status: 'planning',
      budget: source.budget,
      clientManagedExpenses: source.clientManagedExpenses,
      userId: session.user.id,
    },
  })

  // Copy phases
  if (source.phases.length > 0) {
    await prisma.projectPhase.createMany({
      data: source.phases.map(p => ({
        name: p.name,
        status: 'pending',
        sortOrder: p.sortOrder,
        projectId: newProject.id,
      })),
    })
  }

  // Copy milestones (without dates/completion)
  if (source.milestones.length > 0) {
    await prisma.milestone.createMany({
      data: source.milestones.map(m => ({
        title: m.title,
        description: m.description,
        status: 'pending',
        projectId: newProject.id,
      })),
    })
  }

  await prisma.activityLog.create({
    data: {
      action: 'created',
      entityType: 'project',
      entityId: newProject.id,
      details: `Project duplicated from "${source.name}"`,
      userId: session.user.id,
      projectId: newProject.id,
    },
  })

  revalidatePath('/dashboard')
  return { success: true, id: newProject.id }
}

export async function updatePhase(phaseId: string, projectId: string, status: string) {
  const session = await requireAuth()
  const phase = await prisma.projectPhase.findFirst({
    where: { id: phaseId, project: { userId: session.user.id } },
  })
  if (!phase) return { error: 'Phase not found' }

  await prisma.projectPhase.update({
    where: { id: phaseId },
    data: { status },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function getActivityLogs(projectId: string) {
  const session = await requireAuth()
  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return []

  return prisma.activityLog.findMany({
    where: { projectId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}
