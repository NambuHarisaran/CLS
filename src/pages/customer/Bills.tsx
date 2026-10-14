import React, { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import CustomerLayout from '../../components/CustomerLayout'
import { BillDoc } from '../../lib/types'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react'

export default function CustomerBills() {
  const { userDoc } = useAuth()
  const [bills, setBills] = useState<(BillDoc & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!userDoc?.phone) return
      const snap = await getDocs(
        query(
          collection(db, 'bills'),
          where('customerPhone', '==', userDoc.phone),
          orderBy('createdAt', 'desc'),
          limit(50)
        )
      )
      setBills(snap.docs.map((d) => ({ id: d.id, ...d.data() as BillDoc })))
      setLoading(false)
    }
    load()
  }, [userDoc])

  return (
    <CustomerLayout>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-5">My Bills</h1>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-16">
          <Receipt size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No bills yet. Visit the store to start earning!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Receipt size={18} className="text-green-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Bill #{bill.billNo}</div>
                    <div className="text-xs text-gray-400">{formatDateTime(bill.createdAt?.toDate())}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatCurrency(bill.total)}</div>
                    {bill.pointsEarned > 0 && (
                      <div className="text-xs text-green-600">+{bill.pointsEarned} pts</div>
                    )}
                  </div>
                  {expanded === bill.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {expanded === bill.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-200">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="py-1.5 text-gray-700">{item.name}</td>
                          <td className="text-center text-gray-500">{item.qty}</td>
                          <td className="text-right text-gray-500">{formatCurrency(item.price)}</td>
                          <td className="text-right font-medium">{formatCurrency(item.qty * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span>
                    </div>
                    {bill.couponDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Coupon ({bill.couponCode})</span><span>-{formatCurrency(bill.couponDiscount)}</span>
                      </div>
                    )}
                    {bill.pointsDiscount > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>Points ({bill.pointsRedeemed} pts)</span><span>-{formatCurrency(bill.pointsDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                      <span>Total</span><span>{formatCurrency(bill.total)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Points Earned</span><span>+{bill.pointsEarned} pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  )
}
