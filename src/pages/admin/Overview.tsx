import React, { useEffect, useState } from 'react'
import {
  collection, query, where, getDocs, orderBy, limit,
  Timestamp, getDoc, doc
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/AdminLayout'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { TrendingUp, Users, Star, Package, AlertTriangle } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'

const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminOverview() {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, bills: 0, active: 0, loyal: 0 })
  const [salesData, setSalesData] = useState<{ date: string; sales: number }[]>([])
  const [catData, setCatData] = useState<{ name: string; value: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([])
  const [lowStock, setLowStock] = useState<{ name: string; stock: number; emoji: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const todayStart = startOfDay(now)
      const weekStart = subDays(now, 7)
      const monthStart = subDays(now, 30)

      // Parallel fetch of bills, customers, and products
      const [billsSnap, custSnap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, 'bills'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(collection(db, 'customers')),
        getDocs(query(collection(db, 'products'), where('active', '==', true))),
      ])

      const bills = billsSnap.docs.map((d) => d.data())
      const customers = custSnap.docs.map((d) => d.data())
      const prods = prodSnap.docs.map((d) => d.data())

      const todaySales = bills
        .filter((b) => b.createdAt?.toDate() >= todayStart)
        .reduce((s: number, b: Record<string, number>) => s + (b.total || 0), 0)
      const weekSales = bills
        .filter((b) => b.createdAt?.toDate() >= weekStart)
        .reduce((s: number, b: Record<string, number>) => s + (b.total || 0), 0)
      const monthSales = bills
        .filter((b) => b.createdAt?.toDate() >= monthStart)
        .reduce((s: number, b: Record<string, number>) => s + (b.total || 0), 0)

      // 14-day chart
      const dayMap: Record<string, number> = {}
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(now, i), 'MMM d')
        dayMap[d] = 0
      }
      for (const b of bills) {
        const d = b.createdAt?.toDate()
        if (!d || d < subDays(now, 14)) continue
        const key = format(d, 'MMM d')
        if (key in dayMap) dayMap[key] = (dayMap[key] || 0) + (b.total || 0)
      }
      setSalesData(Object.entries(dayMap).map(([date, sales]) => ({ date, sales })))

      // Category pie from items
      const prodMap: Record<string, { name: string; qty: number }> = {}
      for (const b of bills.slice(0, 100)) {
        for (const item of (b.items || [])) {
          prodMap[item.barcode] = {
            name: item.name,
            qty: (prodMap[item.barcode]?.qty || 0) + item.qty,
          }
        }
      }
      setTopProducts(Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 5))

      const loyalCount = customers.filter((c) => c.isLoyal).length
      setStats({
        today: todaySales,
        week: weekSales,
        month: monthSales,
        bills: bills.length,
        active: customers.length,
        loyal: loyalCount,
      })

      setLowStock(
        prods
          .filter((p) => p.stock <= 10)
          .map((p) => ({ name: p.name, stock: p.stock, emoji: p.emoji }))
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 6)
      )

      setLoading(false)
    }
    load()
  }, [])

  return (
    <AdminLayout>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Overview</h2>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Today's Sales", value: formatCurrency(stats.today), icon: TrendingUp, color: 'green' },
              { label: 'This Week', value: formatCurrency(stats.week), icon: TrendingUp, color: 'blue' },
              { label: 'This Month', value: formatCurrency(stats.month), icon: TrendingUp, color: 'purple' },
              { label: 'Total Bills', value: stats.bills, icon: TrendingUp, color: 'amber' },
              { label: 'Total Customers', value: stats.active, icon: Users, color: 'green' },
              { label: 'Loyal Customers', value: stats.loyal, icon: Star, color: 'amber' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-9 h-9 rounded-lg bg-${color}-100 text-${color}-700 flex items-center justify-center mb-2`}>
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-extrabold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Sales chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">14-Day Sales</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Top products */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">Top Products</h3>
              {topProducts.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{p.name}</span>
                      <span className="font-bold text-gray-900">{p.qty} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
              </h3>
              {lowStock.length === 0 ? (
                <p className="text-gray-400 text-sm">All products well-stocked ✅</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span>{p.emoji} {p.name}</span>
                      <span className={`font-bold ${
                        p.stock === 0 ? 'text-red-600' : p.stock <= 5 ? 'text-amber-600' : 'text-gray-600'
                      }`}>{p.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
