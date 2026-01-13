import type { AddItemArgs, CartItemData, CartOperationResult } from './types.js'

import { createRequestWithSecret } from './createRequestWithSecret.js'
import { defaultCartItemMatcher } from './defaultCartItemMatcher.js'

/**
 * Adds an item to a cart. If an item matching the same criteria already exists,
 * its quantity is incremented instead of creating a duplicate entry.
 *
 * This handler is isolated and can be used from:
 * - Custom endpoints
 * - Local API operations
 * - Hooks
 *
 * @example
 * ```ts
 * // From an endpoint or hook
 * const result = await addItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   item: { product: 'prod-1', variant: 'var-1' },
 *   quantity: 2,
 * })
 * ```
 */
export const addItem = async (args: AddItemArgs): Promise<CartOperationResult> => {
  const {
    cartID,
    cartItemMatcher = defaultCartItemMatcher,
    cartsSlug,
    item,
    payload,
    quantity = 1,
    req,
    secret,
  } = args

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

  const existingItems: CartItemData[] = (cart.items as CartItemData[]) || []

  // Find if item already exists using the matcher
  const existingItemIndex = existingItems.findIndex((existingItem) =>
    cartItemMatcher({ existingItem, newItem: item }),
  )

  let updatedItems: CartItemData[]

  if (existingItemIndex !== -1) {
    // Item exists - increment quantity
    updatedItems = [...existingItems]
    const existingItem = updatedItems[existingItemIndex]!
    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
    }
  } else {
    // Item doesn't exist - add new item
    const newItem: CartItemData = {
      product: item.product,
      quantity,
      ...(item.variant ? { variant: item.variant } : {}),
      // Spread any additional custom properties from the item
      ...Object.fromEntries(
        Object.entries(item).filter(([key]) => !['product', 'quantity', 'variant'].includes(key)),
      ),
    }
    updatedItems = [...existingItems, newItem]
  }

  const updatedCart = await payload.update({
    id: cartID,
    collection: cartsSlug,
    data: {
      items: updatedItems,
    },
    depth: 0,
    overrideAccess: false,
    req: reqWithSecret,
  })

  return {
    cart: updatedCart,
    message: existingItemIndex !== -1 ? 'Item quantity updated' : 'Item added to cart',
    success: true,
  }
}
