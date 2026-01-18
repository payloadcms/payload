import type { CollectionSlug, Endpoint } from 'payload';
import type { MergeCartArgs } from '../operations/mergeCart.js';
type Args = {
    cartItemMatcher?: MergeCartArgs['cartItemMatcher'];
    cartsSlug: CollectionSlug;
};
/**
 * Creates an endpoint handler for merging a guest cart into the authenticated user's cart.
 * This is used when a guest with an existing cart logs in.
 *
 * Route: POST /api/{cartsSlug}/:id/merge
 *
 * Request body:
 * - sourceCartID: string - The ID of the guest cart to merge from
 * - sourceSecret: string - The secret of the guest cart for verification
 *
 * Requires authentication - the :id in the URL is the target cart which must belong to the user.
 */
export declare const mergeCartEndpoint: ({ cartItemMatcher, cartsSlug }: Args) => Endpoint;
export {};
//# sourceMappingURL=mergeCart.d.ts.map