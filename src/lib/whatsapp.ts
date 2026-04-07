/**
 * WhatsApp Cloud API integration for sending notifications.
 * Uses Meta's WhatsApp Business Platform (free for 1000 conversations/month).
 *
 * Required env vars:
 *   WHATSAPP_ACCESS_TOKEN    – Permanent token from Meta Business settings
 *   WHATSAPP_PHONE_NUMBER_ID – The phone number ID from WhatsApp Business API
 *
 * All functions gracefully no-op when env vars are missing, so the app works
 * perfectly fine without WhatsApp configured.
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
  // Must start with country code (e.g. 91 for India)
  if (/^\+?\d{10,15}$/.test(cleaned)) {
    return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned
  }
  // If 10-digit Indian number without country code, prepend 91
  if (/^\d{10}$/.test(cleaned)) {
    return `91${cleaned}`
  }
  return null
}

/** Send a plain text WhatsApp message */
async function sendMessage(to: string, text: string): Promise<boolean> {
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

// ─── Notification helpers ───────────────────────────────────

/** Notify owner when a client submits an expense for approval */
export async function notifyExpensePendingApproval(ownerPhone: string | null, data: {
  clientName: string
  projectName: string
  amount: number
  category: string
}) {
  if (!ownerPhone) return
  const msg = `🔔 *New Expense Pending Approval*\n\nClient *${data.clientName}* submitted an expense for project *${data.projectName}*.\n\n💰 Amount: ₹${data.amount.toLocaleString('en-IN')}\n📂 Category: ${data.category}\n\nPlease review and approve/reject in the dashboard.`
  await sendMessage(ownerPhone, msg)
}

/** Notify client when their expense is approved or rejected */
export async function notifyExpenseApprovalStatus(clientPhone: string | null, data: {
  projectName: string
  amount: number
  category: string
  status: 'approved' | 'rejected'
}) {
  if (!clientPhone) return
  const emoji = data.status === 'approved' ? '✅' : '❌'
  const msg = `${emoji} *Expense ${data.status === 'approved' ? 'Approved' : 'Rejected'}*\n\nYour expense of ₹${data.amount.toLocaleString('en-IN')} (${data.category}) for project *${data.projectName}* has been *${data.status}*.`
  await sendMessage(clientPhone, msg)
}

/** Notify client when a new payment is received */
export async function notifyPaymentReceived(clientPhone: string | null, data: {
  projectName: string
  amount: number
  paymentType: string
}) {
  if (!clientPhone) return
  const msg = `💵 *Payment Received*\n\nA payment of ₹${data.amount.toLocaleString('en-IN')} has been recorded for project *${data.projectName}*.\n\nType: ${data.paymentType.replace(/_/g, ' ')}\n\nThank you!`
  await sendMessage(clientPhone, msg)
}

/** Notify client when a milestone is completed */
export async function notifyMilestoneCompleted(clientPhone: string | null, data: {
  projectName: string
  milestoneTitle: string
}) {
  if (!clientPhone) return
  const msg = `🎯 *Milestone Completed*\n\nMilestone *${data.milestoneTitle}* for project *${data.projectName}* has been marked as completed.\n\nGreat progress! 🎉`
  await sendMessage(clientPhone, msg)
}
