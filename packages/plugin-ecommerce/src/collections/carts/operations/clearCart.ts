import type { CartOperationResult, ClearCartArgs } from './types.js'

import { createRequestWithSecret } from './createRequestWithSecret.js'

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

  // Inject secret into request context for access control
  const reqWithSecret = createRequestWithSecret(req, secret)

  const cart = await payload.findByID({
    id: cartID,
    collection: cartsSlug,
    depth: 0,
    overrideAccess: false,
    req: reqWithSecret,
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
    overrideAccess: false,
    req: reqWithSecret,
  })

  return {
    cart: updatedCart,
    message: 'Cart cleared',
    success: true,
  }
}
