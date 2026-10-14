import { LoyaltySettings, Tier } from './types'

export const DEFAULT_SETTINGS: LoyaltySettings = {
  pointsPerRupee: 0.1,
  pointValueRupees: 0.25,
  loyalWindowDays: 30,
  loyalMinVisits: 4,
  loyalMinSpend: 1500,
  silverVisits: 8,
  goldVisits: 16,
}

export function getTier(totalVisits: number, settings: LoyaltySettings): Tier {
  if (totalVisits >= settings.goldVisits) return 'Gold'
  if (totalVisits >= settings.silverVisits) return 'Silver'
  return 'Bronze'
}

export function calcPointsEarned(
  total: number,
  lifetimeVisitAfterThis: number,
  streakWeeks: number,
  settings: LoyaltySettings
): number {
  let pts = Math.floor(total * settings.pointsPerRupee)
  if (lifetimeVisitAfterThis % 4 === 0) pts += 10
  if (streakWeeks >= 4) pts += 20
  return pts
}

export function calcPointsDiscount(points: number, settings: LoyaltySettings): number {
  return points * settings.pointValueRupees
}

export function maxRedeemablePoints(
  subtotal: number,
  couponDiscount: number,
  points: number,
  settings: LoyaltySettings
): number {
  const afterCoupon = subtotal - couponDiscount
  const maxDiscount = afterCoupon * 0.5
  const maxFromPoints = maxDiscount / settings.pointValueRupees
  return Math.min(points, Math.floor(maxFromPoints))
}

export function isLoyal(
  recentVisits: number,
  recentSpend: number,
  settings: LoyaltySettings
): boolean {
  return (
    recentVisits >= settings.loyalMinVisits || recentSpend >= settings.loyalMinSpend
  )
}

export function loyalProgress(
  recentVisits: number,
  recentSpend: number,
  windowDaysLeft: number,
  settings: LoyaltySettings
): string {
  if (isLoyal(recentVisits, recentSpend, settings)) return 'You are a Loyal Customer! 🌟'
  const visitsNeeded = settings.loyalMinVisits - recentVisits
  const spendNeeded = settings.loyalMinSpend - recentSpend
  if (visitsNeeded <= 0 || spendNeeded <= 0) return 'You are a Loyal Customer! 🌟'
  return `${visitsNeeded} more visit${visitsNeeded > 1 ? 's' : ''} in the next ${windowDaysLeft} day${windowDaysLeft > 1 ? 's' : ''} to become Loyal`
}

export function applyCoupon(
  subtotal: number,
  coupon: {
    type: 'percent' | 'flat'
    value: number
    minBill: number
    maxDiscount: number
  }
): number {
  if (subtotal < coupon.minBill) return 0
  let discount =
    coupon.type === 'percent'
      ? (subtotal * coupon.value) / 100
      : coupon.value
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount)
  return Math.floor(discount)
}

export function tierBadgeColor(tier: Tier): string {
  switch (tier) {
    case 'Gold': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'Silver': return 'bg-gray-100 text-gray-700 border-gray-300'
    default: return 'bg-orange-100 text-orange-700 border-orange-300'
  }
}

export function tierEmoji(tier: Tier): string {
  switch (tier) {
    case 'Gold': return '🥇'
    case 'Silver': return '🥈'
    default: return '🥉'
  }
}

export function nextTierVisits(tier: Tier, settings: LoyaltySettings): number {
  switch (tier) {
    case 'Bronze': return settings.silverVisits
    case 'Silver': return settings.goldVisits
    default: return settings.goldVisits
  }
}
