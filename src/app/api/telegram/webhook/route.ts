import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage, answerCallbackQuery, editTelegramMessage } from '@/lib/telegram'
import {
  getOwnerByTelegramChatId,
  performApprove,
  performReject,
  processOwnerTextCommand,
} from '@/lib/bot-commands'

/**
 * Telegram webhook handler.
 *
 * Handles three types of updates:
 * 1. /start <param>  — deep-link account connection (client or owner)
 * 2. callback_query  — inline button press (✅ Approve / ❌ Reject)
 * 3. message text    — owner text commands (pending, balance, approve, reject, etc.)
 */
export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return NextResponse.json({ ok: false }, { status: 503 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // ── Inline button press (callback_query) ──────────────────────────────────
  if (body?.callback_query) {
    const cq = body.callback_query
    const callbackId: string = cq.id
    const chatId: string = String(cq.message?.chat?.id)
    const messageId: number = cq.message?.message_id
    const data: string = cq.data ?? ''

    const owner = await getOwnerByTelegramChatId(chatId)
    if (!owner) {
      await answerCallbackQuery(callbackId, '⚠️ Account not linked.')
      return NextResponse.json({ ok: true })
    }

    const [action, expenseId] = data.split(':')

    if (action === 'approve' && expenseId) {
      const result = await performApprove(expenseId, owner.id)
      await answerCallbackQuery(callbackId, result.ok ? '✅ Approved!' : 'Already processed')
      if (messageId) await editTelegramMessage(chatId, messageId, result.message)
    } else if (action === 'reject' && expenseId) {
      const result = await performReject(expenseId, owner.id)
      await answerCallbackQuery(callbackId, result.ok ? '❌ Rejected.' : 'Already processed')
      if (messageId) await editTelegramMessage(chatId, messageId, result.message)
    } else {
      await answerCallbackQuery(callbackId)
    }

    return NextResponse.json({ ok: true })
  }

  // ── Regular text message ──────────────────────────────────────────────────
  const message = body?.message
  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const text = message.text.trim()
  const firstName = message.chat.first_name || 'there'

  // /start deep-link — account connection
  if (text.startsWith('/start')) {
    const param = text.replace('/start', '').trim()

    if (param.startsWith('client_')) {
      const clientId = param.replace('client_', '')
      const client = await prisma.client.findUnique({ where: { id: clientId } })
      if (client) {
        await prisma.client.update({
          where: { id: clientId },
          data: { telegramChatId: chatId, notificationChannel: 'telegram' },
        })
        await sendTelegramMessage(chatId,
          `✅ *Connected!*\n\nHi ${firstName}! You're now linked to project notifications for *${client.name}*.\n\nYou'll receive updates on:\n• Expense approvals\n• Payment confirmations\n• Milestone completions`
        )
      } else {
        await sendTelegramMessage(chatId, `❌ Invalid or expired link. Please ask your project manager for a new one.`)
      }
      return NextResponse.json({ ok: true })
    }

    if (param.startsWith('owner_')) {
      const userId = param.replace('owner_', '')
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: { telegramChatId: chatId, notificationChannel: 'telegram' },
        })
        await sendTelegramMessage(chatId,
          `✅ *Connected!*\n\nHi ${firstName}! Your owner account is linked.\n\nYou'll receive notifications for pending expenses and can reply directly to approve or reject them.\n\nSend \`help\` to see all available commands.`
        )
      } else {
        await sendTelegramMessage(chatId, `❌ Invalid or expired link. Please use the link from your Settings page.`)
      }
      return NextResponse.json({ ok: true })
    }

    // /start with no valid param
    await sendTelegramMessage(chatId,
      `👋 Hi ${firstName}!\n\nThis is the *Explore Interiors* bot.\n\nTo connect your account, use the link shared by your project manager.`
    )
    return NextResponse.json({ ok: true })
  }

  // Owner text commands
  const owner = await getOwnerByTelegramChatId(chatId)
  if (owner) {
    const reply = await processOwnerTextCommand(owner.id, text)
    await sendTelegramMessage(chatId, reply)
    return NextResponse.json({ ok: true })
  }

  // Unknown sender
  await sendTelegramMessage(chatId,
    `👋 Hi! To connect your account, please use the link shared by your project manager.`
  )
  return NextResponse.json({ ok: true })
}
