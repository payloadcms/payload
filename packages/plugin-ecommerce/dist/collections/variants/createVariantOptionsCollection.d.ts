import type { CollectionConfig } from 'payload';
import type { AccessConfig } from '../../types/index.js';
type Props = {
    access: Pick<AccessConfig, 'isAdmin' | 'publicAccess'>;
    /**
     * Slug of the variant types collection, defaults to 'variantTypes'.
     */
    variantTypesSlug?: string;
};
export declare const createVariantOptionsCollection: (props: Props) => CollectionConfig;
export {};
//# sourceMappingURL=createVariantOptionsCollection.d.ts.map