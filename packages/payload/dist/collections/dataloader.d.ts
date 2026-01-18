import DataLoader from 'dataloader';
import type { Payload, TypedFallbackLocale } from '../index.js';
import type { PayloadRequest, PopulateType, SelectType } from '../types/index.js';
import type { TypeWithID } from './config/types.js';
export declare const getDataLoader: (req: PayloadRequest) => {
    find: Payload["find"];
} & DataLoader<string, TypeWithID, string>;
type CreateCacheKeyArgs = {
    collectionSlug: string;
    currentDepth: number;
    depth: number;
    docID: number | string;
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    locale: string | string[];
    overrideAccess: boolean;
    populate?: PopulateType;
    select?: SelectType;
    showHiddenFields: boolean;
    transactionID: number | Promise<number | string> | string;
};
export declare const createDataloaderCacheKey: ({ collectionSlug, currentDepth, depth, docID, draft, fallbackLocale, locale, overrideAccess, populate, select, showHiddenFields, transactionID, }: CreateCacheKeyArgs) => string;
export {};
//# sourceMappingURL=dataloader.d.ts.map