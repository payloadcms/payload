import type { ArrayField } from 'payload';
import type { CurrenciesConfig } from '../types/index.js';
type Props = {
    /**
     * Include this in order to enable support for currencies per item in the cart.
     */
    currenciesConfig?: CurrenciesConfig;
    enableVariants?: boolean;
    /**
     * Enables individual prices for each item in the cart.
     * Defaults to false.
     */
    individualPrices?: boolean;
    overrides?: Partial<ArrayField>;
    /**
     * Slug of the products collection, defaults to 'products'.
     */
    productsSlug?: string;
    /**
     * Slug of the variants collection, defaults to 'variants'.
     */
    variantsSlug?: string;
};
export declare const cartItemsField: (props?: Props) => ArrayField;
export {};
//# sourceMappingURL=cartItemsField.d.ts.map