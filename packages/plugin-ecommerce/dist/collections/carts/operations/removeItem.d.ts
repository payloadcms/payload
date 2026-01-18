import type { CartOperationResult, RemoveItemArgs } from './types.js';
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
export declare const removeItem: (args: RemoveItemArgs) => Promise<CartOperationResult>;
//# sourceMappingURL=removeItem.d.ts.map