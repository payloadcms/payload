import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { JoinQuery, PayloadRequest } from '../types/index.js';
type Args = {
    collectionConfig: SanitizedCollectionConfig;
    joins?: JoinQuery;
    overrideAccess: boolean;
    req: PayloadRequest;
};
/**
 * * Validates `where` for each join
 * * Combines the access result for joined collection
 * * Combines the default join's `where`
 */
export declare const sanitizeJoinQuery: ({ collectionConfig, joins: joinsQuery, overrideAccess, req, }: Args) => Promise<false | Partial<{
    [x: string]: false | {
        count?: boolean;
        limit?: number;
        page?: number;
        sort?: string;
        where?: import("../types/index.js").Where;
    };
}>>;
export {};
//# sourceMappingURL=sanitizeJoinQuery.d.ts.map