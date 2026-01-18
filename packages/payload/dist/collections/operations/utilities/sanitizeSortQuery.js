const sanitizeSort = ({ fields, sort })=>{
    let sortProperty = sort;
    let desc = false;
    if (sort.indexOf('-') === 0) {
        desc = true;
        sortProperty = sortProperty.substring(1);
    }
    const segments = sortProperty.split('.');
    for (const segment of segments){
        const field = fields.find((each)=>each.name === segment);
        if (!field) {
            return sort;
        }
        if ('fields' in field) {
            fields = field.flattenedFields;
            continue;
        }
        if ('virtual' in field && typeof field.virtual === 'string') {
            return `${desc ? '-' : ''}${field.virtual}`;
        }
    }
    return sort;
};
/**
 * Sanitizes the sort parameter, for example virtual fields linked to relationships are replaced with the full path.
 */ export const sanitizeSortQuery = ({ fields, sort })=>{
    if (!sort) {
        return undefined;
    }
    if (Array.isArray(sort)) {
        return sort.map((sort)=>sanitizeSort({
                fields,
                sort
            }));
    }
    return sanitizeSort({
        fields,
        sort
    });
};

//# sourceMappingURL=sanitizeSortQuery.js.map