import React, { useEffect, useState } from 'react'
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import CustomerLayout from '../../components/CustomerLayout'
import OnboardingModal from '../../components/OnboardingModal'
import { CustomerDoc, LoyaltySettings } from '../../lib/types'
import { getLoyaltySettings } from '../../lib/firestore'
import {
  DEFAULT_SETTINGS, getTier, tierEmoji, tierBadgeColor,
  nextTierVisits, loyalProgress
} from '../../lib/loyalty'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Star, TrendingUp, Calendar, Award } from 'lucide-react'
import { differenceInDays } from 'date-fns'

export default function CustomerDashboard() {
  const { userDoc, user } = useAuth()
  const [customer, setCustomer] = useState<CustomerDoc | null>(null)
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS)
  const [recentVisits, setRecentVisits] = useState(0)
  const [recentSpend, setRecentSpend] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (userDoc && !userDoc.phone) setShowOnboarding(true)
    else setShowOnboarding(false)
  }, [userDoc])

  useEffect(() => {
    async function load() {
      if (!userDoc?.phone) return
      const [custSnap, sett] = await Promise.all([
        getDoc(doc(db, 'customers', userDoc.phone)),
        getLoyaltySettings(),
      ])
      const cust = custSnap.exists() ? (custSnap.data() as CustomerDoc) : null

      let visitsCount = 0
      let spendTotal = 0

      if (cust) {
        const windowStart = Timestamp.fromDate(
          new Date(Date.now() - sett.loyalWindowDays * 86400000)
        )
        const vSnap = await getDocs(
          query(
            collection(db, 'visits'),
            where('customerPhone', '==', userDoc.phone),
            where('createdAt', '>=', windowStart),
            orderBy('createdAt', 'desc'),
            limit(100)
          )
        )
        visitsCount = vSnap.size
        spendTotal = vSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0)
      }

      setCustomer(cust)
      setSettings(sett)
      setRecentVisits(visitsCount)
      setRecentSpend(spendTotal)
      setLoading(false)
    }
    load()
  }, [userDoc])

  if (showOnboarding) {
    return <OnboardingModal onComplete={() => setShowOnboarding(false)} />
  }

  const tier = customer ? getTier(customer.totalVisits, settings) : 'Bronze'
  const nextTier = nextTierVisits(tier, settings)
  const tierProgress = tier === 'Gold' ? 100 : Math.min(100, Math.round((customer?.totalVisits || 0) / nextTier * 100))

  const windowDaysLeft = customer?.lastVisitAt
    ? Math.max(0, settings.loyalWindowDays - differenceInDays(new Date(), customer.lastVisitAt.toDate()))
    : settings.loyalWindowDays

  const loyalMsg = customer
    ? loyalProgress(recentVisits, recentSpend, windowDaysLeft, settings)
    : `Visit ${settings.loyalMinVisits} times in ${settings.loyalWindowDays} days to become Loyal`

  return (
    <CustomerLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Hi, {userDoc?.name || 'there'} 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">Here's your loyalty summary</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Points Balance', value: customer?.points || 0, sub: `= ${formatCurrency((customer?.points || 0) * settings.pointValueRupees)}`, icon: Star, color: 'bg-green-50 text-green-700' },
              { label: 'Total Visits', value: customer?.totalVisits || 0, sub: `${recentVisits} in last ${settings.loyalWindowDays}d`, icon: Calendar, color: 'bg-blue-50 text-blue-700' },
              { label: 'Total Spent', value: formatCurrency(customer?.totalSpent || 0), sub: `${formatCurrency(recentSpend)} recent`, icon: TrendingUp, color: 'bg-purple-50 text-purple-700' },
              { label: 'Week Streak', value: `${customer?.visitStreakWeeks || 0} wks`, sub: customer?.visitStreakWeeks && customer.visitStreakWeeks >= 4 ? '+20 bonus pts!' : 'Visit weekly for bonus', icon: Award, color: 'bg-amber-50 text-amber-700' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-2`}>
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-extrabold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Tier card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{tierEmoji(tier)}</span>
                <div>
                  <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${tierBadgeColor(tier)}`}>{tier} Member</span>
                  <p className="text-gray-500 text-xs mt-0.5">{customer?.totalVisits || 0} lifetime visits</p>
                </div>
              </div>
              {tier !== 'Gold' && (
                <div className="text-right">
                  <span className="text-xs text-gray-500">Next: {tier === 'Bronze' ? 'Silver' : 'Gold'} at {nextTier} visits</span>
                </div>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  tier === 'Gold' ? 'bg-amber-400' : tier === 'Silver' ? 'bg-gray-400' : 'bg-orange-400'
                }`}
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{customer?.totalVisits || 0} visits</span>
              <span>{tier === 'Gold' ? 'Max tier!' : `${nextTier} visits`}</span>
            </div>
          </div>

          {/* Loyal status */}
          <div className={`rounded-xl p-4 border ${
            customer?.isLoyal
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{customer?.isLoyal ? '🌟' : '⏳'}</span>
              <div>
                <div className="font-semibold">{customer?.isLoyal ? 'Loyal Customer' : 'Building Loyalty'}</div>
                <div className="text-sm opacity-80">{loyalMsg}</div>
              </div>
            </div>
          </div>

          {/* Last visit */}
          {customer?.lastVisitAt && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <Calendar size={20} className="text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Last Visit</div>
                <div className="text-xs text-gray-400">{formatDate(customer.lastVisitAt.toDate())}</div>
              </div>
              <div className="ml-auto">
                <div className="text-sm font-medium text-gray-700">Member Since</div>
                <div className="text-xs text-gray-400">{formatDate(customer.firstVisitAt?.toDate())}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </CustomerLayout>
  )
}
