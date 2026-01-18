/**
 *  While the default ID is determined by the db adapter, it can still differ for a collection if they
 *  define a custom ID field. This builds a map of collection slugs to their ID field type.
 * @param defaultIDType as defined by the database adapter
 */ export function getCollectionIDFieldTypes({ config, defaultIDType }) {
    return config.collections.reduce((acc, collection)=>{
        const customCollectionIdField = collection.fields.find((field)=>'name' in field && field.name === 'id');
        acc[collection.slug] = defaultIDType === 'text' ? 'string' : 'number';
        if (customCollectionIdField) {
            acc[collection.slug] = customCollectionIdField.type === 'number' ? 'number' : 'string';
        }
        return acc;
    }, {});
}

//# sourceMappingURL=getCollectionIDFieldTypes.js.map