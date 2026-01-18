import type { CollectionSlug, Endpoint } from 'payload';
type Args = {
    cartsSlug: CollectionSlug;
};
/**
 * Creates an endpoint handler for updating an item in a cart.
 * Supports MongoDB-style operators for flexible updates.
 *
 * Route: POST /api/{cartsSlug}/:id/update-item
 *
 * Request body:
 * - itemID: string (the cart item row ID to update)
 * - quantity: number | { $inc: number } (set or increment/decrement)
 * - removeOnZero?: boolean (defaults to true, removes item if quantity reaches 0)
 * - secret?: string (for guest cart access)
 *
 * @example
 * ```ts
 * // Set quantity to 5
 * fetch('/api/carts/123/update-item', {
 *   method: 'POST',
 *   body: JSON.stringify({ itemID: 'item-456', quantity: 5 })
 * })
 *
 * // Increment by 1
 * fetch('/api/carts/123/update-item', {
 *   method: 'POST',
 *   body: JSON.stringify({ itemID: 'item-456', quantity: { $inc: 1 } })
 * })
 *
 * // Decrement by 1
 * fetch('/api/carts/123/update-item', {
 *   method: 'POST',
 *   body: JSON.stringify({ itemID: 'item-456', quantity: { $inc: -1 } })
 * })
 * ```
 */
export declare const updateItemEndpoint: ({ cartsSlug }: Args) => Endpoint;
export {};
//# sourceMappingURL=updateItem.d.ts.map