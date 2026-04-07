/**
 * Telegram Bot API integration for sending notifications.
 * Completely free with no conversation limits.
 *
 * Required env var:
 *   TELEGRAM_BOT_TOKEN – Create a bot via @BotFather on Telegram
 *
 * Each recipient needs a telegramChatId, which they get by messaging the bot
 * and the owner can retrieve via https://api.telegram.org/bot{token}/getUpdates
 */

const TELEGRAM_API = 'https://api.telegram.org'

function getConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return null
  return { botToken }
}

/** Send a Telegram message (supports Markdown) */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const config = getConfig()
  if (!config) return false
  if (!chatId) return false

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Telegram] Send failed:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[Telegram] Network error:', err)
    return false
  }
}
