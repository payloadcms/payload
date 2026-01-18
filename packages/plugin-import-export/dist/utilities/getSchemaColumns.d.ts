import type { SanitizedCollectionConfig } from 'payload';
export type GetSchemaColumnsArgs = {
    /**
     * The collection configuration to derive columns from
     */
    collectionConfig: SanitizedCollectionConfig;
    /**
     * Array of disabled field paths from plugin config
     */
    disabledFields?: string[];
    /**
     * User-selected fields to export. If provided, only these fields (and their nested fields) will be included.
     */
    fields?: string[];
    /**
     * The locale to export. When 'all', localized fields are expanded to include all locale suffixes.
     */
    locale?: null | string;
    /**
     * Available locale codes from config. Required when locale='all'.
     */
    localeCodes?: string[];
};
/**
 * Derives CSV column names from the collection schema.
 * This provides a base set of columns from field definitions.
 *
 * Note: For arrays/blocks with multiple items, the schema only generates index 0.
 * Additional indices from actual data should be merged with these columns.
 *
 * Benefits:
 * - Provides consistent base columns
 * - Works for empty exports
 * - Ensures proper column ordering
 */
export declare const getSchemaColumns: ({ collectionConfig, disabledFields, fields: selectedFields, locale, localeCodes, }: GetSchemaColumnsArgs) => string[];
/**
 * Merges schema-derived columns with data-discovered columns.
 * Schema columns provide the base ordering, data columns add any additional
 * columns (e.g., array indices beyond 0, dynamic fields).
 */
export declare const mergeColumns: (schemaColumns: string[], dataColumns: string[]) => string[];
//# sourceMappingURL=getSchemaColumns.d.ts.map