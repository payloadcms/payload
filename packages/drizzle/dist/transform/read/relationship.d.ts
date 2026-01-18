import type { RelationshipField, UploadField } from 'payload';
type Args = {
    field: RelationshipField | UploadField;
    locale?: string;
    ref: Record<string, unknown>;
    relations: Record<string, unknown>[];
    withinArrayOrBlockLocale?: string;
};
export declare const transformRelationship: ({ field, locale, ref, relations, withinArrayOrBlockLocale, }: Args) => void;
export {};
//# sourceMappingURL=relationship.d.ts.map