import { type FlattenedField } from 'payload';
import type { FromCSVFunction } from '../types.js';
type Args = {
    fields: FlattenedField[];
};
/**
 * Gets custom fromCSV field functions for import.
 * These functions transform field values when unflattening CSV data for import.
 */
export declare const getImportFieldFunctions: ({ fields }: Args) => Record<string, FromCSVFunction>;
export {};
//# sourceMappingURL=getImportFieldFunctions.d.ts.map