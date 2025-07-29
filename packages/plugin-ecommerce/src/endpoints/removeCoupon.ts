import type { Endpoint } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import type { Cart, CartItem } from '../types.js'

type RemoveCoupon = (props: Props) => Endpoint['handler']

type Props = {
  cartsSlug?: string
  couponsSlug?: string
}

/**
 * Handles the endpoint for removing a coupon from a cart.
 */
export const removeCouponHandler: RemoveCoupon =
  ({ cartsSlug = 'carts', couponsSlug = 'coupons' }) =>
  async (req) => {
    await addDataAndFileToRequest(req)

    const payload = req.payload
    const data = req.data
    const user = req.user
    const cart: Cart = user?.cart?.docs?.[0]
    const couponCode: string = data?.couponCode

    if (!couponCode) {
      return Response.json(
        {
          message: 'No coupon code provided.',
        },
        {
          status: 400,
        },
      )
    }

    const couponsQuery = await payload.find({
      collection: couponsSlug,
      where: {
        identifier: {
          equals: couponCode,
        },
      },
    })

    const coupon = couponsQuery.docs[0]

    if (!coupon) {
      return Response.json(
        {
          message: 'Coupon code is invalid.',
        },
        {
          status: 400,
        },
      )
    }

    const newCart: Cart = { ...cart }

    // Remove cart-level coupon
    if (newCart.discount?.discountLines && newCart.discount.discountLines.length > 0) {
      newCart.discount.discountLines = newCart.discount.discountLines.filter(
        (discountLine) => discountLine.coupon !== coupon.id,
      )
    }

    // Remove item-level coupons
    if (newCart.items && newCart.items.length > 0) {
      newCart.items = newCart.items.map((item: CartItem) => {
        if (item.discount?.discountLines && item.discount.discountLines.length > 0) {
          return {
            ...item,
            discount: {
              ...item.discount,
              discountLines: item.discount.discountLines.filter(
                (discountLine) => discountLine.coupon !== coupon.id,
              ),
            },
          }
        }

        return item
      })
    }

    try {
      const result = await payload.update({
        id: cart.id,
        collection: cartsSlug,
        data: newCart,
      })
      return Response.json(result)
    } catch (error) {
      payload.logger.error(error, 'Error removing coupon.')

      return Response.json(
        {
          message: `An error occurred while removing the coupon.`,
        },
        {
          status: 500,
        },
      )
    }
  }
