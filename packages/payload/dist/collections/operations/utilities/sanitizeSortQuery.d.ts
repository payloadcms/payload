import type { FlattenedField } from '../../../fields/config/types.js';
/**
 * Sanitizes the sort parameter, for example virtual fields linked to relationships are replaced with the full path.
 */
export declare const sanitizeSortQuery: ({ fields, sort, }: {
    fields: FlattenedField[];
    sort?: string | string[];
}) => string | string[] | undefined;
//# sourceMappingURL=sanitizeSortQuery.d.ts.map