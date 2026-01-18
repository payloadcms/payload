import type { ClientField, CollectionConfig, CollectionPreferences, Field } from 'payload';
/**
 * Returns the initial columns to display in the table based on the following criteria:
 * 1. If `defaultColumns` is set in the collection config, use those columns
 * 2. Otherwise take `useAtTitle, if set, and the next 3 fields that are not hidden or disabled
 */
export declare const getInitialColumns: <T extends ClientField[] | Field[]>(fields: T, useAsTitle: CollectionConfig["admin"]["useAsTitle"], defaultColumns: CollectionConfig["admin"]["defaultColumns"]) => CollectionPreferences["columns"];
//# sourceMappingURL=getInitialColumns.d.ts.map