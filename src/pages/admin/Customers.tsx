import React, { useEffect, useState, useMemo } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/AdminLayout'
import { CustomerDoc } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/utils'
import { tierEmoji, tierBadgeColor } from '../../lib/loyalty'
import { Search, Users, Send } from 'lucide-react'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerDoc[]>([])
  const [search, setSearch] = useState('')
  const [loyalFilter, setLoyalFilter] = useState<'all' | 'loyal' | 'not-loyal'>('all')
  const [selected, setSelected] = useState<CustomerDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'customers'), orderBy('totalVisits', 'desc'), limit(500))).then((snap) => {
      const list = snap.docs.map((d) => d.data() as CustomerDoc)
      setCustomers(list)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let list = customers
    if (loyalFilter === 'loyal') list = list.filter((c) => c.isLoyal)
    if (loyalFilter === 'not-loyal') list = list.filter((c) => !c.isLoyal)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
      )
    }
    return list
  }, [customers, search, loyalFilter])

  return (
    <AdminLayout>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Customers</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or phone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none"
          />
        </div>
        <select value={loyalFilter} onChange={(e) => setLoyalFilter(e.target.value as 'all' | 'loyal' | 'not-loyal')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Customers</option>
          <option value="loyal">Loyal Only</option>
          <option value="not-loyal">Not Loyal</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Phone</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Tier</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Visits</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Spent</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Loyal</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Telegram</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.phone} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{c.name}</div>
                      {c.isDemo && <div className="text-xs text-blue-400">Demo</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{c.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tierBadgeColor(c.tier)}`}>
                        {tierEmoji(c.tier)} {c.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{c.totalVisits}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-center">
                      {c.isLoyal ? '🌟' : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.telegramChatId ? <Send size={14} className="text-blue-500 mx-auto" /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(c)} className="text-xs text-green-600 hover:text-green-800 font-medium">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No customers found</p>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Phone</div>
                <div className="font-mono font-medium">{selected.phone}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Tier</div>
                <div className="font-medium">{tierEmoji(selected.tier)} {selected.tier}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Visits</div>
                <div className="font-bold text-lg">{selected.totalVisits}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Total Spent</div>
                <div className="font-bold text-lg">{formatCurrency(selected.totalSpent)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Points</div>
                <div className="font-bold text-lg text-green-600">{selected.points}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Week Streak</div>
                <div className="font-bold text-lg">{selected.visitStreakWeeks}w</div>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Last Visit</div>
                <div className="font-medium">{formatDate(selected.lastVisitAt?.toDate())}</div>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Telegram</div>
                <div className="font-medium">{selected.telegramChatId ? `✅ Linked (ID: ${selected.telegramChatId})` : '❌ Not linked'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
