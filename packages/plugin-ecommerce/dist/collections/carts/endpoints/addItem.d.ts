import type { CollectionSlug, Endpoint } from 'payload';
import type { CartItemMatcher } from '../operations/types.js';
type Args = {
    cartItemMatcher?: CartItemMatcher;
    cartsSlug: CollectionSlug;
};
/**
 * Creates an endpoint handler for adding items to a cart.
 *
 * Route: POST /api/{cartsSlug}/:id/add-item
 *
 * Request body:
 * - item: { product: string, variant?: string, ...customFields }
 * - quantity?: number (defaults to 1)
 * - secret?: string (for guest cart access)
 */
export declare const addItemEndpoint: ({ cartItemMatcher, cartsSlug }: Args) => Endpoint;
export {};
//# sourceMappingURL=addItem.d.ts.map