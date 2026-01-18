import type { Block, Field, FlattenedBlock, FlattenedField } from '../fields/config/types.js';
export declare const flattenBlock: ({ block }: {
    block: Block;
}) => FlattenedBlock;
/**
 * Flattens all fields in a collection, preserving the nested field structure.
 * @param cache
 * @param fields
 */
export declare const flattenAllFields: ({ cache, fields, }: {
    /** Allows you to get FlattenedField[] from Field[] anywhere without performance overhead by caching. */
    cache?: boolean;
    fields: Field[];
}) => FlattenedField[];
//# sourceMappingURL=flattenAllFields.d.ts.map