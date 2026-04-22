/**
 * Unified notification dispatcher.
 * Routes messages to WhatsApp or Telegram based on each recipient's preference.
 * Gracefully no-ops when channel is "none" or config is missing.
 */

import { sendWhatsAppMessage } from './whatsapp'
import { sendTelegramMessage, sendTelegramMessageWithButtons } from './telegram'

type NotificationChannel = 'none' | 'whatsapp' | 'telegram'

interface Recipient {
  channel: NotificationChannel
  phone?: string | null
  telegramChatId?: string | null
}

/** Send a message to a recipient via their preferred channel */
async function send(recipient: Recipient, message: string): Promise<boolean> {
  if (recipient.channel === 'whatsapp' && recipient.phone) {
    return sendWhatsAppMessage(recipient.phone, message)
  }
  if (recipient.channel === 'telegram' && recipient.telegramChatId) {
    return sendTelegramMessage(recipient.telegramChatId, message)
  }
  return false
}

// ─── Notification helpers ───────────────────────────────────

/** Notify owner when a client submits an expense for approval */
export async function notifyExpensePendingApproval(recipient: Recipient, data: {
  clientName: string
  projectName: string
  amount: number
  category: string
  expenseId: string
  notes?: string
}) {
  const code = data.expenseId.slice(0, 6)
  const msg = `🔔 *New Expense Pending Approval*\n\nClient *${data.clientName}* submitted for *${data.projectName}*\n\n💰 Amount: ₹${data.amount.toLocaleString('en-IN')}\n📂 Category: ${data.category}${data.notes ? `\n📝 ${data.notes}` : ''}`

  // Telegram: send with inline approve / reject buttons
  if (recipient.channel === 'telegram' && recipient.telegramChatId) {
    return sendTelegramMessageWithButtons(recipient.telegramChatId, msg, [
      [
        { text: '✅ Approve', callback_data: `approve:${data.expenseId}` },
        { text: '❌ Reject', callback_data: `reject:${data.expenseId}` },
      ],
    ])
  }

  // WhatsApp: plain text with short code for text commands
  if (recipient.channel === 'whatsapp' && recipient.phone) {
    const full = `${msg}\n\nCode: *${code}*\n\nReply:\n*approve ${code}* to approve\n*reject ${code}* to reject\n\nOr send *pending* to see all pending expenses.`
    return sendWhatsAppMessage(recipient.phone, full)
  }

  return false
}

/** Notify client when their expense is approved or rejected */
export async function notifyExpenseApprovalStatus(recipient: Recipient, data: {
  projectName: string
  amount: number
  category: string
  status: 'approved' | 'rejected'
}) {
  const emoji = data.status === 'approved' ? '✅' : '❌'
  const msg = `${emoji} *Expense ${data.status === 'approved' ? 'Approved' : 'Rejected'}*\n\nYour expense of ₹${data.amount.toLocaleString('en-IN')} (${data.category}) for project *${data.projectName}* has been *${data.status}*.`
  await send(recipient, msg)
}

/** Notify client when a new payment is received */
export async function notifyPaymentReceived(recipient: Recipient, data: {
  projectName: string
  amount: number
  paymentType: string
}) {
  const msg = `💵 *Payment Received*\n\nA payment of ₹${data.amount.toLocaleString('en-IN')} has been recorded for project *${data.projectName}*.\n\nType: ${data.paymentType.replace(/_/g, ' ')}\n\nThank you!`
  await send(recipient, msg)
}

/** Notify client when a milestone is completed */
export async function notifyMilestoneCompleted(recipient: Recipient, data: {
  projectName: string
  milestoneTitle: string
}) {
  const msg = `🎯 *Milestone Completed*\n\nMilestone *${data.milestoneTitle}* for project *${data.projectName}* has been marked as completed.\n\nGreat progress! 🎉`
  await send(recipient, msg)
}

/** Remind client about an upcoming milestone payment due tomorrow */
export async function notifyMilestoneReminder(recipient: Recipient, data: {
  projectName: string
  milestoneTitle: string
  dueDate: string
}) {
  const msg = `⏰ *Milestone Due Tomorrow*\n\nMilestone *${data.milestoneTitle}* for project *${data.projectName}* is due on *${data.dueDate}*.\n\nPlease ensure you are ready for the next stage.`
  await send(recipient, msg)
}
