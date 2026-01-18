import type { CollationOptions } from 'mongodb';
import type { ClientSession, Model, PipelineStage } from 'mongoose';
import type { PaginatedDocs } from 'payload';
import type { MongooseAdapter } from '../index.js';
export declare const aggregatePaginate: ({ adapter, collation, joinAggregation, limit, Model, page, pagination, projection, query, session, sort, sortAggregation, useEstimatedCount, }: {
    adapter: MongooseAdapter;
    collation?: CollationOptions;
    joinAggregation?: PipelineStage[];
    limit?: number;
    Model: Model<any>;
    page?: number;
    pagination?: boolean;
    projection?: Record<string, boolean>;
    query: Record<string, unknown>;
    session?: ClientSession;
    sort?: object;
    sortAggregation?: PipelineStage[];
    useEstimatedCount?: boolean;
}) => Promise<PaginatedDocs<any>>;
//# sourceMappingURL=aggregatePaginate.d.ts.map