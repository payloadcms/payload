import type { ClientCollectionConfig } from '../collections/config/client.js';
import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { Where } from '../types/index.js';
export declare const hoistQueryParamsToAnd: (currentWhere: Where, incomingWhere: Where) => Where;
type Args = {
    collectionConfig: ClientCollectionConfig | SanitizedCollectionConfig;
    search: string;
    where?: Where;
};
export declare const mergeListSearchAndWhere: ({ collectionConfig, search, where }: Args) => Where;
export {};
//# sourceMappingURL=mergeListSearchAndWhere.d.ts.map