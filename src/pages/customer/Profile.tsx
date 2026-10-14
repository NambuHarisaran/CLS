import React, { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import CustomerLayout from '../../components/CustomerLayout'
import { CustomerDoc } from '../../lib/types'
import { isValidIndianPhone, normalisePhone } from '../../lib/utils'
import { User, Phone, Bell, Send, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { user, userDoc } = useAuth()
  const [name, setName] = useState(userDoc?.name || '')
  const [optIn, setOptIn] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customer, setCustomer] = useState<CustomerDoc | null>(null)

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBot'

  useEffect(() => {
    setName(userDoc?.name || '')
    if (userDoc?.phone) {
      getDoc(doc(db, 'customers', userDoc.phone)).then((s) => {
        if (s.exists()) {
          const d = s.data() as CustomerDoc
          setCustomer(d)
          setOptIn(d.optInOffers)
        }
      })
    }
  }, [userDoc])

  const handleSave = async () => {
    if (!user || !userDoc) return
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim() })
      if (userDoc.phone) {
        await updateDoc(doc(db, 'customers', userDoc.phone), {
          name: name.trim(),
          optInOffers: optIn,
        })
      }
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomerLayout>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-5">Profile</h1>

      <div className="space-y-4">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User size={18} className="text-green-600" /> Personal Info
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={userDoc?.email || ''}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone size={14} /> Mobile Number
              </label>
              <input
                type="tel"
                value={userDoc?.phone || ''}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Contact support to change your phone number</p>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Send size={18} className="text-blue-500" /> Telegram Notifications
          </h2>
          {customer?.telegramChatId ? (
            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
              <Check size={20} className="text-green-600" />
              <div>
                <div className="font-medium text-green-800">Telegram Connected</div>
                <div className="text-xs text-green-600">You'll receive bills and offers on Telegram</div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Connect your Telegram account to receive instant receipts, points updates, and weekly personalised offers.
              </p>
              <ol className="text-sm text-gray-600 space-y-1 mb-4 list-decimal list-inside">
                <li>Tap the button below to open the bot</li>
                <li>Tap <strong>Start</strong> in Telegram</li>
                <li>Tap <strong>Share my phone number</strong></li>
              </ol>
              <a
                href={`https://t.me/${botUsername}?start=${user?.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Send size={16} /> Open Telegram Bot
              </a>
            </div>
          )}
        </div>

        {/* Offers opt-in */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-amber-500" /> Notification Preferences
          </h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium text-gray-800">Receive Offers & Promotions</div>
              <div className="text-xs text-gray-500">Get weekly deals and personalised coupons on Telegram</div>
            </div>
            <div
              onClick={() => setOptIn((p) => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                optIn ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                optIn ? 'translate-x-5' : ''
              }`} />
            </div>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </CustomerLayout>
  )
}
