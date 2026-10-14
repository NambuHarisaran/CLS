import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb, verifyIdToken } from './_lib/firebase-admin'
import { sendTelegram, escapeHtml } from './_lib/telegram'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await verifyIdToken(token)
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { customerPhone, billId, total, pointsEarned } = req.body as {
    customerPhone: string
    billId: string
    total: number
    pointsEarned: number
  }

  const db = getAdminDb()
  const custSnap = await db.collection('customers').doc(customerPhone).get()
  if (!custSnap.exists) return res.status(404).json({ error: 'Customer not found' })

  const c = custSnap.data()!
  if (!c.telegramChatId) return res.status(200).json({ ok: true, skipped: true })

  // Fetch bill
  const billSnap = await db.collection('bills').doc(billId).get()
  const bill = billSnap.exists ? billSnap.data()! : null

  const lines = [
    `\ud83e\uddfe <b>Bill Receipt</b>`,
    ``,
    `Hi <b>${escapeHtml(c.name)}</b>, thank you for shopping at our store!`,
    ``,
  ]

  if (bill) {
    lines.push(`<b>Bill #${bill.billNo}</b>`)
    for (const item of (bill.items || [])) {
      lines.push(`  • ${escapeHtml(item.name)} ×${item.qty} = \u20b9${item.qty * item.price}`)
    }
    lines.push('')
    if (bill.couponDiscount > 0) lines.push(`Coupon discount: -\u20b9${bill.couponDiscount}`)
    if (bill.pointsDiscount > 0) lines.push(`Points discount: -\u20b9${bill.pointsDiscount}`)
    lines.push(`<b>Total: \u20b9${bill.total}</b>`)
    lines.push('')
  }

  lines.push(`\ud83c\udfb0 Points earned: <b>+${pointsEarned}</b>`)
  lines.push(`\ud83c\udfb0 New balance: <b>${c.points}</b> pts`)
  lines.push(`\ud83c\udfc6 Tier: <b>${c.tier}</b>`)

  if (!c.isLoyal) {
    lines.push('')
    lines.push(`\u23f3 Keep visiting to become a <b>Loyal Customer</b> and unlock exclusive offers!`)
  }

  await sendTelegram(c.telegramChatId, lines.join('\n'))
  return res.status(200).json({ ok: true })
}
