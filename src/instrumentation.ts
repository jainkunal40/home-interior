/**
 * Next.js instrumentation — runs once on server startup.
 * Auto-registers the Telegram webhook so no manual setup is needed.
 */
export async function register() {
  // Only run on the server (not during build or edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const appUrl = process.env.AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

    if (botToken && appUrl) {
      const webhookUrl = `${appUrl}/api/telegram/webhook`
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        })
        const data = await res.json()
        if (data.ok) {
          console.log(`[Telegram] Webhook registered: ${webhookUrl}`)
        } else {
          console.error('[Telegram] Webhook registration failed:', data.description)
        }
      } catch (err) {
        console.error('[Telegram] Webhook registration error:', err)
      }
    }
  }
}
