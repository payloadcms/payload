import type { CollectionConfig, Field } from 'payload';
import type { AccessConfig, CountryType } from '../../types/index.js';
type Props = {
    access: Pick<AccessConfig, 'customerOnlyFieldAccess' | 'isAdmin' | 'isAuthenticated' | 'isCustomer' | 'isDocumentOwner'>;
    /**
     * Array of fields used for capturing the address data. Use this over overrides to customise the fields here as it's reused across the plugin.
     */
    addressFields: Field[];
    /**
     * Slug of the customers collection, defaults to 'users'.
     */
    customersSlug?: string;
    supportedCountries?: CountryType[];
};
export declare const createAddressesCollection: (props: Props) => CollectionConfig;
export {};
//# sourceMappingURL=createAddressesCollection.d.ts.map