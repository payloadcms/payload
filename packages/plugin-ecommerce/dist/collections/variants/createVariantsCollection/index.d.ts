import type { CollectionConfig } from 'payload';
import type { AccessConfig, CurrenciesConfig, InventoryConfig } from '../../../types/index.js';
type Props = {
    access: Pick<AccessConfig, 'adminOrPublishedStatus' | 'isAdmin'>;
    currenciesConfig?: CurrenciesConfig;
    /**
     * Enables inventory tracking for variants. Defaults to true.
     */
    inventory?: boolean | InventoryConfig;
    /**
     * Slug of the products collection, defaults to 'products'.
     */
    productsSlug?: string;
    /**
     * Slug of the variant options collection, defaults to 'variantOptions'.
     */
    variantOptionsSlug?: string;
    /**
     * Slug of the variant types collection, defaults to 'variantTypes'.
     */
    variantTypesSlug?: string;
};
export declare const createVariantsCollection: (props: Props) => CollectionConfig;
export {};
//# sourceMappingURL=index.d.ts.map