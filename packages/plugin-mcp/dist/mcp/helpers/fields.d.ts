type FieldDefinition = {
    description?: string;
    name: string;
    options?: {
        label: string;
        value: string;
    }[];
    position?: 'main' | 'sidebar';
    required?: boolean;
    type: string;
};
type FieldModification = {
    changes: {
        description?: string;
        options?: {
            label: string;
            value: string;
        }[];
        position?: 'main' | 'sidebar';
        required?: boolean;
        type?: string;
    };
    fieldName: string;
};
/**
 * Adds new fields to a collection file content
 */
export declare function addFieldsToCollection(content: string, newFields: FieldDefinition[]): string;
/**
 * Removes fields from a collection file content
 */
export declare function removeFieldsFromCollection(content: string, fieldNames: string[]): string;
/**
 * Modifies existing fields in a collection file content
 */
export declare function modifyFieldsInCollection(content: string, modifications: FieldModification[]): string;
export {};
//# sourceMappingURL=fields.d.ts.map