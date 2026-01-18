import type { CollectionSlug, DefaultDocumentIDType, Payload, PayloadRequest } from 'payload';
import type { CartItemData, CartOperationResult } from './types.js';
export type MergeCartArgs = {
    /**
     * Optional custom cart item matcher function for merge operations.
     * Both items are CartItemData (existing cart items).
     */
    cartItemMatcher?: (args: {
        existingItem: CartItemData;
        newItem: CartItemData;
    }) => boolean;
    /**
     * The collection slug for carts.
     */
    cartsSlug: CollectionSlug;
    /**
     * The Payload instance.
     */
    payload: Payload;
    /**
     * The PayloadRequest object for transaction safety.
     */
    req?: PayloadRequest;
    /**
     * The ID of the source (guest) cart to merge from.
     */
    sourceCartID: DefaultDocumentIDType;
    /**
     * The secret for accessing the source guest cart.
     */
    sourceSecret: string;
    /**
     * The ID of the target (user's) cart to merge into.
     */
    targetCartID: DefaultDocumentIDType;
};
/**
 * Merges items from a source cart (typically a guest cart) into a target cart (typically a user's cart).
 * Items are merged intelligently - matching items have their quantities combined.
 * After successful merge, the source cart is deleted.
 *
 * @example
 * ```ts
 * const result = await mergeCart({
 *   payload,
 *   cartsSlug: 'carts',
 *   targetCartID: 'user-cart-123',
 *   sourceCartID: 'guest-cart-456',
 *   sourceSecret: 'abc123secret',
 * })
 * ```
 */
export declare const mergeCart: (args: MergeCartArgs) => Promise<CartOperationResult>;
//# sourceMappingURL=mergeCart.d.ts.map