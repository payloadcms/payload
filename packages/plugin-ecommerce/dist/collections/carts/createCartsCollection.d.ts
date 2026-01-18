import type { CollectionConfig } from 'payload';
import type { AccessConfig, CurrenciesConfig } from '../../types/index.js';
import type { CartItemMatcher } from './operations/types.js';
type Props = {
    access: Pick<Required<AccessConfig>, 'isAdmin' | 'isAuthenticated' | 'isDocumentOwner'>;
    /**
     * Allow guest (unauthenticated) users to create carts.
     * Defaults to false.
     */
    allowGuestCarts?: boolean;
    /**
     * Custom function to determine if two cart items should be considered the same.
     * When items match, their quantities are combined instead of creating separate entries.
     *
     * Use this to add custom uniqueness criteria beyond product and variant IDs.
     *
     * @default defaultCartItemMatcher (matches by product and variant ID only)
     *
     * @example
     * ```ts
     * cartItemMatcher: ({ existingItem, newItem }) => {
     *   // Match by product, variant, AND custom delivery option
     *   const productMatch = existingItem.product === newItem.product
     *   const variantMatch = existingItem.variant === newItem.variant
     *   const deliveryMatch = existingItem.deliveryOption === newItem.deliveryOption
     *   return productMatch && variantMatch && deliveryMatch
     * }
     * ```
     */
    cartItemMatcher?: CartItemMatcher;
    currenciesConfig?: CurrenciesConfig;
    /**
     * Slug of the customers collection, defaults to 'users'.
     */
    customersSlug?: string;
    /**
     * Enables support for variants in the cart.
     * Defaults to false.
     */
    enableVariants?: boolean;
    /**
     * Slug of the products collection, defaults to 'products'.
     */
    productsSlug?: string;
    /**
     * Slug of the variants collection, defaults to 'variants'.
     */
    variantsSlug?: string;
};
export declare const createCartsCollection: (props: Props) => CollectionConfig;
export {};
//# sourceMappingURL=createCartsCollection.d.ts.map