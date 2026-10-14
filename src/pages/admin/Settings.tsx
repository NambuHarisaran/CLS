import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { invalidateSettingsCache, invalidateProductsCache, getLoyaltySettings } from '../../lib/firestore'
import AdminLayout from '../../components/AdminLayout'
import { LoyaltySettings } from '../../lib/types'
import { DEFAULT_SETTINGS } from '../../lib/loyalty'
import { seedProducts, seedCustomers, seedCoupons } from '../../data/seedProducts'
import { Settings, Database, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { addDays } from 'date-fns'

export default function AdminSettings() {
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLoyaltySettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'loyalty'), settings)
      invalidateSettingsCache()
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const batch = writeBatch(db)

      // Products
      for (const p of seedProducts) {
        batch.set(doc(db, 'products', p.barcode), { ...p, createdAt: serverTimestamp() }, { merge: true })
      }

      // Settings
      batch.set(doc(db, 'settings', 'loyalty'), DEFAULT_SETTINGS, { merge: true })

      // Coupons
      const now = Timestamp.now()
      const in90 = Timestamp.fromDate(addDays(new Date(), 90))
      for (const c of seedCoupons) {
        batch.set(doc(db, 'coupons', c.code), {
          ...c,
          validFrom: now,
          validTo: in90,
          createdAt: serverTimestamp(),
        }, { merge: true })
      }

      // Customers
      for (const cust of seedCustomers) {
        batch.set(doc(db, 'customers', cust.phone), {
          uid: null,
          name: cust.name,
          phone: cust.phone,
          totalVisits: cust.totalVisits,
          totalSpent: cust.totalSpent,
          points: cust.points,
          tier: cust.tier,
          isLoyal: cust.isLoyal,
          visitStreakWeeks: cust.visitStreakWeeks,
          telegramChatId: null,
          telegramLinkedAt: null,
          optInOffers: true,
          lastVisitAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 86400000)),
          firstVisitAt: Timestamp.fromDate(new Date(Date.now() - cust.totalVisits * 5 * 86400000)),
          isDemo: true,
        }, { merge: true })
      }

      await batch.commit()
      invalidateSettingsCache()
      invalidateProductsCache()
      toast.success('Sample data loaded! 🎉')
    } catch (e) {
      toast.error('Seed failed: ' + (e instanceof Error ? e.message : 'unknown'))
    } finally {
      setSeeding(false)
    }
  }

  const fields: { key: keyof LoyaltySettings; label: string; desc: string }[] = [
    { key: 'pointsPerRupee', label: 'Points per Rupee', desc: '0.1 = 1 point per ₹10' },
    { key: 'pointValueRupees', label: 'Point Value (₹)', desc: '0.25 = 1 pt = ₹0.25 discount' },
    { key: 'loyalWindowDays', label: 'Loyal Window (days)', desc: 'How many days to check for loyalty' },
    { key: 'loyalMinVisits', label: 'Loyal Min Visits', desc: 'Visits needed in window to be loyal' },
    { key: 'loyalMinSpend', label: 'Loyal Min Spend (₹)', desc: 'Spend in window to be loyal' },
    { key: 'silverVisits', label: 'Silver Tier Visits', desc: 'Total visits to reach Silver' },
    { key: 'goldVisits', label: 'Gold Tier Visits', desc: 'Total visits to reach Gold' },
  ]

  return (
    <AdminLayout>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Settings</h2>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : (
        <div className="space-y-5">
          {/* Loyalty settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings size={18} className="text-green-600" /> Loyalty Engine Settings
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map(({ key, label, desc }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings[key]}
                    onChange={(e) => setSettings((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Seed data */}
          <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Database size={18} className="text-amber-600" /> Sample Data
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Load 45 seed products, default loyalty settings, 3 sample coupons (WELCOME10, LOYAL50, WEEKEND5),
              and 6 sample customers with varied visit history. This is idempotent — safe to run multiple times.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {seeding ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Loading...</>
              ) : (
                <><RefreshCw size={16} /> Load Sample Data</>
              )}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
