import { Timestamp } from 'firebase/firestore'

export type Role = 'admin' | 'cashier' | 'customer'
export type Tier = 'Bronze' | 'Silver' | 'Gold'
export type CouponType = 'percent' | 'flat'
export type CouponAudience = 'all' | 'loyal' | 'customer'

export interface UserDoc {
  uid: string
  name: string
  email: string
  photoURL: string
  role: Role
  phone: string
  createdAt: Timestamp
}

export interface CustomerDoc {
  uid: string | null
  name: string
  phone: string
  totalVisits: number
  totalSpent: number
  points: number
  tier: Tier
  isLoyal: boolean
  lastVisitAt: Timestamp | null
  firstVisitAt: Timestamp | null
  visitStreakWeeks: number
  telegramChatId: string | null
  telegramLinkedAt: Timestamp | null
  optInOffers: boolean
  isDemo?: boolean
}

export interface ProductDoc {
  barcode: string
  name: string
  category: string
  price: number
  mrp: number
  unit: string
  stock: number
  emoji: string
  active: boolean
  sortOrder: number
  createdAt: Timestamp
}

export interface BillItem {
  barcode: string
  name: string
  qty: number
  price: number
}

export interface BillDoc {
  billNo: number
  customerPhone: string | null
  customerName: string
  items: BillItem[]
  subtotal: number
  couponCode: string
  couponDiscount: number
  pointsRedeemed: number
  pointsDiscount: number
  total: number
  pointsEarned: number
  cashierUid: string
  cashierName: string
  createdAt: Timestamp
}

export interface VisitDoc {
  customerPhone: string
  billId: string
  amount: number
  createdAt: Timestamp
}

export interface CouponDoc {
  code: string
  type: CouponType
  value: number
  minBill: number
  maxDiscount: number
  validFrom: Timestamp
  validTo: Timestamp
  audience: CouponAudience
  customerPhone: string
  usageLimit: number
  usedCount: number
  active: boolean
  createdBy: string
  createdAt: Timestamp
}

export interface OfferDoc {
  id?: string
  title: string
  description: string
  couponCode: string
  audience: string
  createdAt: Timestamp
  sentCount: number
  failedCount?: number
}

export interface LoyaltySettings {
  pointsPerRupee: number
  pointValueRupees: number
  loyalWindowDays: number
  loyalMinVisits: number
  loyalMinSpend: number
  silverVisits: number
  goldVisits: number
}
