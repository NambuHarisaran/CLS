import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from '../_lib/firebase-admin'
import { sendTelegram, escapeHtml } from '../_lib/telegram'
import * as admin from 'firebase-admin'

function randomCode(phone: string): string {
  const last4 = phone.slice(-4)
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `LOY-${last4}-${rand}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const authHeader = req.headers.authorization || ''
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const db = getAdminDb()

  // Check if weekly automation is enabled
  const settingsSnap = await db.collection('settings').doc('loyalty').get()
  // (No toggleWeekly field yet; proceed by default)

  // Decay: customers who haven't visited in loyalWindowDays lose loyal status
  const settings = settingsSnap.exists ? settingsSnap.data()! : {
    loyalWindowDays: 30, loyalMinVisits: 4, loyalMinSpend: 1500
  }
  const windowMs = settings.loyalWindowDays * 86400000
  const cutoff = new Date(Date.now() - windowMs)

  const allCustomers = await db.collection('customers').get()
  const batch = db.batch()
  let decayed = 0

  for (const doc of allCustomers.docs) {
    const c = doc.data()
    if (c.isLoyal && c.lastVisitAt) {
      const lastVisit = c.lastVisitAt.toDate()
      if (lastVisit < cutoff) {
        batch.update(doc.ref, { isLoyal: false })
        decayed++
      }
    }
  }
  await batch.commit()

  // Get active coupons for offers preview
  const now = admin.firestore.Timestamp.now()
  const couponsSnap = await db.collection('coupons')
    .where('active', '==', true)
    .where('validTo', '>=', now)
    .limit(3)
    .get()
  const topCoupons = couponsSnap.docs.map((d) => d.data()).slice(0, 3)

  // Send weekly messages to loyal linked customers
  const loyalSnap = await db.collection('customers')
    .where('isLoyal', '==', true)
    .where('optInOffers', '==', true)
    .get()

  let sent = 0, failed = 0
  const validTo = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 86400000))
  const createdAt = admin.firestore.FieldValue.serverTimestamp()
  const THROTTLE_MS = 40

  for (const doc of loyalSnap.docs) {
    const c = doc.data()
    if (!c.telegramChatId) continue

    // Generate personal coupon
    const code = randomCode(c.phone)
    await db.collection('coupons').doc(code).set({
      code,
      type: 'percent',
      value: 10,
      minBill: 300,
      maxDiscount: 0,
      audience: 'customer',
      customerPhone: c.phone,
      usageLimit: 1,
      usedCount: 0,
      active: true,
      validFrom: now,
      validTo,
      createdBy: 'cron',
      createdAt,
    })

    const lines = [
      `\ud83c\udf1f <b>Your Weekly LoyalCart Update</b>`,
      ``,
      `Hi <b>${escapeHtml(c.name)}</b>! Here's your loyalty summary:`,
      ``,
      `\ud83c\udfb0 Points: <b>${c.points}</b>`,
      `\ud83c\udfc6 Tier: <b>${c.tier}</b>`,
      `\ud83c\udf1f Status: Loyal Customer \u2705`,
      ``,
    ]

    if (topCoupons.length > 0) {
      lines.push(`\ud83d\udce6 <b>This week's offers:</b>`)
      for (const coupon of topCoupons) {
        if (coupon.audience === 'all' || coupon.audience === 'loyal') {
          lines.push(`  \u2022 ${escapeHtml(coupon.code)}: ${coupon.type === 'percent' ? coupon.value + '%' : '\u20b9' + coupon.value} off`)
        }
      }
      lines.push('')
    }

    lines.push(`\ud83c\udff7\ufe0f Your personal coupon: <code>${code}</code>`)
    lines.push(`10% off (min \u20b9300) \u2022 Valid 7 days`)

    try {
      const result = await sendTelegram(c.telegramChatId, lines.join('\n'))
      if (result.ok) sent++
      else {
        failed++
        if (result.error?.includes('bot was blocked') || result.error?.includes('user is deactivated')) {
          await doc.ref.update({ telegramChatId: null })
        }
      }
    } catch {
      failed++
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS))
  }

  return res.status(200).json({
    ok: true,
    decayed,
    sent,
    failed,
  })
}
