/**
 * Validates collection-specific data for resource creation
 */
export declare function validateCollectionData(collection: string, data: Record<string, unknown>, availableCollections: string[]): null | string;
/**
 * Checks if a collection slug is valid
 */
export declare function validateCollectionSlug(collection: string, collections: Partial<Record<string, true>>): string | undefined;
//# sourceMappingURL=validation.d.ts.map