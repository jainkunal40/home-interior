/**
 * Bot command processor for two-way Telegram and WhatsApp interactions.
 *
 * Owner can send commands to the bot to manage their projects without
 * opening the web app:
 *
 *   pending           — list all pending expenses (with 6-char codes)
 *   approve <code>    — approve an expense by 6-char code
 *   reject <code>     — reject an expense by 6-char code
 *   balance           — project income & P&L summary
 *   projects          — list all projects with status
 *   help              — show available commands
 *
 * For Telegram, pending expense notifications also include inline
 * ✅ Approve / ❌ Reject buttons for one-tap approval.
 */

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { notifyExpenseApprovalStatus } from './notifications'

function fmt(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

// ─── Owner lookup ──────────────────────────────────────────────────────────────

/** Find an owner User by Telegram chat ID */
export async function getOwnerByTelegramChatId(chatId: string) {
  return prisma.user.findFirst({ where: { telegramChatId: chatId } })
}

/** Find an owner User by phone number (handles various formats) */
export async function getOwnerByPhone(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  const candidates = [rawPhone, `+${digits}`, digits, `+91${last10}`, last10]
  for (const candidate of candidates) {
    const user = await prisma.user.findFirst({ where: { phone: candidate } })
    if (user) return user
  }
  return null
}

// ─── Core actions ──────────────────────────────────────────────────────────────

/** Get pending expenses for an owner (up to 10) */
export async function getPendingExpenses(userId: string) {
  return prisma.expenseTransaction.findMany({
    where: { project: { userId }, approvalStatus: 'pending' },
    include: {
      project: { select: { id: true, name: true } },
      submittedByClient: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })
}

/**
 * Approve an expense by full ID.
 * Handles labor recalculation and client notification.
 * Safe: verifies the expense belongs to the given owner.
 */
export async function performApprove(expenseId: string, userId: string) {
  const expense = await prisma.expenseTransaction.findFirst({
    where: { id: expenseId, project: { userId }, approvalStatus: 'pending' },
    include: { project: { include: { client: true } } },
  })
  if (!expense) {
    return { ok: false, message: '❌ Expense not found or already processed.' }
  }

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: { approvalStatus: 'approved' },
  })

  // Recalculate labor advancePaid if this expense is linked to a labor entry
  if (expense.laborEntryId) {
    const linked = await prisma.expenseTransaction.findMany({
      where: { laborEntryId: expense.laborEntryId, approvalStatus: 'approved' },
      select: { amount: true },
    })
    await prisma.laborEntry.update({
      where: { id: expense.laborEntryId },
      data: { advancePaid: linked.reduce((s, e) => s + e.amount, 0) },
    })
  }

  // Notify client
  const client = expense.project.client
  if (client) {
    await notifyExpenseApprovalStatus(
      {
        channel: (client.notificationChannel ?? 'none') as any,
        phone: client.phone,
        telegramChatId: client.telegramChatId,
      },
      {
        projectName: expense.project.name,
        amount: expense.amount,
        category: expense.category,
        status: 'approved',
      }
    )
  }

  revalidatePath(`/projects/${expense.projectId}`)

  return {
    ok: true,
    message: `✅ *Approved!*\n\n${fmt(expense.amount + expense.taxAmount)} (${expense.category}) for *${expense.project.name}*${client ? `\n${client.name} has been notified.` : ''}`,
  }
}

/**
 * Reject an expense by full ID.
 * Safe: verifies the expense belongs to the given owner.
 */
export async function performReject(expenseId: string, userId: string) {
  const expense = await prisma.expenseTransaction.findFirst({
    where: { id: expenseId, project: { userId }, approvalStatus: 'pending' },
    include: { project: { include: { client: true } } },
  })
  if (!expense) {
    return { ok: false, message: '❌ Expense not found or already processed.' }
  }

  await prisma.expenseTransaction.update({
    where: { id: expenseId },
    data: { approvalStatus: 'rejected' },
  })

  const client = expense.project.client
  if (client) {
    await notifyExpenseApprovalStatus(
      {
        channel: (client.notificationChannel ?? 'none') as any,
        phone: client.phone,
        telegramChatId: client.telegramChatId,
      },
      {
        projectName: expense.project.name,
        amount: expense.amount,
        category: expense.category,
        status: 'rejected',
      }
    )
  }

  revalidatePath(`/projects/${expense.projectId}`)

  return {
    ok: true,
    message: `❌ *Rejected.*\n\n${fmt(expense.amount + expense.taxAmount)} (${expense.category}) for *${expense.project.name}*${client ? `\n${client.name} has been notified.` : ''}`,
  }
}

// ─── Text command processor ────────────────────────────────────────────────────

/**
 * Process a free-text command from an owner (Telegram message or WhatsApp text).
 * Returns the response text to send back.
 */
