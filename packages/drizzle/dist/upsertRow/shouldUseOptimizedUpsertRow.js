/**
 * Checks whether we should use the upsertRow function for the passed data and otherwise use a simple SQL SET call.
 * We need to use upsertRow only when the data has arrays, blocks, hasMany select/text/number, localized fields, complex relationships.
 */ export const shouldUseOptimizedUpsertRow = ({ data, fields })=>{
    let fieldsMatched = false;
    for(const key in data){
        const value = data[key];
        const field = fields.find((each)=>each.name === key);
        if (!field) {
            continue;
        }
        fieldsMatched = true;
        if (field.type === 'blocks' || (field.type === 'text' || field.type === 'relationship' || field.type === 'upload' || field.type === 'select' || field.type === 'number') && field.hasMany || (field.type === 'relationship' || field.type === 'upload') && Array.isArray(field.relationTo) || field.localized) {
            return false;
        }
        if (field.type === 'array') {
            if (typeof value === 'object' && '$push' in value && value.$push) {
                return shouldUseOptimizedUpsertRow({
                    // Only check first row - this function cares about field definitions. Each array row will have the same field definitions.
                    data: Array.isArray(value.$push) ? value.$push?.[0] : value.$push,
                    fields: field.flattenedFields
                });
            }
            return false;
        }
        // Handle relationship $push and $remove operations
        if ((field.type === 'relationship' || field.type === 'upload') && field.hasMany) {
            if (typeof value === 'object' && ('$push' in value || '$remove' in value)) {
                return false // Use full upsertRow for relationship operations
                ;
            }
        }
        if ((field.type === 'group' || field.type === 'tab') && value && typeof value === 'object' && !shouldUseOptimizedUpsertRow({
            data: value,
            fields: field.flattenedFields
        })) {
            return false;
        }
    }
    // Handle dot-notation paths when no fields matched
    if (!fieldsMatched) {
        for(const key in data){
            if (key.includes('.')) {
                // Split on first dot only
                const firstDotIndex = key.indexOf('.');
                const fieldName = key.substring(0, firstDotIndex);
                const remainingPath = key.substring(firstDotIndex + 1);
                const nestedData = {
                    [fieldName]: {
                        [remainingPath]: data[key]
                    }
                };
                return shouldUseOptimizedUpsertRow({
                    data: nestedData,
                    fields
                });
            }
        }
    }
    return true;
};

//# sourceMappingURL=shouldUseOptimizedUpsertRow.js.map