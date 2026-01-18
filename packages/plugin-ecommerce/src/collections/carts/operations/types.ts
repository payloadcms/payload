import type { DefaultDocumentIDType, Payload, PayloadRequest } from '@ruya.sa/payload'

/**
 * Represents an item in the cart with populated or ID references.
 */
export type CartItemData = {
  [key: string]: unknown
  /**
   * The ID of the cart item. Array item IDs are always strings in Payload,
   * regardless of the database adapter's default ID type.
   */
  id?: string
  product: { [key: string]: unknown; id: DefaultDocumentIDType } | DefaultDocumentIDType
  quantity: number
  variant?: { [key: string]: unknown; id: DefaultDocumentIDType } | DefaultDocumentIDType
}

/**
 * Represents a new item to be added to the cart.
 */
export type NewCartItem = {
  [key: string]: unknown
  product: DefaultDocumentIDType
  quantity?: number
  variant?: DefaultDocumentIDType
}

/**
 * Arguments for the cart item matcher function.
 */
export type CartItemMatcherArgs = {
  /** The existing cart item to compare against */
  existingItem: CartItemData
  /** The new item being added */
  newItem: NewCartItem
}

/**
 * Function to determine if two cart items should be considered the same.
 * When items match, their quantities are combined instead of creating separate entries.
 */
export type CartItemMatcher = (args: CartItemMatcherArgs) => boolean

/**
 * MongoDB-style update operator for numeric fields.
 * Supports $inc for increment/decrement operations.
 *
 * @example
 * ```ts
 * // Set quantity to 5
 * { quantity: 5 }
 *
 * // Increment quantity by 1
 * { quantity: { $inc: 1 } }
 *
 * // Decrement quantity by 2
 * { quantity: { $inc: -2 } }
 * ```
 */
export type NumericOperator = {
  /** Increment by this value (use negative to decrement) */
  $inc: number
}

/**
 * A field value that can be either a direct value or an operator.
 */
export type FieldWithOperator<T> = NumericOperator | T

/**
 * Checks if a value is a NumericOperator.
 */
export function isNumericOperator(value: unknown): value is NumericOperator {
  return typeof value === 'object' && value !== null && '$inc' in value
}

/**
 * Base arguments for all cart operations.
 */
export type BaseCartOperationArgs = {
  /** The cart ID to operate on */
  cartID: DefaultDocumentIDType
  /** The carts collection slug */
  cartsSlug: string
  /** Payload instance */
  payload: Payload
  /** Optional request context for access control */
  req?: PayloadRequest
  /** Secret for guest cart access */
  secret?: string
}

/**
 * Arguments for the addItem operation.
 */
export type AddItemArgs = {
  /** Custom matcher function to determine item uniqueness */
  cartItemMatcher?: CartItemMatcher
  /** The item to add */
  item: NewCartItem
  /** Quantity to add (defaults to 1) */
  quantity?: number
} & BaseCartOperationArgs

/**
 * Arguments for the removeItem operation.
 */
export type RemoveItemArgs = {
  /**
   * The cart item row ID to remove.
   * Array item IDs are always strings in Payload, regardless of the database adapter's default ID type.
   */
  itemID: string
} & BaseCartOperationArgs

/**
 * Arguments for the updateItem operation.
 * Supports MongoDB-style operators for flexible updates.
 */
export type UpdateItemArgs = {
  /**
   * The cart item row ID to update.
   * Array item IDs are always strings in Payload, regardless of the database adapter's default ID type.
   */
  itemID: string
  /**
   * The quantity value or operator.
   * - Direct number: Sets the quantity to this value
   * - { $inc: n }: Increments quantity by n (use negative to decrement)
   *
   * @example
   * ```ts
   * // Set quantity to 5
   * { quantity: 5 }
   *
   * // Increment by 1
   * { quantity: { $inc: 1 } }
   *
   * // Decrement by 1
   * { quantity: { $inc: -1 } }
   * ```
   */
  quantity: FieldWithOperator<number>
  /** Whether to remove the item if quantity reaches 0 (defaults to true) */
  removeOnZero?: boolean
} & BaseCartOperationArgs

/**
 * Arguments for the clearCart operation.
 */
export type ClearCartArgs = BaseCartOperationArgs

/**
 * Result of a cart operation.
 */
export type CartOperationResult<T = unknown> = {
  cart: T
  message: string
  success: boolean
}
