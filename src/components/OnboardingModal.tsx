import React, { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface Props {
  onComplete: () => void
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.slice(-10)
}

export default function OnboardingModal({ onComplete }: Props) {
  const { user, userDoc } = useAuth()
  const [name, setName] = useState(userDoc?.name || user?.displayName || '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'details' | 'telegram'>('details')

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBot'

  const handleSave = async () => {
    if (!user) return
    const norm = normalisePhone(phone)
    if (!/^[6-9]\d{9}$/.test(norm)) {
      toast.error('Enter a valid 10-digit Indian mobile number')
      return
    }
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }
    setSaving(true)
    try {
      await doc(db, 'users', user.uid)
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim(), phone: norm })
      // Upsert customer doc
      await setDoc(
        doc(db, 'customers', norm),
        {
          uid: user.uid,
          name: name.trim(),
          phone: norm,
          totalVisits: 0,
          totalSpent: 0,
          points: 0,
          tier: 'Bronze',
          isLoyal: false,
          lastVisitAt: null,
          firstVisitAt: null,
          visitStreakWeeks: 0,
          telegramChatId: null,
          telegramLinkedAt: null,
          optInOffers: true,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
      setStep('telegram')
    } catch (e) {
      toast.error('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {step === 'details' ? (
          <>
            <div className="text-4xl mb-3 text-center">👋</div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Welcome!</h2>
            <p className="text-gray-500 text-center mb-6">Let's set up your loyalty profile.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  placeholder="10-digit mobile"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3 text-center">📱</div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Connect Telegram</h2>
            <p className="text-gray-500 text-center mb-6">
              Get your bills, points, and exclusive offers directly on Telegram!
            </p>
            <a
              href={`https://t.me/${botUsername}?start=${user?.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
            >
              Open Telegram Bot
            </a>
            <p className="text-xs text-gray-500 text-center mb-4">
              Tap the button above, then tap Start in Telegram and share your phone number to link your account.
            </p>
            <button
              onClick={onComplete}
              className="w-full text-gray-600 font-medium py-2 hover:text-gray-800"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
