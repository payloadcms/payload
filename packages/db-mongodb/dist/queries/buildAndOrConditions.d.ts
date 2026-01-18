import type { FlattenedField, Payload, Where } from 'payload';
export declare function buildAndOrConditions({ collectionSlug, fields, globalSlug, locale, parentIsLocalized, payload, where, }: {
    collectionSlug?: string;
    fields: FlattenedField[];
    globalSlug?: string;
    locale?: string;
    parentIsLocalized: boolean;
    payload: Payload;
    where: Where[];
}): Promise<Record<string, unknown>[]>;
//# sourceMappingURL=buildAndOrConditions.d.ts.map