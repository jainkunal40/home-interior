import { NextRequest, NextResponse } from 'next/server'

/**
 * One-time setup endpoint to register the Telegram webhook.
 * Call: GET /api/telegram/setup?secret=<AUTH_SECRET>
 *
 * This tells Telegram to send all bot messages to your webhook URL.
 * Only needs to be called once (or after changing the domain).
 */
export async function GET(req: NextRequest) {
  // Protect with AUTH_SECRET so only the owner can trigger this
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })
  }

  // Derive webhook URL from the request's origin
  const origin = req.nextUrl.origin
  const webhookUrl = `${origin}/api/telegram/webhook`

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })

  const data = await res.json()
  return NextResponse.json({ webhookUrl, telegram: data })
}
