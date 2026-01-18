import type { RelationshipField, UploadField } from 'payload';
type Args = {
    baseRow: Record<string, unknown>;
    data: unknown;
    field: RelationshipField | UploadField;
    relationships: Record<string, unknown>[];
};
export declare const transformRelationship: ({ baseRow, data, field, relationships }: Args) => void;
export {};
//# sourceMappingURL=relationships.d.ts.map