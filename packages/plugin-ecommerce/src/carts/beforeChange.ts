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
    try {
      const payload = req.payload
      if (data.items && Array.isArray(data.items)) {
        const priceField = `priceIn${data.currency}`

        let subtotal = 0
        const totalItemsDiscount = 0
        const totalCartDiscount = 0

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
            // if (item.coupon) {
            //   totalItemsDiscount += getCouponDiscountValue(itemAmount, item.coupon)
            // }
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
            // if (item.coupon) {
            //   totalItemsDiscount += getCouponDiscountValue(itemAmount, item.coupon)
            // }
          }
        }

        // for (const discountLine of data.discount?.discountLines ?? []) {
        //   const coupon = await payload.findByID({
        //     id: discountLine.coupoe,
        //     collection: couponsSlug,
        //   })

        //   discountLine.amount = getCouponDiscountValue(subtotal, coupon)
        //   totalCartDiscount += discountLine.amount
        // }

        data.subtotal = subtotal
        data.discount = data.discout ?? {}
        data.discount.cartAmount = totalCartDiscount
        data.discount.lineItemsAmount = totalItemsDiscount
        data.discount.totalAmount = totalCartDiscount + totalItemsDiscount
      } else {
        data.subtotal = 0
      }
    } catch (error: any) {
      console.log({ error })

      return Response.json({
        message: 'updateSubtotalHook error',
        status: 500,
      })
    }
  }
