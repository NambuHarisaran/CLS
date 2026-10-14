import React, { useEffect, useState } from 'react'
import { getActiveCoupons } from '../../lib/firestore'
import { useAuth } from '../../context/AuthContext'
import CustomerLayout from '../../components/CustomerLayout'
import { CouponDoc } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Tag, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomerCoupons() {
  const { userDoc } = useAuth()
  const [coupons, setCoupons] = useState<CouponDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const active = await getActiveCoupons(userDoc?.phone)
      setCoupons(active)
      setLoading(false)
    }
    load()
  }, [userDoc?.phone])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success('Code copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <CustomerLayout>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-5">My Coupons</h1>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active coupons right now. Keep shopping to unlock exclusive offers!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((c) => (
            <div key={c.code} className="bg-white rounded-xl border-2 border-dashed border-green-200 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Tag size={20} className="text-green-700" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 font-mono text-lg">{c.code}</div>
                  {c.minBill > 0 && <div className="text-xs text-gray-500">Min. bill {formatCurrency(c.minBill)}</div>}
                </div>
              </div>
              {c.maxDiscount > 0 && (
                <div className="text-sm text-gray-600 mb-2">Max discount: {formatCurrency(c.maxDiscount)}</div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">Valid till {formatDate(c.validTo?.toDate())}</div>
                <button
                  onClick={() => handleCopy(c.code)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800"
                >
                  {copied === c.code ? <Check size={16} /> : <Copy size={16} />}
                  {copied === c.code ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  )
}
