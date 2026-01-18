/**
 * Get the field by its schema path, e.g. group.title, array.group.title
 * If there were any localized on the path, `pathHasLocalized` will be true and `localizedPath` will look like:
 * `group.<locale>.title` // group is localized here
 */ export const getFieldByPath = ({ config, fields, includeRelationships = false, localizedPath = '', path })=>{
    let currentFields = fields;
    let currentField = null;
    const segments = path.split('.');
    let pathHasLocalized = false;
    while(segments.length > 0){
        const segment = segments.shift();
        localizedPath = `${localizedPath ? `${localizedPath}.` : ''}${segment}`;
        const field = currentFields.find((each)=>each.name === segment);
        if (!field) {
            return null;
        }
        if (field.localized) {
            pathHasLocalized = true;
            localizedPath = `${localizedPath}.<locale>`;
        }
        if ('flattenedFields' in field) {
            currentFields = field.flattenedFields;
        }
        if (config && includeRelationships && (field.type === 'relationship' || field.type === 'upload') && !Array.isArray(field.relationTo)) {
            const flattenedFields = config.collections.find((e)=>e.slug === field.relationTo)?.flattenedFields;
            if (flattenedFields) {
                currentFields = flattenedFields;
            }
            if (segments.length === 1 && segments[0] === 'id') {
                return {
                    field,
                    localizedPath,
                    pathHasLocalized
                };
            }
        }
        if ('blocks' in field && segments.length > 0) {
            const blockSlug = segments[0];
            const block = field.blocks.find((b)=>b.slug === blockSlug);
            if (block) {
                segments.shift();
                localizedPath = `${localizedPath}.${blockSlug}`;
                if (segments.length === 0) {
                    return null;
                }
                return getFieldByPath({
                    config,
                    fields: block.flattenedFields,
                    includeRelationships,
                    localizedPath,
                    path: segments.join('.')
                });
            }
        }
        currentField = field;
    }
    if (!currentField) {
        return null;
    }
    return {
        field: currentField,
        localizedPath,
        pathHasLocalized
    };
};

//# sourceMappingURL=getFieldByPath.js.map