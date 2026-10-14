import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Zap, Gift, Users, ChevronDown, Menu, X, Shield, TrendingUp } from 'lucide-react'
import { LoyaltySettings } from '../lib/types'
import { DEFAULT_SETTINGS, tierEmoji } from '../lib/loyalty'
import { formatCurrency } from '../lib/utils'
import { getLoyaltySettings } from '../lib/firestore'

function useSettings() {
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS)
  useEffect(() => {
    getLoyaltySettings().then(setSettings)
  }, [])
  return settings
}

const faqs = [
  { q: 'How do I earn points?', a: 'You earn 1 point for every ₹10 spent. Bonus points for every 4th visit (+10) and 4-week streaks (+20).' },
  { q: 'How do I redeem points?', a: 'At checkout, the cashier can apply your points—up to 50% of your bill—as a discount.' },
  { q: 'What is a Loyal Customer?', a: 'Visit at least 4 times in 30 days OR spend ₹1,500 in that window. Loyal customers get exclusive coupons and Telegram offers.' },
  { q: 'What is the Telegram integration?', a: 'Link your Telegram account to receive instant receipts, points updates, and weekly personalised offers directly in Telegram.' },
  { q: 'Can walk-in customers (without app) also earn points?', a: 'Yes! Give your phone number at the counter. The cashier registers you on the spot and points are credited immediately.' },
]

export default function LandingPage() {
  const settings = useSettings()
  const [navOpen, setNavOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#rewards', label: 'Rewards' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <div className="bg-green-600 text-white w-9 h-9 rounded-lg flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <span className="text-xl font-extrabold text-green-700">LoyalCart</span>
            </a>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="text-gray-600 hover:text-green-700 font-medium transition-colors">{l.label}</a>
              ))}

              {/* Login dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLoginOpen((p) => !p)}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Login <ChevronDown size={16} className={`transition-transform ${loginOpen ? 'rotate-180' : ''}`} />
                </button>
                {loginOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <Link to="/login?mode=customer" onClick={() => setLoginOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-gray-700">
                      <span className="text-xl">👤</span>
                      <div>
                        <div className="font-semibold text-sm">Customer Login</div>
                        <div className="text-xs text-gray-500">View points & offers</div>
                      </div>
                    </Link>
                    <Link to="/login?mode=staff" onClick={() => setLoginOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 border-t border-gray-100">
                      <span className="text-xl">💼</span>
                      <div>
                        <div className="font-semibold text-sm">Shop / Staff Login</div>
                        <div className="text-xs text-gray-500">POS & Admin access</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setNavOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {navOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setNavOpen(false)}
                className="block py-3 text-gray-700 font-medium border-b border-gray-50 last:border-0">
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 mt-3">
              <Link to="/login?mode=customer" className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg font-semibold text-sm" onClick={() => setNavOpen(false)}>Customer</Link>
              <Link to="/login?mode=staff" className="flex-1 text-center bg-amber-500 text-white py-2 rounded-lg font-semibold text-sm" onClick={() => setNavOpen(false)}>Staff</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 via-white to-amber-50 pt-20 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star size={14} fill="currentColor" /> Smart Loyalty for Neighbourhood Shops
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Earn Points Every Time<br />
            <span className="text-green-600">You Shop With Us</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            LoyalCart turns your everyday grocery shopping into rewards. Earn points, unlock exclusive coupons, and get personalised offers on Telegram — all automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?mode=customer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              <Users size={20} /> Customer Login
            </Link>
            <Link to="/login?mode=staff"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              <Shield size={20} /> Shop / Staff Login
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">Sign in with your Google account. No separate password needed.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How LoyalCart Works</h2>
            <p className="text-gray-500 text-lg">Three simple steps to rewards</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', emoji: '🛒', title: 'Visit & Buy', desc: 'Shop at the store. Give your phone number at checkout to link your points—even without the app.' },
              { step: '2', emoji: '⭐', title: 'Earn Points', desc: `Earn 1 point per ₹${Math.round(1/settings.pointsPerRupee)} spent. Bonus points for streaks and milestones. Points never expire.` },
              { step: '3', emoji: '📱', title: 'Get Offers on Telegram', desc: 'Link your Telegram to receive instant receipts, points summaries, and exclusive weekly offers.' },
            ].map((item) => (
              <div key={item.step} className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold mb-3">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards / Tiers */}
      <section id="rewards" className="py-20 px-4 bg-gradient-to-br from-green-50 to-amber-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Tiers & Rewards</h2>
            <p className="text-gray-500 text-lg">The more you shop, the better it gets</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { tier: 'Bronze', emoji: tierEmoji('Bronze'), visits: 0, next: settings.silverVisits, color: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
              { tier: 'Silver', emoji: tierEmoji('Silver'), visits: settings.silverVisits, next: settings.goldVisits, color: 'border-gray-300 bg-gray-50', badge: 'bg-gray-100 text-gray-800' },
              { tier: 'Gold', emoji: tierEmoji('Gold'), visits: settings.goldVisits, next: null, color: 'border-amber-400 bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
            ].map((t) => (
              <div key={t.tier} className={`rounded-2xl border-2 p-6 text-center ${t.color}`}>
                <div className="text-5xl mb-3">{t.emoji}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${t.badge}`}>{t.tier}</div>
                <p className="text-gray-700 text-sm">
                  {t.visits === 0 ? 'Start here' : `From ${t.visits} visits`}
                </p>
                {t.next && <p className="text-xs text-gray-500 mt-1">Upgrade at {t.next} visits</p>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto text-center">
            <TrendingUp className="text-green-600 mx-auto mb-2" size={28} />
            <h3 className="font-bold text-gray-800 mb-2">Point Value</h3>
            <p className="text-gray-600">
              1 point = {formatCurrency(settings.pointValueRupees)} discount at checkout<br />
              Earn 1 pt per ₹{Math.round(1/settings.pointsPerRupee)} spent
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Everything You Need</h2>
            <p className="text-gray-500 text-lg">Powerful tools for shop owners, simple experience for customers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Instant Billing', desc: 'Barcode-scanner-optimised POS with one-transaction checkout, stock management, and coupon validation.' },
              { icon: Gift, title: 'Smart Coupons', desc: 'Create percent or flat coupons with audience targeting—all customers, loyal only, or personal codes.' },
              { icon: Star, title: 'Loyalty Engine', desc: 'Automatic tier upgrades, streak bonuses, and loyal-customer detection based on visit frequency and spend.' },
              { icon: Users, title: 'Customer Insights', desc: 'Track every customer\'s visit history, spending, tier, and Telegram link status from one admin panel.' },
              { icon: ShoppingCart, title: 'Walk-in Support', desc: 'No account required for customers. Cashier registers phone number on the spot—no friction.' },
              { icon: TrendingUp, title: 'Sales Analytics', desc: 'Daily, weekly, and monthly charts. Top products, low stock alerts, and loyal customer counts.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={20} className="text-green-700" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-gray-800 hover:bg-gray-50"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
            <span className="text-white font-bold">LoyalCart</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} LoyalCart. Built with ❤️ for neighbourhood shops.</p>
          <div className="flex gap-4 text-sm">
            <Link to="/login?mode=customer" className="hover:text-white transition-colors">Customer Login</Link>
            <Link to="/login?mode=staff" className="hover:text-white transition-colors">Staff Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
