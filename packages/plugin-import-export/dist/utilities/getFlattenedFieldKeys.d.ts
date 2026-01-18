import { type FlattenedField } from 'payload';
type FieldWithPresentational = {
    fields?: FlattenedField[];
    name?: string;
    tabs?: {
        fields: FlattenedField[];
        name?: string;
    }[];
    type: 'collapsible' | 'row' | 'tabs';
} | FlattenedField;
export type GetFlattenedFieldKeysOptions = {
    /**
     * When provided, localized fields will be expanded to include locale suffixes.
     * e.g., 'title' (localized) -> ['title_en', 'title_es']
     */
    localeCodes?: string[];
};
/**
 * Recursively traverses fields and generates flattened CSV column keys.
 * This is schema-based - it derives columns from field definitions, not data.
 */
export declare const getFlattenedFieldKeys: (fields: FieldWithPresentational[], prefix?: string, options?: GetFlattenedFieldKeysOptions) => string[];
export {};
//# sourceMappingURL=getFlattenedFieldKeys.d.ts.map