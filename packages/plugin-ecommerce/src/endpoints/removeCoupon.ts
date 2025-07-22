import type { Endpoint } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import type { Cart, CartItem } from '../types.js'

type RemoveCoupon = (props: Props) => Endpoint['handler']

type Props = {
  cartsSlug?: string
}

/**
 * Handles the endpoint for removing a coupon from a cart.
 */
export const removeCouponHandler: RemoveCoupon =
  ({ cartsSlug = 'carts' }) =>
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

    const newCart: Cart = { ...cart }

    // Remove cart-level coupon
    if (newCart.coupons && newCart.coupons.length > 0) {
      newCart.coupons = newCart.coupons.filter((coupon) => coupon.identifier !== couponCode)
    }

    // Remove item-level coupons
    if (newCart.items && newCart.items.length > 0) {
      newCart.items = newCart.items.map((item: CartItem) => {
        if (item.coupons && item.coupons.length > 0) {
          return {
            ...item,
            coupons: item.coupons.filter((coupon) => coupon.identifier !== couponCode),
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
