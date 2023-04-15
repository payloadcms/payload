import { PipelineStage } from 'mongoose';
import { SanitizedCollectionConfig } from '../../collections/config/types';
type Args = {
    config: SanitizedCollectionConfig;
    query: Record<string, unknown>;
};
export declare const buildDraftMergeAggregate: ({ config, query }: Args) => PipelineStage[];
export {};
