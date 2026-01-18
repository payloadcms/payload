import type { AddItemArgs, CartOperationResult } from './types.js';
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
export declare const addItem: (args: AddItemArgs) => Promise<CartOperationResult>;
//# sourceMappingURL=addItem.d.ts.map