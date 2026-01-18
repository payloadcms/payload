import type { CartOperationResult, UpdateItemArgs } from './types.js';
/**
 * Updates an item in the cart using MongoDB-style operators.
 *
 * This handler is isolated and can be used from:
 * - Custom endpoints
 * - Local API operations
 * - Hooks
 *
 * @example
 * ```ts
 * // Set quantity to 5
 * const result = await updateItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 *   quantity: 5,
 * })
 *
 * // Increment by 1
 * const result = await updateItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 *   quantity: { $inc: 1 },
 * })
 *
 * // Decrement by 2
 * const result = await updateItem({
 *   payload,
 *   cartsSlug: 'carts',
 *   cartID: '123',
 *   itemID: 'item-row-id',
 *   quantity: { $inc: -2 },
 * })
 * ```
 */
export declare const updateItem: (args: UpdateItemArgs) => Promise<CartOperationResult>;
//# sourceMappingURL=updateItem.d.ts.map