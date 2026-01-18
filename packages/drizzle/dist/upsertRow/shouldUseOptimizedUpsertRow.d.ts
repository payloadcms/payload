import type { FlattenedField } from 'payload';
/**
 * Checks whether we should use the upsertRow function for the passed data and otherwise use a simple SQL SET call.
 * We need to use upsertRow only when the data has arrays, blocks, hasMany select/text/number, localized fields, complex relationships.
 */
export declare const shouldUseOptimizedUpsertRow: ({ data, fields, }: {
    data: Record<string, unknown>;
    fields: FlattenedField[];
}) => any;
//# sourceMappingURL=shouldUseOptimizedUpsertRow.d.ts.map