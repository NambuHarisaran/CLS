import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, addDoc, doc, updateDoc,
  serverTimestamp, query, where, getDoc
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/AdminLayout'
import { OfferDoc } from '../../lib/types'
import { formatDateTime } from '../../lib/utils'
import { Megaphone, Plus, Send, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function AdminOffers() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<(OfferDoc & { id: string })[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', couponCode: '', audience: 'all' })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const snap = await getDocs(collection(db, 'offers'))
    setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() as OfferDoc })).reverse())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.title || !form.description) { toast.error('Title and description required'); return }
    setSaving(true)
    try {
      await addDoc(collection(db, 'offers'), {
        title: form.title,
        description: form.description,
        couponCode: form.couponCode,
        audience: form.audience,
        sentCount: 0,
        failedCount: 0,
        createdAt: serverTimestamp(),
      })
      toast.success('Offer created')
      setModal(false)
      setForm({ title: '', description: '', couponCode: '', audience: 'all' })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (offer: OfferDoc & { id: string }) => {
    if (!user) return
    setSending(offer.id)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/send-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ offerId: offer.id, audience: offer.audience }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Sent: ${data.sent}, Failed: ${data.failed}`)
        await load()
      } else {
        toast.error(data.error || 'Send failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSending(null)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Offers & Campaigns</h2>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={16} /> New Offer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No offers yet. Create your first campaign!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{offer.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {offer.couponCode && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-mono">
                        {offer.couponCode}
                      </span>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {offer.audience}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(offer.createdAt?.toDate ? offer.createdAt.toDate() : undefined)}
                    </span>
                  </div>
                  {(offer.sentCount > 0 || (offer.failedCount ?? 0) > 0) && (
                    <div className="text-xs text-gray-400 mt-1">
                      Sent: {offer.sentCount} · Failed: {offer.failedCount ?? 0}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSend(offer)}
                  disabled={sending === offer.id}
                  className="ml-4 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending === offer.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <><Send size={14} /> Send</>  
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">New Offer / Campaign</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Attach Coupon Code (optional)</label>
                <input type="text" value={form.couponCode} onChange={(e) => setForm((p) => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Audience</label>
                <select value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="all">All linked customers</option>
                  <option value="loyal">Loyal customers only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
