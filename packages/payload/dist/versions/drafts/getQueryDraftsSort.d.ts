import type { SanitizedCollectionConfig } from '../../collections/config/types.js';
import type { Sort } from '../../types/index.js';
/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */
export declare const getQueryDraftsSort: ({ collectionConfig, sort, }: {
    collectionConfig: SanitizedCollectionConfig;
    sort?: Sort;
}) => Sort;
//# sourceMappingURL=getQueryDraftsSort.d.ts.map