import type { Field, Payload } from 'payload';
type NestedRichTextFieldsArgs = {
    data: Record<string, unknown>;
    fields: Field[];
    found: number;
    payload: Payload;
};
export declare const migrateDocumentFieldsRecursively: ({ data, fields, found, payload, }: NestedRichTextFieldsArgs) => number;
export {};
//# sourceMappingURL=migrateDocumentFieldsRecursively.d.ts.map