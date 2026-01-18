import type { PipelineStage } from 'mongoose';
import { type CollectionSlug, type JoinQuery, type SanitizedCollectionConfig } from 'payload';
import type { MongooseAdapter } from '../index.js';
type BuildJoinAggregationArgs = {
    adapter: MongooseAdapter;
    collection: CollectionSlug;
    collectionConfig: SanitizedCollectionConfig;
    draftsEnabled?: boolean;
    joins?: JoinQuery;
    locale?: string;
    projection?: Record<string, true>;
    query?: Record<string, unknown>;
    /** whether the query is from drafts */
    versions?: boolean;
};
export declare const buildJoinAggregation: ({ adapter, collection, collectionConfig, draftsEnabled, joins, locale, projection, versions, }: BuildJoinAggregationArgs) => Promise<PipelineStage[] | undefined>;
export {};
//# sourceMappingURL=buildJoinAggregation.d.ts.map