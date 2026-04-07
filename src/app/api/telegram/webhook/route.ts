import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'

/**
 * Telegram webhook handler.
 * When a user sends /start <param> to the bot, we auto-link their chat ID
 * to the corresponding client or owner record.
 *
 * Deep link formats:
 *   /start client_<clientId>   → links to Client record
 *   /start owner_<userId>     → links to User record
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

  const message = body?.message
  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const text = message.text.trim()
  const firstName = message.chat.first_name || 'there'

  // Handle /start with deep link parameter
  if (text.startsWith('/start ')) {
    const param = text.replace('/start ', '').trim()

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
        return NextResponse.json({ ok: true })
      }
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
          `✅ *Connected!*\n\nHi ${firstName}! Your owner account is now linked.\n\nYou'll receive notifications when clients submit expenses for approval.`
        )
        return NextResponse.json({ ok: true })
      }
    }

    // Invalid or expired link
    await sendTelegramMessage(chatId,
      `❌ Sorry, that link seems invalid or expired. Please ask your project manager for a new link.`
    )
    return NextResponse.json({ ok: true })
  }

  // Plain /start without parameter
  if (text === '/start') {
    await sendTelegramMessage(chatId,
      `👋 Hi ${firstName}!\n\nThis is the *Explore Interiors* notification bot.\n\nTo connect your account, please use the link shared by your project manager.`
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
