import type {
  BasePayload,
  Endpoint,
  JsonObject,
  TypedCollection,
  TypedUser,
  TypeWithID,
} from 'payload'

import { addDataAndFileToRequest } from 'payload'

import type { Cart, CartItem, Coupon } from '../types.js'

type ApplyCoupon = (props: Props) => Endpoint['handler']

type Props = {
  cartsSlug?: string
  couponsSlug?: string
  transactionsSlug?: string
}

function isProductEligible(coupon: Coupon, product: (JsonObject & TypeWithID) | number | string) {
  return coupon.eligbleProducts.some((eligbleProduct) => {
    const eligbleProductId =
      typeof eligbleProduct === 'object' ? String(eligbleProduct.id) : String(eligbleProduct)
    const productId = typeof product === 'object' ? String(product.id) : String(product)

    return eligbleProductId === productId
  })
}

async function validateCoupon({
  cartsSlug,
  coupon,
  couponsSlug,
  payload,
  user,
}: {
  cartsSlug: string
  coupon: TypedCollection['coupons']
  couponsSlug: string
  payload: BasePayload
  user: TypedUser
}) {
  const cartId = user?.cart?.docs?.[0]?.id
  if (!cartId) {
    return 'You do not have a cart to apply the coupon to.'
  }

  const cart = (await payload.findByID({
    id: cartId,
    collection: cartsSlug,
  })) as Cart | undefined

  if (!cart) {
    return 'Cart not found.'
  }

  if (coupon.maxClaims && coupon.maxClaims > coupon.numberOfClaims) {
    return 'Coupon has reached the maximum amount of claims.'
  }

  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > new Date().getTime()) {
    return 'Coupon is not valid yet.'
  }

  if (coupon.validTo && new Date(coupon.validTo).getTime() < new Date().getTime()) {
    return 'Coupon has expired.'
  }

  if (cart?.discount?.discountLines?.some((line) => line.coupon === coupon.id)) {
    return 'Coupon has already been applied to the cart.'
  }

  if (
    cart.items?.some((item: CartItem) =>
      item.discount?.discountLines?.some((line) => {
        return line.coupon === coupon.id
      }),
    )
  ) {
    return 'Coupon has already been applied to one of the items in the cart.'
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
    if (!cart.items.some((item: CartItem) => isProductEligible(coupon as Coupon, item.product))) {
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
          message: 'Coupon does not exist.',
        },
        {
          status: 400,
        },
      )
    }

    const isCouponValid = await validateCoupon({
      cartsSlug,
      coupon: foundCoupon,
      couponsSlug,
      payload,
      user,
    })

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
          ...newData.discount,
          discountLines: [
            ...(newData.discount?.discountLines ?? []),
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

        if (isProductEligible(foundCoupon, item.product)) {
          return {
            ...item,
            discount: {
              ...item.discount,
              amount: 0, // will be calculated in updateSubTotalHook
              discountLines: [
                ...(item.discount?.discountLines ?? []),
                {
                  amount: 0, // will be calculated in updateSubTotalHook
                  coupon: foundCoupon.id,
                },
              ],
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
      console.dir({ newData, result }, { depth: null })
      return Response.json(result)
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
