/**
 * WhatsApp Cloud API provider.
 * Uses Meta's WhatsApp Business Platform (free for 1000 conversations/month).
 *
 * Required env vars:
 *   WHATSAPP_ACCESS_TOKEN    – Permanent token from Meta Business settings
 *   WHATSAPP_PHONE_NUMBER_ID – The phone number ID from WhatsApp Business API
 */

const WHATSAPP_API = 'https://graph.facebook.com/v21.0'

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) return null
  return { accessToken, phoneNumberId }
}

/** Format phone to WhatsApp format (strip spaces, dashes; ensure country code) */
function formatPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (/^\+?\d{10,15}$/.test(cleaned)) {
    return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned
  }
  if (/^\d{10}$/.test(cleaned)) {
    return `91${cleaned}`
  }
  return null
}

/** Send a plain text WhatsApp message */
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  const phone = formatPhone(to)
  if (!phone) return false

  try {
    const res = await fetch(`${WHATSAPP_API}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[WhatsApp] Send failed:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[WhatsApp] Network error:', err)
    return false
  }
}
