import type { FlattenedField, Operator, Payload } from 'payload';
type SearchParam = {
    path?: string;
    rawQuery?: unknown;
    value?: unknown;
};
/**
 * Convert the Payload key / value / operator into a MongoDB query
 */
export declare function buildSearchParam({ collectionSlug, fields, globalSlug, incomingPath, locale, operator, parentIsLocalized, payload, val, }: {
    collectionSlug?: string;
    fields: FlattenedField[];
    globalSlug?: string;
    incomingPath: string;
    locale?: string;
    operator: Operator;
    parentIsLocalized: boolean;
    payload: Payload;
    val: unknown;
}): Promise<SearchParam | undefined>;
export {};
//# sourceMappingURL=buildSearchParams.d.ts.map