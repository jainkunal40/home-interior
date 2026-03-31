'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { projectSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

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
      expenseTransactions: { select: { amount: true, taxAmount: true } },
      laborEntries: { select: { totalAmount: true } },
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
    },
  })
}

export async function createProject(_prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { clientName, clientPhone, clientEmail, startDate, endDate, ...projectData } = parsed.data

  let clientId: string | undefined
  if (clientName) {
    const client = await prisma.client.create({
      data: { name: clientName, phone: clientPhone || null, email: clientEmail || null },
    })
    clientId = client.id
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
  return { success: true, projectId: project.id }
}

export async function updateProject(id: string, _prev: any, formData: FormData) {
  const session = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { clientName, clientPhone, clientEmail, startDate, endDate, ...projectData } = parsed.data

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id }, include: { client: true } })
  if (!project) return { error: 'Project not found' }

  if (clientName) {
    if (project.clientId) {
      await prisma.client.update({
        where: { id: project.clientId },
        data: { name: clientName, phone: clientPhone || null, email: clientEmail || null },
      })
    } else {
      const client = await prisma.client.create({
        data: { name: clientName, phone: clientPhone || null, email: clientEmail || null },
      })
      await prisma.project.update({ where: { id }, data: { clientId: client.id } })
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
  return { success: true }
}

export async function deleteProject(id: string) {
  const session = await requireAuth()
  await prisma.project.deleteMany({ where: { id, userId: session.user.id } })
  revalidatePath('/dashboard')
}