export async function processOwnerTextCommand(userId: string, rawText: string): Promise<string> {
  const text = rawText.trim()
  const lower = text.toLowerCase()

  if (lower === 'help' || lower === '/help') {
    return [
      '📖 *Available Commands*',
      '',
      '`pending` — List all pending expenses',
      '`approve <code>` — Approve by 6-char code',
      '`reject <code>` — Reject by 6-char code',
      '`balance` — Income & P&L for active projects',
      '`projects` — All projects with status',
      '`help` — Show this message',
    ].join('\n')
  }

  if (lower === 'pending' || lower === '/pending') {
    const expenses = await getPendingExpenses(userId)
    if (expenses.length === 0) return '✅ No pending expenses right now.'

    const lines = [`📋 *Pending Expenses* (${expenses.length})\n`]
    for (const e of expenses) {
      const code = e.id.slice(0, 6)
      lines.push(`• *${e.project.name}* — ${fmt(e.amount + e.taxAmount)}`)
      lines.push(`  ${e.category}${e.submittedByClient ? ` · ${e.submittedByClient.name}` : ''}`)
      lines.push(`  Code: \`${code}\``)
    }
    lines.push('\nReply: `approve <code>` or `reject <code>`')
    return lines.join('\n')
  }

  if (lower === 'balance' || lower === '/balance') {
    return buildBalanceSummary(userId)
  }

  if (lower === 'projects' || lower === '/projects') {
    return buildProjectsList(userId)
  }

  // approve <code>
  const approveMatch = text.match(/^(?:\/?)approve\s+([a-zA-Z0-9]+)$/i)
  if (approveMatch) {
    return approveByShortId(userId, approveMatch[1].toLowerCase())
  }

  // reject <code>
  const rejectMatch = text.match(/^(?:\/?)reject\s+([a-zA-Z0-9]+)$/i)
  if (rejectMatch) {
    return rejectByShortId(userId, rejectMatch[1].toLowerCase())
  }

  return `I don't understand that command.\nSend \`help\` to see available commands.`
}

// ─── Private helpers ───────────────────────────────────────────────────────────

async function approveByShortId(userId: string, shortId: string): Promise<string> {
  const pending = await prisma.expenseTransaction.findMany({
    where: { project: { userId }, approvalStatus: 'pending' },
    select: { id: true },
  })
  const match = pending.find((e) => e.id.toLowerCase().startsWith(shortId))
  if (!match) {
    return `❌ No pending expense found with code \`${shortId}\`.\nSend \`pending\` to see the list.`
  }
  const result = await performApprove(match.id, userId)
  return result.message
}

async function rejectByShortId(userId: string, shortId: string): Promise<string> {
  const pending = await prisma.expenseTransaction.findMany({
    where: { project: { userId }, approvalStatus: 'pending' },
    select: { id: true },
  })
  const match = pending.find((e) => e.id.toLowerCase().startsWith(shortId))
  if (!match) {
    return `❌ No pending expense found with code \`${shortId}\`.\nSend \`pending\` to see the list.`
  }
  const result = await performReject(match.id, userId)
  return result.message
}

async function buildBalanceSummary(userId: string): Promise<string> {
  const projects = await prisma.project.findMany({
    where: { userId, status: { in: ['active', 'planning'] } },
    include: {
      incomeTransactions: { select: { amount: true } },
      expenseTransactions: {
        where: { approvalStatus: { not: 'rejected' }, laborEntryId: null },
        select: { amount: true, taxAmount: true, paidByClient: true },
      },
      laborEntries: { select: { totalAmount: true, paidByClient: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })

  if (projects.length === 0) return '📊 No active projects found.'

  const lines = ['📊 *Project Balances*\n']
  for (const p of projects) {
    const income = p.incomeTransactions.reduce((s, t) => s + t.amount, 0)
    const ownerExp = p.expenseTransactions
      .filter((t) => !t.paidByClient)
      .reduce((s, t) => s + t.amount + t.taxAmount, 0)
    const ownerLab = p.laborEntries
      .filter((t) => !t.paidByClient)
      .reduce((s, t) => s + t.totalAmount, 0)
    const profit = income - ownerExp - ownerLab
    const sign = profit >= 0 ? '+' : ''
    lines.push(`${profit >= 0 ? '🟢' : '🔴'} *${p.name}*`)
    lines.push(`  Income: ${fmt(income)} · P&L: ${sign}${fmt(profit)}`)
  }
  return lines.join('\n')
}

async function buildProjectsList(userId: string): Promise<string> {
  const projects = await prisma.project.findMany({
    where: { userId },
    select: { name: true, status: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  if (projects.length === 0) return '📁 No projects found.'

  const emoji: Record<string, string> = {
    active: '🟢',
    planning: '🔵',
    'on-hold': '🟡',
    completed: '✅',
    cancelled: '⛔',
  }

  const lines = ['📁 *Projects*\n']
  for (const p of projects) {
    lines.push(`${emoji[p.status] ?? '⚪'} ${p.name} _(${p.status})_`)
  }
  return lines.join('\n')
}
