import type { CartItemData, CartOperationResult, RemoveItemArgs } from './types.js'

/**
 * Removes an item from a cart by its row ID.
 *
 * This handler is isolated and can be used from:
 * - Custom endpoints
 * - Local API operations
 * - Hooks
 *
 * @example
 * ```ts
 * const result = await removeItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 * })
 * ```
 */
export const removeItem = async (args: RemoveItemArgs): Promise<CartOperationResult> => {
  const { cartID, cartsSlug, itemID, payload, req, secret } = args

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

  const existingItems: CartItemData[] = (cart.items as CartItemData[]) || []

  // Find the item by its row ID
  const itemIndex = existingItems.findIndex((item) => item.id === itemID)

  if (itemIndex === -1) {
    return {
      cart,
      message: `Item with ID ${itemID} not found in cart`,
      success: false,
    }
  }

  // Remove the item
  const updatedItems = [...existingItems]
  updatedItems.splice(itemIndex, 1)

  const updatedCart = await payload.update({
    id: cartID,
    collection: cartsSlug,
    data: {
      items: updatedItems,
    },
    depth: 0,
    req,
  })

  return {
    cart: updatedCart,
    message: 'Item removed from cart',
    success: true,
  }
}
