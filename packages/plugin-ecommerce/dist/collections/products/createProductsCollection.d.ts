import type { CollectionConfig } from 'payload';
import type { AccessConfig, CurrenciesConfig, InventoryConfig } from '../../types/index.js';
type Props = {
    access: Pick<AccessConfig, 'adminOrPublishedStatus' | 'isAdmin'>;
    currenciesConfig: CurrenciesConfig;
    enableVariants?: boolean;
    /**
     * Adds in an inventory field to the product and its variants. This is useful for tracking inventory levels.
     * Defaults to true.
     */
    inventory?: boolean | InventoryConfig;
    /**
     * Slug of the variants collection, defaults to 'variants'.
     */
    variantsSlug?: string;
    /**
     * Slug of the variant types collection, defaults to 'variantTypes'.
     */
    variantTypesSlug?: string;
};
export declare const createProductsCollection: (props: Props) => CollectionConfig;
export {};
//# sourceMappingURL=createProductsCollection.d.ts.map