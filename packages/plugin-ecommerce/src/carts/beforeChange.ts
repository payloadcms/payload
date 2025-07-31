import type { CollectionBeforeChangeHook } from 'payload'

import { getCouponDiscountValue } from '../utilities/getCouponDiscountValue.js'

type Props = {
  couponsSlug: string
  productsSlug: string
  variantsSlug: string
}

export const beforeChangeCart: (args: Props) => CollectionBeforeChangeHook =
  ({ couponsSlug, productsSlug, variantsSlug }) =>
  async ({ data, req }) => {
    const payload = req.payload

    if (data.items && Array.isArray(data.items)) {
      const priceField = `priceIn${data.currency}`

      let subtotal = 0
      let totalItemsDiscount = 0
      let totalCartDiscount = 0

      for (const item of data.items) {
        if (item.variant) {
          const id = typeof item.variant === 'object' ? item.variant.id : item.variant

          const variant = await req.payload.findByID({
            id,
            collection: variantsSlug,
            depth: 0,
            select: {
              [priceField]: true,
            },
          })

          const itemAmount = variant[priceField] * item.quantity
          subtotal += itemAmount

          if (Array.isArray(item.discount?.discountLines)) {
            for (const discountLine of item.discount.discountLines) {
              const coupon = await payload.findByID({
                id: discountLine.coupon,
                collection: couponsSlug,
              })

              discountLine.amount = discountLine.amount ?? 0
              discountLine.amount += getCouponDiscountValue(itemAmount, coupon)
              item.discount.amount += discountLine.amount

              totalItemsDiscount += item.discount.amount
            }
          }
        } else {
          const id = typeof item.product === 'object' ? item.product.id : item.product

          const product = await req.payload.findByID({
            id,
            collection: productsSlug,
            depth: 0,
            select: {
              [priceField]: true,
            },
          })

          const itemAmount = product[priceField] * item.quantity
          subtotal += itemAmount

          if (Array.isArray(item.discount?.discountLines)) {
            for (const discountLine of item.discount.discountLines) {
              const coupon = await payload.findByID({
                id: discountLine.coupon,
                collection: couponsSlug,
              })

              discountLine.amount = discountLine.amount ?? 0
              discountLine.amount += getCouponDiscountValue(itemAmount, coupon)
              if (!item.discount.total) {
                item.discount.total = 0
              }
              item.discount.total += discountLine.amount
              totalItemsDiscount += item.discount.total
            }
          }
        }
      }

      for (const discountLine of data.discount?.discountLines ?? []) {
        const coupon = await payload.findByID({
          id: discountLine.coupon,
          collection: couponsSlug,
        })

        discountLine.amount = getCouponDiscountValue(subtotal, coupon)
        totalCartDiscount += discountLine.amount
      }

      data.subtotal = subtotal
      data.discount = data.discount ?? {}
      data.discount.cartAmount = totalCartDiscount
      data.discount.lineItemsAmount = totalItemsDiscount
      data.discount.totalAmount = totalCartDiscount + totalItemsDiscount
      data.total = subtotal + data.discount.totalAmount
    } else {
      data.subtotal = 0
      data.discount.cartAmount = 0
      data.discount.lineItemsAmount = 0
      data.discount.totalAmount = 0
      data.total = 0
    }
  }
