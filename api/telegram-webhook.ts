import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from './_lib/firebase-admin'
import { sendTelegram, escapeHtml } from './_lib/telegram'
import * as admin from 'firebase-admin'

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  return digits.slice(-10)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const update = req.body as TelegramUpdate
  const db = getAdminDb()

  try {
    if (update.message) {
      const msg = update.message
      const chatId = msg.chat.id
      const text = msg.text?.trim() || ''
      const fromId = msg.from?.id

      if (text.startsWith('/start')) {
        await sendTelegram(chatId, [
          '\ud83d\uded2 <b>Welcome to LoyalCart!</b>',
          '',
          'Share your phone number below to link your loyalty account and receive:',
          '\u2022 Instant bill receipts',
          '\u2022 Points updates',
          '\u2022 Exclusive weekly offers',
        ].join('\n'), {
          keyboard: [[{
            text: '\ud83d\udcf1 Share my phone number',
            request_contact: true,
          }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        })
        return res.status(200).json({ ok: true })
      }

      if (text === '/stop') {
        // Find customer by chatId and clear
        const snap = await db.collection('customers')
          .where('telegramChatId', '==', String(chatId))
          .limit(1)
          .get()
        if (!snap.empty) {
          await snap.docs[0].ref.update({ telegramChatId: null, telegramLinkedAt: null })
          await sendTelegram(chatId, 'You have unsubscribed from LoyalCart notifications. Send /start to reconnect anytime.')
        }
        return res.status(200).json({ ok: true })
      }

      if (text === '/points') {
        const snap = await db.collection('customers')
          .where('telegramChatId', '==', String(chatId))
          .limit(1)
          .get()
        if (snap.empty) {
          await sendTelegram(chatId, 'Your account is not linked. Send /start to connect.')
        } else {
          const c = snap.docs[0].data()
          await sendTelegram(chatId, `\ud83c\udfc6 <b>${escapeHtml(c.name)}</b>\n\nPoints: <b>${c.points}</b>\nTier: <b>${c.tier}</b>\nLoyal: ${c.isLoyal ? '\u2705 Yes' : '\u274c Not yet'}`)
        }
        return res.status(200).json({ ok: true })
      }

      if (text === '/offers') {
        const now = admin.firestore.Timestamp.now()
        const snap = await db.collection('coupons')
          .where('active', '==', true)
          .where('validTo', '>=', now)
          .limit(5)
          .get()
        if (snap.empty) {
          await sendTelegram(chatId, 'No active offers right now. Check back soon! \ud83d\udce6')
        } else {
          const lines = ['\ud83c\udf81 <b>Active Offers:</b>', '']
          for (const d of snap.docs) {
            const c = d.data()
            if (c.audience === 'all' || c.audience === 'loyal') {
              lines.push(`\u2022 <b>${escapeHtml(c.code)}</b>: ${c.type === 'percent' ? c.value + '%' : '\u20b9' + c.value} off${c.minBill ? ` (min \u20b9${c.minBill})` : ''}`)
            }
          }
          await sendTelegram(chatId, lines.join('\n'))
        }
        return res.status(200).json({ ok: true })
      }

      // Contact message
      if (msg.contact) {
        const contact = msg.contact
        // Security: only accept if contact belongs to sender
        if (contact.user_id !== fromId) {
          await sendTelegram(chatId, '\u26a0\ufe0f Please share <b>your own</b> phone number, not someone else\'s.')
          return res.status(200).json({ ok: true })
        }

        const phone = normalisePhone(contact.phone_number)
        if (!/^[6-9]\d{9}$/.test(phone)) {
          await sendTelegram(chatId, 'Invalid phone number format. Please try again with a valid Indian mobile number.')
          return res.status(200).json({ ok: true })
        }

        const custRef = db.collection('customers').doc(phone)
        const custSnap = await custRef.get()

        if (custSnap.exists) {
          const c = custSnap.data()!
          await custRef.update({
            telegramChatId: String(chatId),
            telegramLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
          await sendTelegram(chatId, [
            `\u2705 <b>Account linked!</b>`,
            ``,
            `Hi <b>${escapeHtml(c.name)}</b>! Your LoyalCart account is now connected.`,
            ``,
            `\ud83c\udfb0 Points balance: <b>${c.points}</b>`,
            `\ud83c\udfc6 Tier: <b>${c.tier}</b>`,
            `\ud83c\udf1f Loyal: ${c.isLoyal ? 'Yes \u2705' : 'Not yet \u23f3'}`,
          ].join('\n'))
        } else {
          // Create new customer
          await custRef.set({
            uid: null,
            name: contact.first_name || 'Customer',
            phone,
            totalVisits: 0,
            totalSpent: 0,
            points: 0,
            tier: 'Bronze',
            isLoyal: false,
            lastVisitAt: null,
            firstVisitAt: null,
            visitStreakWeeks: 0,
            telegramChatId: String(chatId),
            telegramLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
            optInOffers: true,
          })
          await sendTelegram(chatId, [
            `\u2705 <b>Account created!</b>`,
            ``,
            `Welcome to LoyalCart! Your loyalty account has been created.`,
            `Visit our store and give your phone number at checkout to start earning points!`,
            ``,
            `\ud83e\udd49 Tier: Bronze`,
            `\ud83c\udfb0 Points: 0`,
          ].join('\n'))
        }
        return res.status(200).json({ ok: true })
      }
    }
  } catch (e) {
    console.error('Webhook error:', e)
  }

  return res.status(200).json({ ok: true })
}

interface TelegramUpdate {
  message?: {
    chat: { id: number }
    from?: { id: number }
    text?: string
    contact?: {
      phone_number: string
      user_id: number
      first_name?: string
    }
  }
}
