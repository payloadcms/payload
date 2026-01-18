import { type FlattenedField } from 'payload';
import type { ToCSVFunction } from '../types.js';
type Args = {
    fields: FlattenedField[];
};
/**
 * Gets custom toCSV field functions for export.
 * These functions transform field values when flattening documents for CSV export.
 */
export declare const getExportFieldFunctions: ({ fields }: Args) => Record<string, ToCSVFunction>;
export {};
//# sourceMappingURL=getExportFieldFunctions.d.ts.map