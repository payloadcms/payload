import type { JoinQuery } from 'payload';
import type { MongooseAdapter } from '../index.js';
export type ResolveJoinsArgs = {
    /** The MongoDB adapter instance */
    adapter: MongooseAdapter;
    /** The slug of the collection being queried */
    collectionSlug: string;
    /** Array of documents to resolve joins for */
    docs: Record<string, unknown>[];
    /** Join query specifications (which joins to resolve and how) */
    joins?: JoinQuery;
    /** Optional locale for localized queries */
    locale?: string;
    /** Optional projection for the join query */
    projection?: Record<string, true>;
    /** Whether to resolve versions instead of published documents */
    versions?: boolean;
};
/**
 * Resolves join relationships for a collection of documents.
 * This function fetches related documents based on join configurations and
 * attaches them to the original documents with pagination support.
 */
export declare function resolveJoins({ adapter, collectionSlug, docs, joins, locale, projection, versions, }: ResolveJoinsArgs): Promise<void>;
//# sourceMappingURL=resolveJoins.d.ts.map