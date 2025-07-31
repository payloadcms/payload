export function getCouponDiscountValue(baseAmount: number, coupon: any) {
  if (coupon.type === 'flat') {
    if (coupon.value > baseAmount) {
      return 0
    }

    return coupon.value * -1
  }

  return baseAmount * (coupon.value / 100) * -1
}
