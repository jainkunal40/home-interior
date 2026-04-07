'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { milestoneSchema, noteSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { notifyMilestoneCompleted } from '@/lib/notifications'

export async function createMilestone(projectId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = milestoneSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { dueDate, completionDate, phaseId, ...rest } = parsed.data
  await prisma.milestone.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
      phaseId: phaseId || null,
      projectId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function updateMilestone(milestoneId: string, projectId: string, _prev: any, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = milestoneSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Fetch old status to detect completion
  const oldMilestone = await prisma.milestone.findUnique({ where: { id: milestoneId } })

  const { dueDate, completionDate, phaseId, ...rest } = parsed.data
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
      phaseId: phaseId || null,
    },
  })

  // Notify client if milestone just became completed
  if (rest.status === 'completed' && oldMilestone?.status !== 'completed') {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    })
    if (project?.client) {
      await notifyMilestoneCompleted(
        { channel: (project.client.notificationChannel ?? 'none') as any, phone: project.client.phone, telegramChatId: project.client.telegramChatId },
        {
          projectName: project.name,
          milestoneTitle: rest.title,
        },
      )
    }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteMilestone(milestoneId: string, projectId: string) {
  await requireAuth()
  await prisma.milestone.delete({ where: { id: milestoneId } })
  revalidatePath(`/projects/${projectId}`)
}

export async function createNote(projectId: string, formData: FormData) {
  await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = noteSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.note.create({
    data: { content: parsed.data.content, projectId },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteNote(noteId: string, projectId: string) {
  await requireAuth()
  await prisma.note.delete({ where: { id: noteId } })
  revalidatePath(`/projects/${projectId}`)
}

export async function updateNote(noteId: string, projectId: string, content: string) {
  await requireAuth()
  if (!content.trim()) return { error: 'Note content cannot be empty' }
  await prisma.note.update({ where: { id: noteId }, data: { content: content.trim() } })
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
