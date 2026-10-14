import {
  doc, getDoc, getDocs, collection, query, where,
  orderBy, limit, Timestamp, DocumentData, QueryConstraint
} from 'firebase/firestore'
import { db } from './firebase'
import { CustomerDoc, LoyaltySettings, ProductDoc, BillDoc, CouponDoc } from './types'
import { DEFAULT_SETTINGS } from './loyalty'

export async function getCustomerByPhone(phone: string): Promise<CustomerDoc | null> {
  const snap = await getDoc(doc(db, 'customers', phone))
  return snap.exists() ? (snap.data() as CustomerDoc) : null
}

export async function getProductByBarcode(barcode: string): Promise<ProductDoc | null> {
  const snap = await getDoc(doc(db, 'products', barcode))
  return snap.exists() ? (snap.data() as ProductDoc) : null
}

let cachedLoyaltySettings: { data: LoyaltySettings; expiry: number } | null = null
let cachedProducts: { data: ProductDoc[]; expiry: number } | null = null

export async function getLoyaltySettings(forceRefresh = false): Promise<LoyaltySettings> {
  const now = Date.now()
  if (!forceRefresh && cachedLoyaltySettings && cachedLoyaltySettings.expiry > now) {
    return cachedLoyaltySettings.data
  }
  const snap = await getDoc(doc(db, 'settings', 'loyalty'))
  const data = snap.exists() ? (snap.data() as LoyaltySettings) : DEFAULT_SETTINGS
  cachedLoyaltySettings = { data, expiry: now + 5 * 60 * 1000 }
  return data
}

export async function getActiveProducts(forceRefresh = false): Promise<ProductDoc[]> {
  const now = Date.now()
  if (!forceRefresh && cachedProducts && cachedProducts.expiry > now) {
    return cachedProducts.data
  }
  const snap = await getDocs(collection(db, 'products'))
  const data = snap.docs.map((d) => d.data() as ProductDoc).filter((p) => p.active)
  cachedProducts = { data, expiry: now + 3 * 60 * 1000 }
  return data
}

export function invalidateProductsCache() {
  cachedProducts = null
}

export function invalidateSettingsCache() {
  cachedLoyaltySettings = null
}

export async function getActiveCoupons(phone?: string): Promise<CouponDoc[]> {
  const now = Timestamp.now()
  const constraints: QueryConstraint[] = [
    where('active', '==', true),
    where('validTo', '>=', now),
  ]
  const snap = await getDocs(query(collection(db, 'coupons'), ...constraints))
  return snap.docs.map((d) => d.data() as CouponDoc).filter((c) => {
    if (c.audience === 'all') return true
    if (c.audience === 'customer' && c.customerPhone === phone) return true
    return false
  })
}

export async function getCustomerBills(phone: string, limitCount = 20): Promise<(BillDoc & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, 'bills'),
      where('customerPhone', '==', phone),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() as BillDoc }))
}
