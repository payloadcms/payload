import type { CollectionConfig } from '../../collections/config/types.js';
import type { SanitizedConfig } from '../types.js';
/**
 * This function creates:
 * - N fields per collection, named `_order` or `_<collection>_<joinField>_order`
 * - 1 hook per collection
 * - 1 endpoint per app
 *
 * Also, if collection.defaultSort or joinField.defaultSort is not set, it will be set to the orderable field.
 */
export declare const setupOrderable: (config: SanitizedConfig) => void;
export declare const addOrderableFieldsAndHook: (collection: CollectionConfig, orderableFieldNames: string[]) => void;
/**
 * The body of the reorder endpoint.
 * @internal
 */
export type OrderableEndpointBody = {
    collectionSlug: string;
    docsToMove: string[];
    newKeyWillBe: 'greater' | 'less';
    orderableFieldName: string;
    target: {
        id: string;
        key: string;
    };
};
export declare const addOrderableEndpoint: (config: SanitizedConfig) => void;
//# sourceMappingURL=index.d.ts.map