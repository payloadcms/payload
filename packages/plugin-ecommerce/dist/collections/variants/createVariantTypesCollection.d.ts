import type { CollectionConfig } from 'payload';
import type { AccessConfig } from '../../types/index.js';
type Props = {
    access: Pick<AccessConfig, 'isAdmin' | 'publicAccess'>;
    /**
     * Slug of the variant options collection, defaults to 'variantOptions'.
     */
    variantOptionsSlug?: string;
};
export declare const createVariantTypesCollection: (props: Props) => CollectionConfig;
export {};
//# sourceMappingURL=createVariantTypesCollection.d.ts.map