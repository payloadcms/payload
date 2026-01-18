/**
 * Validates collection-specific data for resource creation
 */ export function validateCollectionData(collection, data, availableCollections) {
    // Check if collection exists
    if (!availableCollections.includes(collection)) {
        return `Unknown collection: ${collection}. Available collections: ${availableCollections.join(', ')}`;
    }
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return `Collection "${collection}" requires data to be provided`;
    }
    return null;
}
/**
 * Checks if a collection slug is valid
 */ export function validateCollectionSlug(collection, collections) {
    const collectionSlugs = Object.keys(collections);
    if (!collectionSlugs.includes(collection)) {
        return `Collection "${collection}" is not valid`;
    }
}

//# sourceMappingURL=validation.js.map