import type { CartOperationResult, ClearCartArgs } from './types.js';
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
export declare const clearCart: (args: ClearCartArgs) => Promise<CartOperationResult>;
//# sourceMappingURL=clearCart.d.ts.map