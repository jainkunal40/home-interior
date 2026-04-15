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

/** Send a plain text Telegram message */
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

/** Send a Telegram message with inline keyboard buttons */
export async function sendTelegramMessageWithButtons(
  chatId: string,
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>
): Promise<boolean> {
  const config = getConfig()
  if (!config || !chatId) return false

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      }),
    })
    if (!res.ok) {
      console.error('[Telegram] sendMessageWithButtons failed:', await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[Telegram] sendMessageWithButtons error:', err)
    return false
  }
}

/** Answer a Telegram callback query (dismisses the loading spinner on the button) */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const config = getConfig()
  if (!config) return
  try {
    await fetch(`${TELEGRAM_API}/bot${config.botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text ?? '',
        show_alert: false,
      }),
    })
  } catch (err) {
    console.error('[Telegram] answerCallbackQuery error:', err)
  }
}

/** Edit an existing Telegram message (e.g. show result after approve/reject) */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string
): Promise<void> {
  const config = getConfig()
  if (!config) return
  try {
    await fetch(`${TELEGRAM_API}/bot${config.botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
      }),
    })
  } catch (err) {
    console.error('[Telegram] editMessageText error:', err)
  }
}
