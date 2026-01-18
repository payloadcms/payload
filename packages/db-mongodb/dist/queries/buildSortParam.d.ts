import type { PipelineStage } from 'mongoose';
import { type FlattenedField, type SanitizedConfig, type Sort } from 'payload';
import type { MongooseAdapter } from '../index.js';
type Args = {
    adapter: MongooseAdapter;
    config: SanitizedConfig;
    fields: FlattenedField[];
    locale?: string;
    parentIsLocalized?: boolean;
    sort?: Sort;
    sortAggregation?: PipelineStage[];
    timestamps: boolean;
    versions?: boolean;
};
export type SortArgs = {
    direction: SortDirection;
    property: string;
}[];
export type SortDirection = 'asc' | 'desc';
export declare const buildSortParam: ({ adapter, config, fields, locale, parentIsLocalized, sort, sortAggregation, timestamps, versions, }: Args) => Record<string, string>;
export {};
//# sourceMappingURL=buildSortParam.d.ts.map