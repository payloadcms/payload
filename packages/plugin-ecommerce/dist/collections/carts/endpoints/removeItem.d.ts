import type { CollectionSlug, Endpoint } from 'payload';
type Args = {
    cartsSlug: CollectionSlug;
};
/**
 * Creates an endpoint handler for removing items from a cart.
 *
 * Route: POST /api/{cartsSlug}/:id/remove-item
 *
 * Request body:
 * - itemID: string (the cart item row ID to remove)
 * - secret?: string (for guest cart access)
 */
export declare const removeItemEndpoint: ({ cartsSlug }: Args) => Endpoint;
export {};
//# sourceMappingURL=removeItem.d.ts.map