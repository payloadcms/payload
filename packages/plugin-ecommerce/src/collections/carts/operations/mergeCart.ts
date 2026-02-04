import type { CollectionSlug, DefaultDocumentIDType, Payload, PayloadRequest } from 'payload'

import type { CartItemData, CartOperationResult } from './types.js'

/**
 * Gets the ID from a product/variant field which can be either an ID or a populated object.
 */
const getItemID = (
  field:
    | { [key: string]: unknown; id: DefaultDocumentIDType }
    | DefaultDocumentIDType
    | null
    | undefined,
): DefaultDocumentIDType | undefined => {
  if (!field) {
    return undefined
  }
  return typeof field === 'object' ? field.id : field
}

/**
 * Default matcher for merge operations - compares normalized product and variant IDs.
 */
const defaultMergeItemMatcher = (args: {
  existingItem: CartItemData
  newItem: CartItemData
}): boolean => {
  const { existingItem, newItem } = args

  const existingProductID = getItemID(existingItem.product)
  const newProductID = getItemID(newItem.product)

  if (existingProductID !== newProductID) {
    return false
  }

  const existingVariantID = getItemID(existingItem.variant)
  const newVariantID = getItemID(newItem.variant)

  return existingVariantID === newVariantID
}

export type MergeCartArgs = {
  /**
   * Optional custom cart item matcher function for merge operations.
   * Both items are CartItemData (existing cart items).
   */
  cartItemMatcher?: (args: { existingItem: CartItemData; newItem: CartItemData }) => boolean
  /**
   * The collection slug for carts.
   */
  cartsSlug: CollectionSlug
  /**
   * The Payload instance.
   */
  payload: Payload
  /**
   * The PayloadRequest object for transaction safety.
   */
  req?: PayloadRequest
  /**
   * The ID of the source (guest) cart to merge from.
   */
  sourceCartID: DefaultDocumentIDType
  /**
   * The secret for accessing the source guest cart.
   */
  sourceSecret: string
  /**
   * The ID of the target (user's) cart to merge into.
   */
  targetCartID: DefaultDocumentIDType
}

/**
 * Merges items from a source cart (typically a guest cart) into a target cart (typically a user's cart).
 * Items are merged intelligently - matching items have their quantities combined.
 * After successful merge, the source cart is deleted.
 *
 * @example
 * ```ts
 * const result = await mergeCart({
 *   payload,
 *   cartsSlug: 'carts',
 *   targetCartID: 'user-cart-123',
 *   sourceCartID: 'guest-cart-456',
 *   sourceSecret: 'abc123secret',
 * })
 * ```
 */
export const mergeCart = async (args: MergeCartArgs): Promise<CartOperationResult> => {
  const {
    cartItemMatcher = defaultMergeItemMatcher,
    cartsSlug,
    payload,
    req,
    sourceCartID,
    sourceSecret,
    targetCartID,
  } = args

  // Fetch the source (guest) cart with secret verification
  // Using overrideAccess: true here because we're manually verifying the secret in the where clause
  const sourceCart = await payload.find({
    collection: cartsSlug,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [{ id: { equals: sourceCartID } }, { secret: { equals: sourceSecret } }],
    },
  })

  if (!sourceCart.docs || sourceCart.docs.length === 0) {
    return {
      cart: null,
      message: `Source cart with ID ${sourceCartID} not found or secret mismatch`,
      success: false,
    }
  }

  const guestCart = sourceCart.docs[0]

  // Fetch the target (user's) cart
  const targetCart = await payload.findByID({
    id: targetCartID,
    collection: cartsSlug,
    depth: 0,
    overrideAccess: false,
    req,
  })

  if (!targetCart) {
    return {
      cart: null,
      message: `Target cart with ID ${targetCartID} not found`,
      success: false,
    }
  }

  const sourceItems: CartItemData[] = (guestCart?.items as CartItemData[]) || []
  const targetItems: CartItemData[] = (targetCart.items as CartItemData[]) || []

  // Merge items from source into target
  const mergedItems: CartItemData[] = [...targetItems]

  for (const sourceItem of sourceItems) {
    // Find if this item already exists in target cart
    const existingIndex = mergedItems.findIndex((targetItem) =>
      cartItemMatcher({ existingItem: targetItem, newItem: sourceItem }),
    )

    if (existingIndex !== -1) {
      // Item exists in target - add quantities
      const existingItem = mergedItems[existingIndex]!
      mergedItems[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + sourceItem.quantity,
      }
    } else {
      // Item doesn't exist in target - add it
      // Omit the source item's array row `id` so Payload generates a new one.
      // In SQL, array items are stored in separate tables with their own IDs,
      // and using IDs from another cart's array would cause conflicts.
      const { id: _omit, ...sourceItemWithoutId } = sourceItem
      mergedItems.push(sourceItemWithoutId as CartItemData)
    }
  }

  // Update the target cart with merged items
  const updatedCart = await payload.update({
    id: targetCartID,
    collection: cartsSlug,
    data: {
      items: mergedItems,
    },
    depth: 0,
    overrideAccess: false,
    req,
  })

  // Delete the source (guest) cart after successful merge
  // Using overrideAccess: true because we've already verified the secret above
  try {
    await payload.delete({
      id: sourceCartID,
      collection: cartsSlug,
      overrideAccess: true,
      req,
    })
  } catch {
    // Silently fail on delete - the merge was still successful
    // The cart may have already been deleted or access denied
  }

  return {
    cart: updatedCart,
    message: `Merged ${sourceItems.length} items from guest cart`,
    success: true,
  }
}
