import type { FlattenedField } from 'payload';
type Args = {
    doc: Record<string, unknown>;
    fields: FlattenedField[];
    locale?: string;
    path: string;
    rows: Record<string, unknown>[];
};
export declare const traverseFields: ({ doc, fields, locale, path, rows }: Args) => void;
export {};
//# sourceMappingURL=traverseFields.d.ts.map