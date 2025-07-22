import type { BasePayload, Endpoint, TypedCollection, TypedUser } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import type { CartItem, Coupon } from '../types.js'

type ApplyCoupon = (props: Props) => Endpoint['handler']

type Props = {
  cartsSlug?: string
  couponsSlug?: string
  transactionsSlug?: string
}

async function validateCoupon({
  coupon,
  couponsSlug,
  payload,
  user,
}: {
  coupon: TypedCollection['coupons']
  couponsSlug: string
  payload: BasePayload
  user: TypedUser
}) {
  const cart = user?.cart?.docs?.[0]

  if (coupon.maxClaims && coupon.maxClaims > coupon.numberOfClaims) {
    return 'Coupon has reached the maximum amount of claims'
  }

  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > new Date().getTime()) {
    return 'Coupon is not valid yet'
  }

  if (coupon.validTo && new Date(coupon.validTo).getTime() < new Date().getTime()) {
    return 'Coupon has expired'
  }

  if (coupon.eligbleCustomers) {
    const errorMessage = 'You are not eligble to claim this coupon.'
    if (!user) {
      return errorMessage
    }

    const couponMatch = await payload.find({
      collection: couponsSlug,
      where: {
        eligbleCustomers: {
          in: user.id,
        },
      },
    })

    if (couponMatch.docs.length === 0) {
      return errorMessage
    }
  }

  if (coupon.eligbleProducts) {
    if (
      !cart.items.some((item: CartItem) =>
        coupon.eligbleProducts.some((product: any) => product.id === item.product),
      )
    ) {
      return 'Coupon is not valid for the products in your cart.'
    }
  }

  return true
}

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const applyCouponHandler: ApplyCoupon =
  ({ cartsSlug = 'carts', couponsSlug = 'coupons' }) =>
  async (req) => {
    await addDataAndFileToRequest(req)

    const payload = req.payload
    const data = req.data
    const user = req.user
    const cart = user?.cart?.docs?.[0]
    const couponCode: string = data?.couponCode

    const couponsQuery = await payload.find({
      collection: 'coupons',

      where: {
        identifier: {
          equals: couponCode,
        },
      },
    })

    const foundCoupon = couponsQuery.docs?.[0] as Coupon | undefined

    if (!foundCoupon) {
      return Response.json(
        {
          message: 'coupon not found',
        },
        {
          status: 400,
        },
      )
    }

    const isCouponValid = await validateCoupon({ coupon: foundCoupon, couponsSlug, payload, user })

    if (isCouponValid !== true) {
      return Response.json(
        {
          message: isCouponValid,
        },
        {
          status: 400,
        },
      )
    }

    let newData = {
      ...cart,
    }

    if (foundCoupon.appliesTo === 'cart') {
      newData = {
        ...newData,
        discount: {
          amount: newData.discount.amount ?? 0, // will be calculated in updateSubTotalHook
          discountLines: [
            // ...(newData.discount?.discountLines ?? []),
            {
              amount: 0, // will be calculated in updateSubTotalHook
              coupon: foundCoupon.id,
            },
          ],
        },
      }
    } else {
      newData = { ...cart }
      newData.items = newData.items.map((item: CartItem) => {
        // check if coupon applies to this product
        if (foundCoupon.eligbleProducts.includes(item.product)) {
          return {
            ...item,
            discount: {
              discountLines: [
                // ...(item.discount?.discountLines ?? []),
                {
                  amount: 0, // will be calculated in updateSubTotalHook
                  coupon: foundCoupon.id,
                },
              ],
              total: 0, // will be calculated in updateSubTotalHook
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
        data: newData,
      })
      return Response.json({ newData, result })
    } catch (error) {
      payload.logger.error(error, 'Error applying coupon.')

      return Response.json(
        {
          message: `An error occurred while applying the coupon.`,
        },
        {
          status: 500,
        },
      )
    }
  }
