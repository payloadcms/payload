import type { CartOperationResult, ClearCartArgs } from './types.js'

/**
 * Clears all items from a cart.
 *
 * This handler is isolated and can be used from:
 * - Custom endpoints
 * - Local API operations
 * - Hooks
 *
 * @example
 * ```ts
 * const result = await clearCart({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 * })
 * ```
 */
export const clearCart = async (args: ClearCartArgs): Promise<CartOperationResult> => {
  const { cartID, cartsSlug, payload, req, secret } = args

  // Build where clause for guest cart access
  const whereClause = secret
    ? { and: [{ id: { equals: cartID } }, { secret: { equals: secret } }] }
    : undefined

  const cart = await payload.findByID({
    id: cartID,
    collection: cartsSlug,
    depth: 0,
    req,
    ...(whereClause ? { where: whereClause } : {}),
  })

  if (!cart) {
    return {
      cart: null,
      message: `Cart with ID ${cartID} not found`,
      success: false,
    }
  }

  const updatedCart = await payload.update({
    id: cartID,
    collection: cartsSlug,
    data: {
      items: [],
    },
    depth: 0,
    req,
  })

  return {
    cart: updatedCart,
    message: 'Cart cleared',
    success: true,
  }
}
