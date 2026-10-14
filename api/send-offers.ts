import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb, verifyIdToken } from './_lib/firebase-admin'
import { sendTelegram, escapeHtml } from './_lib/telegram'

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'nambuharisaran123@gmail.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  let decoded
  try {
    decoded = await verifyIdToken(token)
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Must be admin
  const db = getAdminDb()
  const userSnap = await db.collection('users').doc(decoded.uid).get()
  const isAdmin = userSnap.exists && userSnap.data()!.role === 'admin'
  const isAdminEmail = decoded.email === ADMIN_EMAIL && decoded.email_verified
  if (!isAdmin && !isAdminEmail) {
    return res.status(403).json({ error: 'Admin only' })
  }

  const { offerId, audience, message, title, couponCode } = req.body as {
    offerId?: string
    audience: string
    message?: string
    title?: string
    couponCode?: string
  }

  let offerTitle = title || 'Offer from LoyalCart'
  let offerMessage = message || ''
  let offerCoupon = couponCode || ''

  if (offerId) {
    const offerSnap = await db.collection('offers').doc(offerId).get()
    if (offerSnap.exists) {
      const o = offerSnap.data()!
      offerTitle = o.title
      offerMessage = o.description
      offerCoupon = o.couponCode || ''
    }
  }

  // Get customers
  let custQuery = db.collection('customers').where('optInOffers', '==', true)
  const custSnap = await custQuery.get()
  const customers = custSnap.docs.map((d) => d.data())
  const targets = customers.filter((c) => {
    if (!c.telegramChatId) return false
    if (audience === 'loyal') return c.isLoyal
    return true
  })

  let sent = 0, failed = 0
  const THROTTLE_MS = 40 // ~25 msg/sec

  for (const c of targets) {
    const lines = [
      `\ud83c\udf81 <b>${escapeHtml(offerTitle)}</b>`,
      ``,
      escapeHtml(offerMessage),
    ]
    if (offerCoupon) {
      lines.push('')
      lines.push(`\ud83c\udff7\ufe0f Coupon: <code>${escapeHtml(offerCoupon)}</code>`)
    }
    lines.push('')
    lines.push(`\ud83c\udfb0 Your points: <b>${c.points}</b> | Tier: <b>${c.tier}</b>`)

    try {
      const result = await sendTelegram(c.telegramChatId, lines.join('\n'))
      if (result.ok) {
        sent++
      } else {
        failed++
        if (result.error?.includes('bot was blocked') || result.error?.includes('user is deactivated')) {
          await db.collection('customers').doc(c.phone).update({ telegramChatId: null })
        }
      }
    } catch {
      failed++
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS))
  }

  // Update offer stats
  if (offerId) {
    await db.collection('offers').doc(offerId).update({ sentCount: sent, failedCount: failed })
  }

  return res.status(200).json({ ok: true, sent, failed, total: targets.length })
}
