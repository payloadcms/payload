import type { CollectionSlug, Endpoint } from 'payload';
type Args = {
    cartsSlug: CollectionSlug;
};
/**
 * Creates an endpoint handler for clearing all items from a cart.
 *
 * Route: POST /api/{cartsSlug}/:id/clear
 *
 * Request body:
 * - secret?: string (for guest cart access)
 */
export declare const clearCartEndpoint: ({ cartsSlug }: Args) => Endpoint;
export {};
//# sourceMappingURL=clearCart.d.ts.map