import type { FlattenedField, Payload, Where } from 'payload';
export declare function parseParams({ collectionSlug, fields, globalSlug, locale, parentIsLocalized, payload, where, }: {
    collectionSlug?: string;
    fields: FlattenedField[];
    globalSlug?: string;
    locale?: string;
    parentIsLocalized: boolean;
    payload: Payload;
    where: Where;
}): Promise<Record<string, unknown>>;
//# sourceMappingURL=parseParams.d.ts.map