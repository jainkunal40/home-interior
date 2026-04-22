import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyMilestoneReminder } from '@/lib/notifications'
import { format, addDays, startOfDay, endOfDay } from 'date-fns'

/**
 * Cron route for payment reminders.
 * Call daily via Vercel Cron (vercel.json) or any external ping service.
 *
 * Secured with CRON_SECRET env variable.
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify secret to prevent public abuse
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = addDays(new Date(), 1)
  const from = startOfDay(tomorrow)
  const to = endOfDay(tomorrow)

  // Find all non-completed milestones due tomorrow that belong to projects with clients
  const milestones = await prisma.milestone.findMany({
    where: {
      status: { not: 'completed' },
      dueDate: { gte: from, lte: to },
      project: {
        client: {
          notificationChannel: { not: 'none' },
        },
      },
    },
    include: {
      project: {
        include: {
          client: { select: { name: true, phone: true, notificationChannel: true, telegramChatId: true } },
        },
      },
    },
  })

  let sent = 0
  const errors: string[] = []

  for (const m of milestones) {
    const client = m.project.client
    if (!client) continue
    try {
      await notifyMilestoneReminder(
        {
          channel: client.notificationChannel as any,
          phone: client.phone,
          telegramChatId: client.telegramChatId,
        },
        {
          projectName: m.project.name,
          milestoneTitle: m.title,
          dueDate: format(new Date(m.dueDate!), 'dd MMM yyyy'),
        },
      )
      sent++
    } catch (e: any) {
      errors.push(`${m.id}: ${e?.message ?? 'unknown error'}`)
    }
  }

  return NextResponse.json({
    ok: true,
    checked: milestones.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
