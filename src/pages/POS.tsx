import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  collection, doc, getDoc, getDocs, query, where,
  runTransaction, serverTimestamp, setDoc, increment,
  Timestamp, orderBy, limit
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { getActiveProducts, getLoyaltySettings } from '../lib/firestore'
import { useAuth } from '../context/AuthContext'
import {
  ProductDoc, CustomerDoc, CouponDoc, BillItem, LoyaltySettings
} from '../lib/types'
import {
  DEFAULT_SETTINGS, calcPointsEarned, calcPointsDiscount,
  maxRedeemablePoints, getTier, isLoyal, applyCoupon, tierEmoji
} from '../lib/loyalty'
import { formatCurrency, normalisePhone, isValidIndianPhone, formatDateTime } from '../lib/utils'
import {
  ShoppingCart, Scan, Search, User, UserPlus, X, Plus, Minus,
  Receipt, Printer, CheckCircle, AlertTriangle, Tag, Star, Keyboard
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CartItem extends BillItem { stock: number }

function generateBillId() {
  return `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export default function POSPage() {
  const { user, userDoc } = useAuth()

  // Barcode scanner
  const scannerRef = useRef<HTMLInputElement>(null)
  const [scanInput, setScanInput] = useState('')
  const [products, setProducts] = useState<ProductDoc[]>([])
  const [searchResults, setSearchResults] = useState<ProductDoc[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])

  // Customer
  const [phoneInput, setPhoneInput] = useState('')
  const [customer, setCustomer] = useState<CustomerDoc | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [newCustName, setNewCustName] = useState('')

  // Coupon
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDoc | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Points
  const [usePoints, setUsePoints] = useState(false)
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS)

  // Checkout state
  const [checkingOut, setCheckingOut] = useState(false)
  const [bill, setBill] = useState<{ billNo: number; billId: string; total: number; pointsEarned: number } | null>(null)

  // Today's summary
  const [todaySummary, setTodaySummary] = useState({ bills: 0, sales: 0, newCustomers: 0 })

  const productMap = useMemo(() => {
    const map = new Map<string, ProductDoc>()
    for (const p of products) {
      map.set(p.barcode, p)
    }
    return map
  }, [products])

  useEffect(() => {
    Promise.all([getLoyaltySettings(), getActiveProducts()]).then(([sett, prods]) => {
      setSettings(sett)
      setProducts(prods)
    })
    loadTodaySummary()
  }, [])

  // Keyboard shortcuts - attach once with stable ref to avoid listener thrashing on every render
  const handleCheckoutRef = useRef<() => void>(() => {})
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); scannerRef.current?.focus() }
      if (e.key === 'F9') { e.preventDefault(); handleCheckoutRef.current() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function loadTodaySummary() {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const snap = await getDocs(
      query(
        collection(db, 'bills'),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
    )
    const bills = snap.docs.map((d) => d.data())
    const sales = bills.reduce((s: number, b: Record<string, number>) => s + (b.total || 0), 0)
    setTodaySummary({
      bills: bills.length,
      sales,
      newCustomers: 0,
    })
  }

  const addToCart = useCallback((product: ProductDoc) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.barcode === product.barcode)
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Only ${product.stock} in stock`)
          return prev
        }
        return prev.map((i) =>
          i.barcode === product.barcode ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { barcode: product.barcode, name: product.name, qty: 1, price: product.price, stock: product.stock }]
    })
    setShowSearch(false)
    setSearchResults([])
    setScanInput('')
    setTimeout(() => scannerRef.current?.focus(), 50)
  }, [])

  const handleScanEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const val = scanInput.trim()
    if (!val) return
    // Exact barcode match with O(1) map
    const exact = productMap.get(val)
    if (exact) { addToCart(exact); return }
    // Fuzzy search
    const valLower = val.toLowerCase()
    const results = products.filter((p) =>
      p.name.toLowerCase().includes(valLower) || p.barcode.includes(val)
    )
    if (results.length === 1) { addToCart(results[0]); return }
    setSearchResults(results)
    setShowSearch(results.length > 0)
    if (results.length === 0) toast.error('Product not found')
  }

  const removeFromCart = (barcode: string) => {
    setCart((prev) => prev.filter((i) => i.barcode !== barcode))
  }

  const changeQty = (barcode: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.barcode !== barcode) return i
          const newQty = i.qty + delta
          if (newQty > i.stock) { toast.error(`Only ${i.stock} in stock`); return i }
          return { ...i, qty: Math.max(0, newQty) }
        })
        .filter((i) => i.qty > 0)
    )
  }

  const lookupCustomer = async () => {
    const norm = normalisePhone(phoneInput)
    if (!isValidIndianPhone(norm)) { toast.error('Enter a valid 10-digit mobile'); return }
    setCustomerLoading(true)
    try {
      const snap = await getDoc(doc(db, 'customers', norm))
      if (snap.exists()) {
        setCustomer(snap.data() as CustomerDoc)
        setShowRegister(false)
      } else {
        setCustomer(null)
        setShowRegister(true)
      }
    } finally {
      setCustomerLoading(false)
    }
  }

  const registerCustomer = async () => {
    if (!newCustName.trim()) { toast.error('Enter customer name'); return }
    const norm = normalisePhone(phoneInput)
    if (!isValidIndianPhone(norm)) { toast.error('Invalid phone'); return }
    const newDoc: CustomerDoc = {
      uid: null,
      name: newCustName.trim(),
      phone: norm,
      totalVisits: 0,
      totalSpent: 0,
      points: 0,
      tier: 'Bronze',
      isLoyal: false,
      lastVisitAt: null,
      firstVisitAt: null,
      visitStreakWeeks: 0,
      telegramChatId: null,
      telegramLinkedAt: null,
      optInOffers: true,
    }
    await setDoc(doc(db, 'customers', norm), { ...newDoc, createdAt: serverTimestamp() })
    setCustomer(newDoc)
    setShowRegister(false)
    toast.success('Customer registered!')
  }

  const applyCouponCode = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    try {
      const snap = await getDoc(doc(db, 'coupons', code))
      if (!snap.exists()) { toast.error('Coupon not found'); return }
      const c = snap.data() as CouponDoc
      const now = Timestamp.now()
      if (!c.active) { toast.error('Coupon is inactive'); return }
      if (c.validFrom > now) { toast.error('Coupon not valid yet'); return }
      if (c.validTo < now) { toast.error('Coupon expired'); return }
      if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) { toast.error('Coupon limit reached'); return }
      if (c.audience === 'loyal' && !customer?.isLoyal) { toast.error('This coupon is for loyal customers only'); return }
      if (c.audience === 'customer' && c.customerPhone !== customer?.phone) { toast.error('This coupon is not for this customer'); return }
      if (c.minBill > subtotal) { toast.error(`Minimum bill ${formatCurrency(c.minBill)} required`); return }
      setAppliedCoupon(c)
      toast.success('Coupon applied!')
    } finally {
      setCouponLoading(false)
    }
  }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.price, 0), [cart])
  const cartTotalItems = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])
  const couponDiscount = useMemo(() => (appliedCoupon ? applyCoupon(subtotal, appliedCoupon) : 0), [appliedCoupon, subtotal])
  const maxRedeem = useMemo(
    () => (customer && usePoints ? maxRedeemablePoints(subtotal, couponDiscount, customer.points, settings) : 0),
    [customer, usePoints, subtotal, couponDiscount, settings]
  )
  const pointsDiscount = useMemo(() => calcPointsDiscount(maxRedeem, settings), [maxRedeem, settings])
  const total = useMemo(() => Math.max(0, subtotal - couponDiscount - pointsDiscount), [subtotal, couponDiscount, pointsDiscount])

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    if (checkingOut) return
    setCheckingOut(true)
    try {
      const billId = generateBillId()
      let billNo = 1

      await runTransaction(db, async (tx) => {
        // Load counter
        const counterRef = doc(db, 'counters', 'bills')
        const counterSnap = await tx.get(counterRef)
        billNo = counterSnap.exists() ? (counterSnap.data().next as number) : 1

        // Validate stock and decrement
        for (const item of cart) {
          const pRef = doc(db, 'products', item.barcode)
          const pSnap = await tx.get(pRef)
          if (!pSnap.exists()) throw new Error(`Product ${item.name} not found`)
          const currentStock = pSnap.data().stock as number
          if (currentStock < item.qty) throw new Error(`Insufficient stock for ${item.name}`)
          tx.update(pRef, { stock: currentStock - item.qty })
        }

        // Points and tier computation
        let newVisits = 1, newSpent = total, newPoints = 0, streakWeeks = 0
        let newIsLoyal = false
        if (customer) {
          const custRef = doc(db, 'customers', customer.phone)
          const custSnap = await tx.get(custRef)
          if (custSnap.exists()) {
            const c = custSnap.data() as CustomerDoc
            newVisits = c.totalVisits + 1
            newSpent = c.totalSpent + total
            streakWeeks = c.visitStreakWeeks || 0
            const earned = calcPointsEarned(total, newVisits, streakWeeks, settings)
            newPoints = (c.points - (usePoints ? maxRedeem : 0)) + earned
            const newTier = getTier(newVisits, settings)

            // Recompute loyal with simple heuristic
            const windowStart = Date.now() - settings.loyalWindowDays * 86400000
            const recentEnough = c.lastVisitAt ? c.lastVisitAt.toDate().getTime() > windowStart : false
            const recentVisitsEst = recentEnough ? Math.min(c.totalVisits, settings.loyalMinVisits + 1) : 0
            newIsLoyal = isLoyal(recentVisitsEst + 1, (recentEnough ? c.totalSpent * 0.3 : 0) + total, settings)

            tx.update(custRef, {
              totalVisits: newVisits,
              totalSpent: newSpent,
              points: newPoints,
              tier: newTier,
              isLoyal: newIsLoyal,
              lastVisitAt: serverTimestamp(),
              firstVisitAt: c.firstVisitAt || serverTimestamp(),
            })

            // Bill's points earned
            const earnedFinal = calcPointsEarned(total, newVisits, streakWeeks, settings)

            // Create visit
            const visitRef = doc(collection(db, 'visits'))
            tx.set(visitRef, {
              customerPhone: customer.phone,
              billId,
              amount: total,
              createdAt: serverTimestamp(),
            })

            // Create bill
            tx.set(doc(db, 'bills', billId), {
              billNo,
              customerPhone: customer.phone,
              customerName: customer.name,
              items: cart.map((i) => ({ barcode: i.barcode, name: i.name, qty: i.qty, price: i.price })),
              subtotal,
              couponCode: appliedCoupon?.code || '',
              couponDiscount,
              pointsRedeemed: usePoints ? maxRedeem : 0,
              pointsDiscount,
              total,
              pointsEarned: earnedFinal,
              cashierUid: user!.uid,
              cashierName: userDoc?.name || '',
              createdAt: serverTimestamp(),
            })

            // Increment coupon usedCount
            if (appliedCoupon) {
              tx.update(doc(db, 'coupons', appliedCoupon.code), { usedCount: increment(1) })
            }

            // Update counter
            tx.set(counterRef, { next: billNo + 1 }, { merge: true })

            setBill({ billNo, billId, total, pointsEarned: earnedFinal })
          }
        } else {
          // Walk-in (no customer)
          const earnedFinal = calcPointsEarned(total, 1, 0, settings)
          tx.set(doc(db, 'bills', billId), {
            billNo,
            customerPhone: null,
            customerName: 'Walk-in',
            items: cart.map((i) => ({ barcode: i.barcode, name: i.name, qty: i.qty, price: i.price })),
            subtotal,
            couponCode: '',
            couponDiscount: 0,
            pointsRedeemed: 0,
            pointsDiscount: 0,
            total,
            pointsEarned: 0,
            cashierUid: user!.uid,
            cashierName: userDoc?.name || '',
            createdAt: serverTimestamp(),
          })
          tx.set(counterRef, { next: billNo + 1 }, { merge: true })
          setBill({ billNo, billId, total, pointsEarned: 0 })
        }
      })

      toast.success(`Bill #${billNo} created!`)

      // Fire and forget: notify via Telegram
      if (customer?.telegramChatId && user) {
        user.getIdToken().then((token) => {
          fetch('/api/notify-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              customerPhone: customer.phone,
              billId,
              total,
              pointsEarned: calcPointsEarned(total, (customer.totalVisits || 0) + 1, customer.visitStreakWeeks || 0, settings),
            }),
          }).catch(() => {})
        })
      }

      await loadTodaySummary()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }
  handleCheckoutRef.current = handleCheckout

  const resetAfterBill = () => {
    setCart([])
    setCustomer(null)
    setPhoneInput('')
    setAppliedCoupon(null)
    setCouponInput('')
    setUsePoints(false)
    setBill(null)
    setTimeout(() => scannerRef.current?.focus(), 50)
  }

  if (bill) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 print-receipt">
          <div className="text-center mb-4">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
            <h2 className="text-2xl font-extrabold text-gray-900">Bill #{bill.billNo}</h2>
            <p className="text-gray-500 text-sm">{formatDateTime(new Date())}</p>
          </div>

          <div className="border-t border-dashed border-gray-300 py-4 space-y-2">
            {cart.map((item) => (
              <div key={item.barcode} className="flex justify-between text-sm">
                <span>{item.name} × {item.qty}</span>
                <span>{formatCurrency(item.qty * item.price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Coupon</span><span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-blue-700">
                <span>Points</span><span>-{formatCurrency(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-lg pt-1">
              <span>TOTAL</span><span>{formatCurrency(bill.total)}</span>
            </div>
            {bill.pointsEarned > 0 && (
              <div className="flex justify-between text-green-600 text-sm">
                <span>Points Earned</span><span>+{bill.pointsEarned} pts</span>
              </div>
            )}
          </div>

          {customer && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-center">
              <div className="font-semibold text-green-800">{customer.name} {tierEmoji(customer.tier)}</div>
              <div className="text-green-600">Thank you for shopping!</div>
            </div>
          )}

          <div className="mt-4 flex gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={resetAfterBill}
              className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-700"
            >
              New Bill
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} />
          <span className="font-bold text-lg">LoyalCart POS</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>Bills: <b>{todaySummary.bills}</b></span>
          <span>Sales: <b>{formatCurrency(todaySummary.sales)}</b></span>
          <span className="hidden sm:inline">Cashier: <b>{userDoc?.name}</b></span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Left: Scanner + Cart */}
        <div className="space-y-4">
          {/* Scanner */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Scan size={18} className="text-green-700" />
              <span className="font-semibold text-gray-800">Barcode Scanner</span>
              <span className="text-xs text-gray-400 ml-auto">Press F2 to focus</span>
            </div>
            <div className="flex gap-2">
              <input
                ref={scannerRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={handleScanEnter}
                placeholder="Scan barcode or type product name..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none font-mono"
                autoFocus
              />
              <button
                onClick={() => {
                  const results = products.filter((p) =>
                    p.name.toLowerCase().includes(scanInput.toLowerCase()) || p.barcode.includes(scanInput)
                  )
                  setSearchResults(results)
                  setShowSearch(true)
                }}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                title="Search"
              >
                <Search size={18} />
              </button>
            </div>

            {/* Search results */}
            {showSearch && searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.barcode}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-green-50 border-b border-gray-100 last:border-0 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{p.emoji}</span>
                      <div className="text-left">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.barcode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(p.price)}</div>
                      <div className="text-xs text-gray-400">Stock: {p.stock}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Cart ({cart.length} items)</span>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty. Scan a product to add.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-gray-500 font-medium">Product</th>
                      <th className="text-center px-2 py-2 text-gray-500 font-medium">Qty</th>
                      <th className="text-right px-4 py-2 text-gray-500 font-medium">Total</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.barcode} className="border-t border-gray-100">
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-400">{formatCurrency(item.price)} each</div>
                          {item.qty >= item.stock && (
                            <div className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertTriangle size={12} /> Low stock
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => changeQty(item.barcode, -1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-bold">{item.qty}</span>
                            <button onClick={() => changeQty(item.barcode, 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.qty * item.price)}</td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeFromCart(item.barcode)} className="text-red-400 hover:text-red-600">
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer + Payment */}
        <div className="space-y-4">
          {/* Customer lookup */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-green-700" />
              <span className="font-semibold text-gray-800">Customer</span>
            </div>

            {!customer ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupCustomer()}
                    placeholder="Phone number"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
                    maxLength={10}
                  />
                  <button
                    onClick={lookupCustomer}
                    disabled={customerLoading}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {customerLoading ? '...' : 'Find'}
                  </button>
                </div>

                {showRegister && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-800 mb-2 flex items-center gap-1">
                      <UserPlus size={12} /> New customer. Register?
                    </p>
                    <input
                      type="text"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="Customer name"
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={registerCustomer}
                        className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
                      >
                        Register
                      </button>
                      <button
                        onClick={() => { setShowRegister(false); setPhoneInput('') }}
                        className="flex-1 border border-gray-300 py-2 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setCustomer(null); setShowRegister(false); setPhoneInput('') }}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Skip (walk-in)
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-semibold text-green-800">{customer.name} {tierEmoji(customer.tier)}</div>
                  <div className="text-xs text-green-600">{customer.points} pts · {customer.tier}</div>
                  {customer.isLoyal && <div className="text-xs text-amber-700">🌟 Loyal</div>}
                </div>
                <button onClick={() => { setCustomer(null); setPhoneInput('') }} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={18} className="text-green-700" />
              <span className="font-semibold text-gray-800">Coupon</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-bold text-green-800 font-mono">{appliedCoupon.code}</div>
                  <div className="text-xs text-green-600">-{formatCurrency(couponDiscount)}</div>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && applyCouponCode()}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-green-500 outline-none uppercase"
                />
                <button
                  onClick={applyCouponCode}
                  disabled={couponLoading}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Points */}
          {customer && customer.points > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-amber-500" />
                <span className="font-semibold text-gray-800">Points Redemption</span>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm text-gray-700">Use {maxRedeemablePoints(subtotal, couponDiscount, customer.points, settings)} pts</div>
                  <div className="text-xs text-gray-400">= {formatCurrency(calcPointsDiscount(maxRedeemablePoints(subtotal, couponDiscount, customer.points, settings), settings))} off</div>
                </div>
                <div
                  onClick={() => setUsePoints((p) => !p)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    usePoints ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    usePoints ? 'translate-x-5' : ''
                  }`} />
                </div>
              </label>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cartTotalItems} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon</span><span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>Points</span><span>-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xl pt-2 border-t border-gray-100">
                <span>Total</span><span className="text-green-700">{formatCurrency(total)}</span>
              </div>
              {customer && (
                <div className="text-xs text-green-600 text-right">
                  Will earn ~{calcPointsEarned(total, (customer.totalVisits || 0) + 1, customer.visitStreakWeeks || 0, settings)} pts
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut || cart.length === 0}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkingOut ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <><Receipt size={20} /> Checkout (F9)</>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <Keyboard size={12} /> F2: focus scanner · F9: checkout
          </div>
        </div>
      </div>
    </div>
  )
}
