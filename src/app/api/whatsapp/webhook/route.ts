import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import {
  getOwnerByPhone,
  processOwnerTextCommand,
} from '@/lib/bot-commands'

/**
 * WhatsApp Cloud API incoming webhook.
 *
 * Register this URL in Meta Developer Console:
 *   https://your-app.vercel.app/api/whatsapp/webhook
 *
 * Required env vars:
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN  — any secret string you choose, set in Meta Console too
 *   WHATSAPP_ACCESS_TOKEN          — for sending reply messages
 *   WHATSAPP_PHONE_NUMBER_ID       — your WhatsApp Business number ID
 *
 * Owner text commands (same as Telegram):
 *   pending, approve <code>, reject <code>, balance, projects, help
 */

// ── GET: webhook verification (Meta requires this on first setup) ─────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (!verifyToken) {
    return new NextResponse('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured', { status: 503 })
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST: incoming message ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Meta sends a wrapper with entry[].changes[].value.messages[]
  const entry = body?.entry?.[0]
  const change = entry?.changes?.[0]
  const value = change?.value

  if (!value?.messages?.length) {
    // Could be a status update (read receipts, delivery reports) — ignore
    return NextResponse.json({ ok: true })
  }

  const msg = value.messages[0]

  // Only process text messages
  if (msg.type !== 'text') {
    return NextResponse.json({ ok: true })
  }

  const fromPhone = msg.from // e.g. "919876543210"
  const messageText: string = msg.text?.body ?? ''

  if (!fromPhone || !messageText.trim()) {
    return NextResponse.json({ ok: true })
  }

  // Look up owner by phone number
  const owner = await getOwnerByPhone(fromPhone)
  if (!owner) {
    // Unknown number — don't reply to prevent spam/loops
    return NextResponse.json({ ok: true })
  }

  // Process the command and send response
  const reply = await processOwnerTextCommand(owner.id, messageText)

  // Strip Telegram-style backtick code formatting for WhatsApp
  // (WhatsApp doesn't render backticks as code blocks)
  const whatsAppReply = reply.replace(/`([^`]+)`/g, '*$1*')

  await sendWhatsAppMessage(owner.phone ?? fromPhone, whatsAppReply)

  return NextResponse.json({ ok: true })
}
