import React, { useEffect, useState } from 'react'
import { collection, getDocs, setDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/AdminLayout'
import { CouponDoc } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Plus, Tag, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { addDays } from 'date-fns'

interface CouponForm {
  code: string
  type: 'percent' | 'flat'
  value: number
  minBill: number
  maxDiscount: number
  audience: 'all' | 'loyal' | 'customer'
  customerPhone: string
  usageLimit: number
  active: boolean
  validFrom: string
  validTo: string
}

const EMPTY: CouponForm = {
  code: '', type: 'percent', value: 10, minBill: 200, maxDiscount: 100,
  audience: 'all', customerPhone: '', usageLimit: 0, active: true,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: addDays(new Date(), 30).toISOString().slice(0, 10),
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<CouponDoc[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<CouponForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const snap = await getDocs(collection(db, 'coupons'))
    setCoupons(snap.docs.map((d) => d.data() as CouponDoc))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase()
    if (!code) { toast.error('Enter coupon code'); return }
    setSaving(true)
    try {
      await setDoc(doc(db, 'coupons', code), {
        code,
        type: form.type,
        value: Number(form.value),
        minBill: Number(form.minBill),
        maxDiscount: Number(form.maxDiscount),
        audience: form.audience,
        customerPhone: form.customerPhone,
        usageLimit: Number(form.usageLimit),
        usedCount: 0,
        active: form.active,
        validFrom: Timestamp.fromDate(new Date(form.validFrom)),
        validTo: Timestamp.fromDate(new Date(form.validTo)),
        createdBy: 'admin',
        createdAt: serverTimestamp(),
      }, { merge: true })
      toast.success('Coupon saved')
      setModal(false)
      setForm(EMPTY)
      await load()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (code: string, active: boolean) => {
    await updateDoc(doc(db, 'coupons', code), { active: !active })
    await load()
    toast.success(active ? 'Coupon disabled' : 'Coupon enabled')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Coupons</h2>
        <button onClick={() => { setForm(EMPTY); setModal(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : (
        <div className="grid gap-4">
          {coupons.length === 0 && (
            <div className="text-center py-16">
              <Tag size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No coupons yet</p>
            </div>
          )}
          {coupons.map((c) => (
            <div key={c.code} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold font-mono text-lg text-gray-900">{c.code}</div>
                  <div className="text-sm text-gray-500">
                    {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}
                    {c.minBill > 0 ? ` · min ${formatCurrency(c.minBill)}` : ''}
                    {c.maxDiscount > 0 ? ` · max ${formatCurrency(c.maxDiscount)}` : ''}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Audience: {c.audience} · Valid: {formatDate(c.validFrom?.toDate())} – {formatDate(c.validTo?.toDate())}
                  </div>
                  <div className="text-xs text-gray-400">
                    Used: {c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{c.active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => toggleActive(c.code, c.active)}
                    className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2 py-0.5 rounded">
                    {c.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">New Coupon</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:border-green-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'percent' | 'flat' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="percent">Percent %</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                  <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Bill (₹)</label>
                  <input type="number" value={form.minBill} onChange={(e) => setForm((p) => ({ ...p, minBill: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={(e) => setForm((p) => ({ ...p, maxDiscount: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Audience</label>
                <select value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value as 'all' | 'loyal' | 'customer' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="all">All customers</option>
                  <option value="loyal">Loyal only</option>
                  <option value="customer">Specific customer</option>
                </select>
              </div>
              {form.audience === 'customer' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer Phone</label>
                  <input type="tel" value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valid From</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valid To</label>
                  <input type="date" value={form.validTo} onChange={(e) => setForm((p) => ({ ...p, validTo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Usage Limit (0 = unlimited)</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usageLimit: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
